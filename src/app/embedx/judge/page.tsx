"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Gavel, Search, CheckCircle2, AlertTriangle, Trophy, ExternalLink, Lock } from "lucide-react";

interface ScoreBreakdown {
  ppt: number;
  presentation: number;
  prototype: number;
  simulation: number;
  qa: number;
}

interface TeamLookup {
  registrationId: string;
  teamName: string;
  leaderName: string;
  registrationStatus: string;
  score: number;
  scoreBreakdown?: ScoreBreakdown | null;
  finalScore?: number;
  finalScoreBreakdown?: ScoreBreakdown | null;
  isFinalist?: boolean;
}

interface PanelInfo {
  panelName: string;
  judges: { name: string }[];
}

export default function JudgePage() {
  const [isMounted, setIsMounted] = useState(false);
  const passkeyInputRef = useRef<HTMLInputElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [panelInfo, setPanelInfo] = useState<PanelInfo | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [registrationId, setRegistrationId] = useState("");
  const [team, setTeam] = useState<TeamLookup | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [finalRoundActive, setFinalRoundActive] = useState<boolean>(false);
  const [selectedRound, setSelectedRound] = useState<"preliminary" | "final">("preliminary");

  // 5 Scoring Parameters (each 1 to 10 scrollbar scale, default at 5)
  const [pptScore, setPptScore] = useState<number>(5);
  const [presentationScore, setPresentationScore] = useState<number>(5);
  const [prototypeScore, setPrototypeScore] = useState<number>(5);
  const [simulationScore, setSimulationScore] = useState<number>(5);
  const [qaScore, setQaScore] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedScore, setLastSubmittedScore] = useState<number | null>(null);

  // Live total sum of all 5 scrollbar scales
  const totalScore = pptScore + presentationScore + prototypeScore + simulationScore + qaScore;

  const syncLeaderboardStatus = async () => {
    try {
      const res = await fetch(`/api/embedx/leaderboard?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.finalRoundActive !== undefined) {
          const isActive = Boolean(data.finalRoundActive);
          setFinalRoundActive(isActive);
          if (isActive) {
            setSelectedRound("final");
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("embedx_judge_passkey");
    if (saved) {
      setIsAuthenticated(true);
      const savedPanel = localStorage.getItem("embedx_judge_panel");
      if (savedPanel) {
        try {
          setPanelInfo(JSON.parse(savedPanel));
        } catch {}
      }
    }

    syncLeaderboardStatus();
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      passkeyInputRef.current?.focus();
    }
  }, [isMounted, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/embedx/judge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passkeyInput }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("embedx_judge_passkey", passkeyInput);
        if (data.panel) {
          localStorage.setItem("embedx_judge_panel", JSON.stringify(data.panel));
          setPanelInfo(data.panel);
        }
        setIsAuthenticated(true);
        setPasskeyInput("");
        syncLeaderboardStatus();
      } else {
        setLoginError(data.error || "Invalid passkey.");
      }
    } catch {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("embedx_judge_passkey");
    localStorage.removeItem("embedx_judge_panel");
    setPanelInfo(null);
    setIsAuthenticated(false);
  };

  const handleLookup = async () => {
    if (!registrationId.trim()) return;
    setIsLookingUp(true);
    setLookupError("");
    setSubmitSuccess(false);
    const passkey = localStorage.getItem("embedx_judge_passkey") || "";
    try {
      const res = await fetch(
        `/api/embedx/judge/lookup?registrationId=${encodeURIComponent(registrationId.trim())}`,
        { headers: { "x-judge-password": passkey } }
      );
      const data = await res.json();
      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("embedx_judge_passkey");
        return;
      }
      if (data.success) {
        setTeam(data.data);
        const isFinal = Boolean(data.finalRoundActive) || finalRoundActive;
        if (data.finalRoundActive !== undefined) {
          setFinalRoundActive(Boolean(data.finalRoundActive));
          if (data.finalRoundActive) {
            setSelectedRound("final");
          }
        }
        
        // Load the appropriate score breakdown
        const breakdown = isFinal ? data.data.finalScoreBreakdown : data.data.scoreBreakdown;
        if (breakdown) {
          setPptScore(Number(breakdown.ppt) || 5);
          setPresentationScore(Number(breakdown.presentation) || 5);
          setPrototypeScore(Number(breakdown.prototype) || 5);
          setSimulationScore(Number(breakdown.simulation) || 5);
          setQaScore(Number(breakdown.qa) || 5);
        } else {
          setPptScore(5);
          setPresentationScore(5);
          setPrototypeScore(5);
          setSimulationScore(5);
          setQaScore(5);
        }
      } else {
        setLookupError(data.error || "Team not found.");
        setTeam(null);
      }
    } catch {
      setLookupError("Lookup failed. Please check network connection.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmitScore = async () => {
    let currentTeam = team;

    // If team has not been found yet, try looking up with entered registrationId
    if (!currentTeam) {
      if (!registrationId.trim()) {
        setSubmitError("Please enter the Team Registration ID to assign this score.");
        return;
      }
      setIsSubmitting(true);
      setSubmitError("");
      const passkey = localStorage.getItem("embedx_judge_passkey") || "";
      try {
        const lookupRes = await fetch(
          `/api/embedx/judge/lookup?registrationId=${encodeURIComponent(registrationId.trim())}`,
          { headers: { "x-judge-password": passkey } }
        );
        const lookupData = await lookupRes.json();
        if (lookupRes.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("embedx_judge_passkey");
          return;
        }
        if (!lookupData.success || !lookupData.data) {
          setSubmitError(lookupData.error || "Team not found. Please verify the Registration ID.");
          setIsSubmitting(false);
          return;
        }
        currentTeam = lookupData.data;
        setTeam(lookupData.data);
      } catch {
        setSubmitError("Failed to lookup team.");
        setIsSubmitting(false);
        return;
      }
    }

    if (!currentTeam) {
      setSubmitError("Please lookup a team first.");
      setIsSubmitting(false);
      return;
    }

    const targetTeam = currentTeam;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    const passkey = localStorage.getItem("embedx_judge_passkey") || "";

    const breakdown: ScoreBreakdown = {
      ppt: pptScore,
      presentation: presentationScore,
      prototype: prototypeScore,
      simulation: simulationScore,
      qa: qaScore,
    };

    const roundToSubmit = finalRoundActive ? "final" : selectedRound;

    try {
      const res = await fetch("/api/embedx/judge/score", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-judge-password": passkey },
        body: JSON.stringify({
          registrationId: targetTeam.registrationId,
          round: roundToSubmit,
          score: totalScore,
          scoreBreakdown: breakdown,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTeam({
          ...targetTeam,
          score: data.data.score, // Round 1 score completely intact
          scoreBreakdown: data.data.scoreBreakdown,
          finalScore: data.data.finalScore ?? targetTeam.finalScore,
          finalScoreBreakdown: data.data.finalScoreBreakdown ?? targetTeam.finalScoreBreakdown,
        });
        setLastSubmittedScore(totalScore);
        setSubmitSuccess(true);
      } else {
        setSubmitError(data.error || "Failed to update score.");
      }
    } catch {
      setSubmitError("Failed to update score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoringParameters = [
    {
      key: "ppt",
      title: "1. PPT (Presentation Deck)",
      desc: "Problem formulation, system architecture, clarity, & slide structure",
      value: pptScore,
      setter: setPptScore,
    },
    {
      key: "presentation",
      title: "2. Presentation",
      desc: "Delivery, explanation, teamwork, and adherence to the 5-min limit",
      value: presentationScore,
      setter: setPresentationScore,
    },
    {
      key: "prototype",
      title: "3. Prototype",
      desc: "Physical hardware demonstration, sensor integration, wiring, & functionality",
      value: prototypeScore,
      setter: setPrototypeScore,
    },
    {
      key: "simulation",
      title: "4. Simulation",
      desc: "Circuit simulation, software models, logic validation, and fallback verification",
      value: simulationScore,
      setter: setSimulationScore,
    },
    {
      key: "qa",
      title: "5. Q&A",
      desc: "Depth of technical understanding, circuit defense, and answering judges' queries",
      value: qaScore,
      setter: setQaScore,
    },
  ];

  if (!isMounted) {
    return (
      <div className="embedx-page-bg" style={{ minHeight: "calc(100dvh - 120px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div className="glass-card" style={{ padding: "2.5rem 2rem", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", marginBottom: "1rem" }}>
            <Gavel size={22} style={{ color: "#00f0ff" }} />
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading Judge Portal...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="embedx-page-bg" style={{ minHeight: "calc(100dvh - 120px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div className="glass-card glass-card-focus" style={{ padding: "2.5rem 2rem", maxWidth: "400px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", marginBottom: "1rem" }}>
              <Gavel size={22} style={{ color: "#00f0ff" }} />
            </div>
            <h1 style={{ fontFamily: "var(--font-space-grotesk)", color: "#f0f6ff", fontWeight: 800, fontSize: "1.375rem", margin: 0 }}>
              Judge Panel
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", marginTop: "0.35rem" }}>
              EmbedX 2026 &middot; Score submission
            </p>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} suppressHydrationWarning>
            <input
              ref={passkeyInputRef}
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="Judge passkey"
              className="form-input"
              suppressHydrationWarning
            />
            {loginError && (
              <span style={{ color: "#f87171", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <AlertTriangle size={14} /> {loginError}
              </span>
            )}
            <button type="submit" className="btn-primary" disabled={isLoggingIn} suppressHydrationWarning>
              {isLoggingIn ? "Verifying..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isFinalEvaluation = finalRoundActive || selectedRound === "final";

  return (
    <div className="embedx-page-bg" style={{ minHeight: "calc(100dvh - 120px)", padding: "2rem 1.25rem" }}>
      {/* Dynamic Range Thumb CSS */}
      <style jsx global>{`
        .judge-scrollbar-scale::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${isFinalEvaluation ? "#fbbf24" : "#00f0ff"};
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${isFinalEvaluation ? "rgba(251, 191, 36, 0.9)" : "rgba(0, 240, 255, 0.9)"}, 0 0 20px ${isFinalEvaluation ? "rgba(251, 191, 36, 0.4)" : "rgba(0, 240, 255, 0.4)"};
          transition: transform 0.1s ease;
        }
        .judge-scrollbar-scale::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .judge-scrollbar-scale::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${isFinalEvaluation ? "#fbbf24" : "#00f0ff"};
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${isFinalEvaluation ? "rgba(251, 191, 36, 0.9)" : "rgba(0, 240, 255, 0.9)"};
        }
      `}</style>

      <div style={{ maxWidth: "680px", margin: "0 auto" }} className="animate-fade-in-up">
        
        {/* Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-space-grotesk)", color: "#f0f6ff", fontWeight: 800, fontSize: "1.375rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <Gavel size={20} style={{ color: isFinalEvaluation ? "#fbbf24" : "#00f0ff" }} /> {panelInfo?.panelName || "Judge Panel"}
            </h1>
            {panelInfo?.judges && panelInfo.judges.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Judges:</span>
                {panelInfo.judges.map((j, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.75rem",
                      background: isFinalEvaluation ? "rgba(251,191,36,0.1)" : "rgba(0,240,255,0.1)",
                      border: `1px solid ${isFinalEvaluation ? "rgba(251,191,36,0.25)" : "rgba(0,240,255,0.25)"}`,
                      color: isFinalEvaluation ? "#fde047" : "#38bdf8",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {j.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Link
              href="/embedx/leaderboard"
              target="_blank"
              style={{
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.35)",
                color: "#fbbf24",
                fontSize: "0.8125rem",
                padding: "0.4rem 0.875rem",
                borderRadius: "0.375rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <Trophy size={14} />
              <span>Live Leaderboard</span>
              <ExternalLink size={12} />
            </Link>

            <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card" style={{ padding: "1.75rem" }}>
          
          {/* SECTION 1: Team Registration ID Lookup */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem", display: "block", fontWeight: 600 }}>
              Team Registration ID
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="e.g. EMBX-2026-XXXX"
                className="form-input"
                suppressHydrationWarning
                style={{ fontFamily: "monospace", textTransform: "uppercase", fontSize: "0.95rem" }}
              />
              <button
                onClick={handleLookup}
                className="btn-primary"
                disabled={isLookingUp}
                suppressHydrationWarning
                style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0 1.25rem" }}
              >
                <Search size={16} />
                {isLookingUp ? "..." : "Find Team"}
              </button>
            </div>

            {lookupError && (
              <span style={{ color: "#f87171", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem" }}>
                <AlertTriangle size={14} /> {lookupError}
              </span>
            )}

            {/* Team Details Banner if found */}
            {team && (
              <div
                style={{
                  background: isFinalEvaluation ? "rgba(234,179,8,0.1)" : "rgba(15,23,42,0.7)",
                  border: `1px solid ${isFinalEvaluation ? "rgba(251,191,36,0.4)" : "rgba(0,240,255,0.3)"}`,
                  borderRadius: "0.75rem",
                  padding: "1rem 1.25rem",
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc" }}>{team.teamName}</span>
                    {team.isFinalist && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", padding: "0.15rem 0.5rem", borderRadius: "1rem" }}>
                        ⭐ Top 20 Finalist
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Leader: <span style={{ color: "#cbd5e1" }}>{team.leaderName}</span> &middot;{" "}
                    <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{team.registrationId}</span>
                  </div>
                  {isFinalEvaluation && !team.isFinalist && (
                    <div style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem", fontWeight: 600 }}>
                      ⚠️ This team is not in the Top 20 Finalists for the Final Round.
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Current Score
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: isFinalEvaluation ? "#fbbf24" : "#00f0ff" }}>
                    {isFinalEvaluation ? (team.finalScore ?? 0) : team.score} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>PTS</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: 5 Parameter Scoring Scales (ALWAYS SHOWN) */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,240,255,0.12)" }}>
            {/* 5 Scrollbar Scale Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {scoringParameters.map((param) => {
                const percentage = ((param.value - 1) / 9) * 100;
                return (
                  <div
                    key={param.key}
                    style={{
                      background: "rgba(15,23,42,0.5)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0.75rem",
                      padding: "1rem 1.15rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f1f5f9" }}>
                        {param.title}
                      </div>
                      <div
                        style={{
                          background: isFinalEvaluation ? "rgba(251,191,36,0.15)" : "rgba(0,240,255,0.12)",
                          border: `1px solid ${isFinalEvaluation ? "rgba(251,191,36,0.4)" : "rgba(0,240,255,0.35)"}`,
                          color: isFinalEvaluation ? "#fbbf24" : "#00f0ff",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.9rem",
                          fontWeight: 800,
                          fontFamily: "monospace",
                          boxShadow: isFinalEvaluation ? "0 0 8px rgba(251,191,36,0.25)" : "0 0 8px rgba(0,240,255,0.2)",
                        }}
                      >
                        {param.value} / 10
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                      {param.desc}
                    </div>

                    {/* Scrollbar Scale Input */}
                    <div style={{ position: "relative", marginBottom: "0.4rem" }}>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={param.value}
                        onChange={(e) => {
                          param.setter(Number(e.target.value));
                          setSubmitSuccess(false);
                        }}
                        className="judge-scrollbar-scale"
                        style={{
                          width: "100%",
                          height: "10px",
                          borderRadius: "8px",
                          outline: "none",
                          cursor: "pointer",
                          appearance: "none",
                          WebkitAppearance: "none",
                          background: isFinalEvaluation
                            ? `linear-gradient(to right, #eab308 0%, #fbbf24 ${percentage}%, rgba(30, 41, 59, 0.9) ${percentage}%, rgba(30, 41, 59, 0.9) 100%)`
                            : `linear-gradient(to right, #00f0ff 0%, #3b82f6 ${percentage}%, rgba(30, 41, 59, 0.9) ${percentage}%, rgba(30, 41, 59, 0.9) 100%)`,
                          border: `1px solid ${isFinalEvaluation ? "rgba(251, 191, 36, 0.3)" : "rgba(0, 240, 255, 0.3)"}`,
                        }}
                      />
                    </div>

                    {/* Tick Mark Numbers 1 to 10 */}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isCurrent = param.value === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              param.setter(num);
                              setSubmitSuccess(false);
                            }}
                            style={{
                              background: isCurrent
                                ? isFinalEvaluation
                                  ? "rgba(251,191,36,0.3)"
                                  : "rgba(0,240,255,0.25)"
                                : "transparent",
                              border: isCurrent
                                ? `1px solid ${isFinalEvaluation ? "rgba(251,191,36,0.6)" : "rgba(0,240,255,0.5)"}`
                                : "1px solid transparent",
                              borderRadius: "0.25rem",
                              color: isCurrent
                                ? isFinalEvaluation
                                  ? "#fbbf24"
                                  : "#00f0ff"
                                : "#64748b",
                              fontSize: "0.75rem",
                              fontWeight: isCurrent ? 800 : 500,
                              cursor: "pointer",
                              width: "24px",
                              height: "22px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "monospace",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Score Calculation Box */}
            <div
              style={{
                background: isFinalEvaluation ? "rgba(251,191,36,0.08)" : "rgba(0,240,255,0.08)",
                border: `1px solid ${isFinalEvaluation ? "rgba(251,191,36,0.3)" : "rgba(0,240,255,0.3)"}`,
                borderRadius: "0.75rem",
                padding: "1.1rem 1.25rem",
                marginTop: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                  Total {isFinalEvaluation ? "Final Round" : "Calculated"} Score
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                  PPT ({pptScore}) + Presentation ({presentationScore}) + Prototype ({prototypeScore}) + Simulation ({simulationScore}) + Q&amp;A ({qaScore})
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                <span style={{ fontSize: "2.25rem", fontWeight: 900, color: isFinalEvaluation ? "#fbbf24" : "#00f0ff", textShadow: isFinalEvaluation ? "0 0 16px rgba(251,191,36,0.5)" : "0 0 16px rgba(0,240,255,0.5)" }}>
                  {totalScore}
                </span>
                <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>/ 50</span>
              </div>
            </div>

            {/* Feedback Messages */}
            {submitError && (
              <div style={{ color: "#f87171", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "1rem", padding: "0.6rem 0.85rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.25)" }}>
                <AlertTriangle size={15} /> {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                style={{
                  color: "#4ade80",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <CheckCircle2 size={16} style={{ color: "#4ade80" }} />
                  <span>
                    Score of <strong>{lastSubmittedScore ?? totalScore}</strong> saved successfully! Leaderboard is live.
                  </span>
                </div>
                <Link
                  href="/embedx/leaderboard"
                  target="_blank"
                  style={{
                    color: "#4ade80",
                    textDecoration: "underline",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  View on Leaderboard &rarr;
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitScore}
              className="btn-primary"
              disabled={isSubmitting || (isFinalEvaluation && team ? !team.isFinalist : false)}
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                marginTop: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: isFinalEvaluation ? "linear-gradient(135deg, #eab308, #ca8a04)" : undefined,
                color: isFinalEvaluation ? "#000" : undefined,
                opacity: isFinalEvaluation && team && !team.isFinalist ? 0.4 : 1,
              }}
            >
              <span>
                {isSubmitting
                  ? "Submitting Score to Leaderboard..."
                  : isFinalEvaluation && team && !team.isFinalist
                  ? "Team Not in Top 20 Finalists"
                  : team
                  ? `Submit Score (${totalScore} / 50) for ${team.teamName}`
                  : `Submit Score (${totalScore} / 50)`}
              </span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
