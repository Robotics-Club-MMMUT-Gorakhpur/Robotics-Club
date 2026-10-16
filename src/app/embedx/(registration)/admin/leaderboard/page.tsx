"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Trophy, Gavel, RefreshCw, ExternalLink } from "lucide-react";

interface Team {
  _id?: string;
  id?: string;
  registrationId?: string;
  name: string;
  score: number;
  initialScore?: number;
  initialRank?: number;
  isTop20?: boolean;
}

export default function AdminLeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [finalRoundActive, setFinalRoundActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"final" | "preliminary">("final");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState<boolean>(false);
  const [isUpdatingFinalRound, setIsUpdatingFinalRound] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    setIsSuperAdmin(localStorage.getItem("embedx_admin_role") === "super");
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const passkey = localStorage.getItem("embedx_admin_passkey") || "";
      const response = await fetch(`/api/embedx/leaderboard?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "x-admin-password": passkey,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsHidden(Boolean(data.hidden));
        setFinalRoundActive(Boolean(data.finalRoundActive));
        setTeams(data.teams || []);
        setFinalTeams(data.finalTeams || []);
      }
    } catch (error) {
      console.error("Failed to fetch admin leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Poll every 5 seconds for live real-time score updates
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  // When final round is active, default to final round unless user toggles
  const currentTab: "final" | "preliminary" = finalRoundActive ? activeTab : "preliminary";

  const toggleHidden = async () => {
    setIsUpdatingVisibility(true);
    try {
      const passkey = localStorage.getItem("embedx_admin_passkey") || "";
      const response = await fetch("/api/embedx/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passkey,
        },
        body: JSON.stringify({ key: "leaderboard_hidden", value: !isHidden }),
      });
      const data = await response.json();
      if (data.success) {
        setIsHidden(!isHidden);
        fetchLeaderboard();
      } else {
        alert(data.error || "Failed to update leaderboard visibility. Are you a Super Admin?");
      }
    } catch (error) {
      console.error("Failed to update visibility setting:", error);
      alert("Error updating visibility setting.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const toggleFinalRound = async () => {
    setIsUpdatingFinalRound(true);
    try {
      const passkey = localStorage.getItem("embedx_admin_passkey") || "";
      const response = await fetch("/api/embedx/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passkey,
        },
        body: JSON.stringify({ key: "finalRoundActive", value: !finalRoundActive }),
      });
      const data = await response.json();
      if (data.success) {
        setFinalRoundActive(!finalRoundActive);
        fetchLeaderboard();
      } else {
        alert(data.error || "Failed to update Final Round. Are you a Super Admin?");
      }
    } catch (error) {
      console.error("Failed to update final round setting:", error);
      alert("Error updating final round setting.");
    } finally {
      setIsUpdatingFinalRound(false);
    }
  };

  // Sort Preliminary teams: by prelim score descending, then alphabetically
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Sort Finalists: by final score descending; if tied, seed rank
  const sortedFinalTeams = [...finalTeams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.initialRank || 99) !== (b.initialRank || 99)) return (a.initialRank || 99) - (b.initialRank || 99);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="embedx-page-bg" style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        
        {/* Top Header & Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                Embed<span className="neon-text">X</span> Admin Leaderboard
              </h1>
              <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)", color: "#38bdf8", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "1rem" }}>
                Admin Portal
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", marginTop: "0.35rem" }}>
              Real-time monitoring &bull; Live updates every 5 seconds
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            {isSuperAdmin && (
              <>
                {/* Hide / Show Public Leaderboard Toggle */}
                <button
                  onClick={toggleHidden}
                  disabled={isUpdatingVisibility}
                  style={{
                    background: isHidden ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                    border: isHidden ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(34,197,94,0.4)",
                    color: isHidden ? "#f87171" : "#4ade80",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "0.5rem",
                    cursor: isUpdatingVisibility ? "wait" : "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    opacity: isUpdatingVisibility ? 0.7 : 1,
                  }}
                  title={isHidden ? "Click to make leaderboards visible to public" : "Click to hide leaderboards from public"}
                >
                  {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{isUpdatingVisibility ? "Updating..." : isHidden ? "Leaderboard Hidden" : "Hide Leaderboard"}</span>
                </button>

                {/* Final Round ON / OFF Toggle */}
                <button
                  onClick={toggleFinalRound}
                  disabled={isUpdatingFinalRound}
                  style={{
                    background: finalRoundActive ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${finalRoundActive ? "rgba(234,179,8,0.5)" : "rgba(255,255,255,0.15)"}`,
                    color: finalRoundActive ? "#fbbf24" : "#94a3b8",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "0.5rem",
                    cursor: isUpdatingFinalRound ? "wait" : "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    opacity: isUpdatingFinalRound ? 0.7 : 1,
                  }}
                  title="Toggle Final Round Top 20 Qualifier Mode"
                >
                  <Trophy size={14} style={{ color: finalRoundActive ? "#fbbf24" : "#94a3b8" }} />
                  <span>{finalRoundActive ? "Final Round ON" : "Final Round OFF"}</span>
                </button>
              </>
            )}

            <Link
              href="/embedx/judge"
              target="_blank"
              style={{
                background: "rgba(0,240,255,0.1)",
                border: "1px solid rgba(0,240,255,0.3)",
                color: "#00f0ff",
                padding: "0.5rem 0.9rem",
                borderRadius: "0.5rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <Gavel size={14} />
              <span>Judge</span>
            </Link>

            <Link
              href="/embedx/leaderboard"
              target="_blank"
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
                color: "#fbbf24",
                padding: "0.5rem 0.9rem",
                borderRadius: "0.5rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <ExternalLink size={14} />
              <span>Public</span>
            </Link>

            <Link
              href="/embedx/admin"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e2e8f0",
                padding: "0.5rem 0.9rem",
                borderRadius: "0.5rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} />
              <span>Admin Center</span>
            </Link>
          </div>
        </div>

        {/* Status Indicators Banner */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
          {/* Public Visibility Indicator */}
          {isHidden ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#f87171",
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              <EyeOff size={13} />
              <span>PUBLIC STATUS: HIDDEN FROM PUBLIC (VISIBLE ONLY IN ADMIN PANEL)</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ade80",
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              <Eye size={13} />
              <span>PUBLIC STATUS: LIVE &amp; VISIBLE TO ALL VISITORS</span>
            </div>
          )}

          {/* Final Round Active Indicator */}
          {finalRoundActive && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(251,191,36,0.15)",
                border: "1px solid rgba(251,191,36,0.4)",
                color: "#fde047",
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              <span>🏆</span>
              <span>FINAL ROUND ACTIVE (TOP 20 QUALIFIERS)</span>
            </div>
          )}
        </div>

        {/* TAB SWITCHER: Shown when Final Round is active so admins can see BOTH leaderboards */}
        {finalRoundActive && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(59,130,246,0.3)",
              padding: "0.35rem",
              borderRadius: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <button
              onClick={() => setActiveTab("final")}
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${currentTab === "final" ? "rgba(251,191,36,0.5)" : "transparent"}`,
                background: currentTab === "final" ? "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(202,138,4,0.15))" : "transparent",
                color: currentTab === "final" ? "#fbbf24" : "#94a3b8",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
                fontFamily: "var(--font-space-grotesk)",
              }}
            >
              <span>🏆</span>
              <span>Final Round Leaderboard (Top 20)</span>
            </button>

            <button
              onClick={() => setActiveTab("preliminary")}
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${currentTab === "preliminary" ? "rgba(56,189,248,0.5)" : "transparent"}`,
                background: currentTab === "preliminary" ? "linear-gradient(135deg, rgba(56,189,248,0.25), rgba(14,165,233,0.15))" : "transparent",
                color: currentTab === "preliminary" ? "#38bdf8" : "#94a3b8",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
                fontFamily: "var(--font-space-grotesk)",
              }}
            >
              <span>⚡</span>
              <span>Preliminary Leaderboard (Round 1)</span>
            </button>
          </div>
        )}

        {/* Main Leaderboard Table Container */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          
          {/* Table Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              marginBottom: "0.5rem",
              borderBottom: `1px solid ${currentTab === "final" ? "rgba(251,191,36,0.3)" : "rgba(59,130,246,0.3)"}`,
              color: "#94a3b8",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontFamily: "var(--font-space-grotesk)",
            }}
          >
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <div style={{ width: "3.5rem" }}>RANK</div>
              <div>{currentTab === "final" ? "TOP 20 FINALISTS" : "TEAM NAME"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {currentTab === "final" ? "FINAL SCORE" : "ROUND 1 SCORE"}
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#38bdf8", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <RefreshCw size={24} className="animate-spin" />
              <span>Loading Live Admin Rankings...</span>
            </div>
          ) : currentTab === "final" ? (
            /* FINAL ROUND LEADERBOARD (TOP 20) */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sortedFinalTeams.map((team, idx) => {
                let rankDisplay: React.ReactNode = `#${idx + 1}`;
                if (team.score > 0) {
                  if (idx === 0) rankDisplay = <span style={{ color: "#fbbf24", fontWeight: 800 }}>🥇 #1</span>;
                  else if (idx === 1) rankDisplay = <span style={{ color: "#d4d4d8", fontWeight: 800 }}>🥈 #2</span>;
                  else if (idx === 2) rankDisplay = <span style={{ color: "#f97316", fontWeight: 800 }}>🥉 #3</span>;
                }

                const key = team.id || team._id || `final-${idx}`;

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 0.5rem",
                      borderBottom: "1px solid rgba(251,191,36,0.12)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", minWidth: 0 }}>
                      <div style={{ width: "3.5rem", color: "#fbbf24", fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>
                        {rankDisplay}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: "0.95rem" }}>{team.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace", marginTop: "0.15rem" }}>
                          <span style={{ color: "#38bdf8" }}>{team.registrationId}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", paddingLeft: "1rem", flexShrink: 0 }}>
                      <span style={{ color: "#fbbf24", fontWeight: 800, fontFamily: "monospace", fontSize: "1.1rem" }}>
                        {team.score.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.25rem", fontFamily: "monospace" }}>
                        PTS
                      </span>
                    </div>
                  </div>
                );
              })}
              {sortedFinalTeams.length === 0 && (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
                  No finalists loaded yet. Turn ON Final Round to populate top 20 qualifiers.
                </div>
              )}
            </div>
          ) : (
            /* PRELIMINARY ROUND LEADERBOARD */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sortedTeams.map((team, idx) => {
                let rankDisplay: React.ReactNode = `#${idx + 1}`;
                if (team.score === 0) rankDisplay = "-";
                else if (idx === 0) rankDisplay = <span style={{ color: "#fbbf24", fontWeight: 800 }}>🥇 #1</span>;
                else if (idx === 1) rankDisplay = <span style={{ color: "#d4d4d8", fontWeight: 800 }}>🥈 #2</span>;
                else if (idx === 2) rankDisplay = <span style={{ color: "#f97316", fontWeight: 800 }}>🥉 #3</span>;

                const isTop20 = finalRoundActive && idx < 20;
                const key = team.id || team._id || `team-${idx}`;

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 0.5rem",
                      borderBottom: "1px solid rgba(59,130,246,0.1)",
                      background: isTop20 ? "rgba(59,130,246,0.05)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", minWidth: 0 }}>
                      <div style={{ width: "3.5rem", color: "#94a3b8", fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>
                        {rankDisplay}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: "0.95rem" }}>{team.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace", marginTop: "0.15rem" }}>
                          <span style={{ color: "#38bdf8" }}>{team.registrationId}</span>
                          {isTop20 && (
                            <span style={{ marginLeft: "0.5rem", color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", padding: "0.1rem 0.4rem", borderRadius: "0.75rem", fontSize: "0.68rem", fontWeight: 700 }}>
                              ⭐ Top 20 Qualifier
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", paddingLeft: "1rem", flexShrink: 0 }}>
                      <span style={{ color: "#38bdf8", fontWeight: 800, fontFamily: "monospace", fontSize: "1.1rem" }}>
                        {team.score.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.25rem", fontFamily: "monospace" }}>
                        PTS
                      </span>
                    </div>
                  </div>
                );
              })}
              {sortedTeams.length === 0 && (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
                  No teams ranked yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
