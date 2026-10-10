"use client";

import { useEffect, useState } from "react";
import { Gavel, Search, CheckCircle2, AlertTriangle } from "lucide-react";

interface TeamLookup {
  registrationId: string;
  teamName: string;
  leaderName: string;
  registrationStatus: string;
  score: number;
}

export default function JudgePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [registrationId, setRegistrationId] = useState("");
  const [team, setTeam] = useState<TeamLookup | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [scoreInput, setScoreInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("embedx_judge_passkey");
    if (saved) setIsAuthenticated(true);
  }, []);

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
        setIsAuthenticated(true);
        setPasskeyInput("");
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
    setIsAuthenticated(false);
  };

  const handleLookup = async () => {
    if (!registrationId.trim()) return;
    setIsLookingUp(true);
    setLookupError("");
    setTeam(null);
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
        setScoreInput(String(data.data.score ?? 0));
      } else {
        setLookupError(data.error || "Team not found.");
      }
    } catch {
      setLookupError("Lookup failed. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!team) return;
    const numericScore = Number(scoreInput);
    if (!Number.isFinite(numericScore) || numericScore < 0) {
      setSubmitError("Enter a valid, non-negative score.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    const passkey = localStorage.getItem("embedx_judge_passkey") || "";
    try {
      const res = await fetch("/api/embedx/judge/score", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-judge-password": passkey },
        body: JSON.stringify({ registrationId: team.registrationId, score: numericScore }),
      });
      const data = await res.json();
      if (data.success) {
        setTeam({ ...team, score: data.data.score });
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
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="Judge passkey"
              className="form-input"
              autoFocus
            />
            {loginError && (
              <span style={{ color: "#f87171", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <AlertTriangle size={14} /> {loginError}
              </span>
            )}
            <button type="submit" className="btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? "Verifying..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="embedx-page-bg" style={{ minHeight: "calc(100dvh - 120px)", padding: "2rem 1.25rem" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }} className="animate-fade-in-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", color: "#f0f6ff", fontWeight: 800, fontSize: "1.375rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Gavel size={20} style={{ color: "#00f0ff" }} /> Judge Panel
          </h1>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}>
            Logout
          </button>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <label style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
            Team Registration ID
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              value={registrationId}
              onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="EMBX-2026-XXXX"
              className="form-input"
              style={{ fontFamily: "monospace", textTransform: "uppercase" }}
            />
            <button onClick={handleLookup} className="btn-primary" disabled={isLookingUp} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <Search size={16} />
              {isLookingUp ? "..." : "Find"}
            </button>
          </div>
          {lookupError && (
            <span style={{ color: "#f87171", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <AlertTriangle size={14} /> {lookupError}
            </span>
          )}

          {team && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,240,255,0.08)" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f0f6ff" }}>{team.teamName}</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Led by {team.leaderName} &middot; {team.registrationId}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                  Current score: <strong style={{ color: "#00f0ff" }}>{team.score}</strong>
                </div>
              </div>

              <label style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
                New Score
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  min={0}
                  value={scoreInput}
                  onChange={(e) => {
                    setScoreInput(e.target.value);
                    setSubmitSuccess(false);
                  }}
                  className="form-input"
                />
                <button onClick={handleSubmitScore} className="btn-primary" disabled={isSubmitting} style={{ flexShrink: 0 }}>
                  {isSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>

              {submitError && (
                <span style={{ color: "#f87171", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem" }}>
                  <AlertTriangle size={14} /> {submitError}
                </span>
              )}
              {submitSuccess && (
                <span style={{ color: "#4ade80", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem" }}>
                  <CheckCircle2 size={14} /> Score saved — leaderboard updated.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
