"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MemberItem } from "@/lib/db";
import {
  RefreshCw,
  Download,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  Phone,
  Copy,
  Check,
  ImageIcon,
  AlertTriangle,
  Search,
  ExternalLink,
  X,
  ArrowRight,
  Trophy,
  Gavel,
} from "lucide-react";

interface RegistrationItem {
  id: string;
  registrationId: string;
  teamName: string;
  leaderName: string;
  leaderRollNumber: string;
  leaderBranch: string;
  leaderYear: string;
  mobile: string;
  email: string;
  memberCount: number;
  members: MemberItem[];
  utr: string;
  paymentScreenshotUrl: string;
  paymentScreenshotPath: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  registrationStatus: "PENDING" | "CONFIRMED" | "REJECTED";
  editLogs?: { timestamp: string; editedBy: string; changes: string }[];
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, pending: 0, confirmed: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; team: string; utr: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [loadingReceiptFor, setLoadingReceiptFor] = useState<string | null>(null);
  const [showActivityLogs, setShowActivityLogs] = useState<boolean>(false);
  const [allowParticipantEdits, setAllowParticipantEdits] = useState<boolean>(true);
  const [isTogglingEdits, setIsTogglingEdits] = useState<boolean>(false);
  const [registrationsClosed, setRegistrationsClosed] = useState<boolean>(false);
  const [isTogglingRegistrations, setIsTogglingRegistrations] = useState<boolean>(false);

  // Check saved passkey on mount
  useEffect(() => {
    const saved = localStorage.getItem("embedx_admin_passkey");
    if (saved) {
      setIsAuthenticated(true);
      setIsSuperAdmin(localStorage.getItem("embedx_admin_role") === "super");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";
    try {
      const res = await fetch("/api/embedx/admin/settings", {
        headers: { "x-admin-password": passkey }
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setAllowParticipantEdits(data.settings.allowParticipantEdits !== false); // default true if undefined
        setRegistrationsClosed(data.settings.registrationsClosed === true); // default false if undefined
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  }, []);

  const toggleEdits = async () => {
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";
    setIsTogglingEdits(true);
    try {
      const res = await fetch("/api/embedx/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": passkey },
        body: JSON.stringify({ key: "allowParticipantEdits", value: !allowParticipantEdits })
      });
      const data = await res.json();
      if (data.success) {
        setAllowParticipantEdits(!allowParticipantEdits);
      } else {
        alert(data.error || "Failed to update setting. Are you a Super Admin?");
      }
    } catch (err) {
      alert("Failed to update setting.");
    } finally {
      setIsTogglingEdits(false);
    }
  };

  const toggleRegistrations = async () => {
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";
    setIsTogglingRegistrations(true);
    try {
      const res = await fetch("/api/embedx/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": passkey },
        body: JSON.stringify({ key: "registrationsClosed", value: !registrationsClosed })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationsClosed(!registrationsClosed);
      } else {
        alert(data.error || "Failed to update setting. Are you a Super Admin?");
      }
    } catch (err) {
      alert("Failed to update setting.");
    } finally {
      setIsTogglingRegistrations(false);
    }
  };

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";

    try {
      const url = new URL("/api/embedx/admin/registrations", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("query", searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: {
          "x-admin-password": passkey,
        },
      });

      const data = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("embedx_admin_passkey");
        setErrorMsg("Session expired or invalid passkey.");
        return;
      }

      if (data.success) {
        setRegistrations(data.data || []);
        if (data.stats) setStats(data.stats);
      } else {
        setErrorMsg(data.error || "Failed to fetch registrations.");
      }
    } catch {
      setErrorMsg("Network error connecting to database.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchSettings();
    }
  }, [isAuthenticated, fetchRegistrations, fetchSettings]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/embedx/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passkeyInput }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("embedx_admin_passkey", passkeyInput);
        localStorage.setItem("embedx_admin_role", data.role || "readonly");
        setIsAuthenticated(true);
        setIsSuperAdmin(data.role === "super");
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

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("embedx_admin_passkey");
    localStorage.removeItem("embedx_admin_role");
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
  };

  // Copy UTR helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Screenshots are excluded from the bulk list query (they can be several MB
  // each as base64), so fetch one on demand only when the admin asks to view it.
  const fetchReceipt = async (registrationId: string, team: string, utr: string) => {
    setLoadingReceiptFor(registrationId);
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";
    try {
      const res = await fetch(`/api/embedx/admin/registrations/${registrationId}`, {
        headers: { "x-admin-password": passkey },
      });
      const json = await res.json();
      if (json.success && json.data?.paymentScreenshotUrl) {
        setSelectedReceipt({ url: json.data.paymentScreenshotUrl, team, utr });
      } else {
        alert(json.error || "Could not load receipt for this team.");
      }
    } catch {
      alert("Failed to load receipt.");
    } finally {
      setLoadingReceiptFor(null);
    }
  };

  // Update Status
  const handleUpdateStatus = async (
    registrationId: string,
    newStatus: "CONFIRMED" | "REJECTED"
  ) => {
    setUpdatingId(registrationId);
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";

    const paymentStatus = newStatus === "CONFIRMED" ? "VERIFIED" : "REJECTED";

    try {
      const res = await fetch("/api/embedx/admin/registrations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passkey,
        },
        body: JSON.stringify({
          registrationId,
          paymentStatus,
          registrationStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchRegistrations();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Error connecting to server.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    const passkey = localStorage.getItem("embedx_admin_passkey") || "";
    window.open(`/api/embedx/admin/export?passkey=${encodeURIComponent(passkey)}`, "_blank");
  };

  // Login Barrier Screen
  if (!isAuthenticated) {
    return (
      <div className="embedx-page-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="glass-card animate-fade-in-up" style={{ maxWidth: "420px", width: "100%", padding: "2.5rem 2rem", textAlign: "center", border: "1px solid rgba(0,240,255,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Image src="/images/rc-logo.png" alt="Robotics Club" width={44} height={44} style={{ objectFit: "contain" }} />
            <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.2)" }} />
            <Image src="/images/mmmut-logo.png" alt="MMMUT" width={44} height={44} style={{ objectFit: "contain" }} />
          </div>

          <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.25rem" }}>
            Embed<span className="neon-text">X</span> Admin Portal
          </h2>
          <p style={{ fontSize: "0.84rem", color: "#94a3b8", marginBottom: "2rem" }}>
            Robotics Club MMMUT · MongoDB Atlas Backend
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>
                Admin Security Passkey
              </label>
              <input
                type="password"
                placeholder="Enter admin password..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                suppressHydrationWarning
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(0,240,255,0.25)",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>

            {loginError && (
              <div style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: "1rem", padding: "0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.375rem" }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary"
              suppressHydrationWarning
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              <span>{isLoggingIn ? "Authenticating..." : "Access Dashboard"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#64748b" }}>
            Restricted to authorized Robotics Club administrators.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="embedx-page-bg" style={{ minHeight: "100vh", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Image src="/images/rc-logo.png" alt="Robotics Club" width={42} height={42} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                  Embed<span className="neon-text">X</span> Admin Control Center
                </h1>
                <span style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "1rem" }}>
                  MongoDB Atlas
                </span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#38bdf8", letterSpacing: "1px", textTransform: "uppercase" }}>
                Robotics Club MMMUT · Flagship 2026
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/embedx/admin/leaderboard"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
            >
              <Trophy size={14} />
              <span>Leaderboard</span>
            </Link>
            <Link
              href="/embedx/judge"
              target="_blank"
              style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
            >
              <Gavel size={14} />
              <span>Judge Panel</span>
            </Link>
            <button
              onClick={() => setShowActivityLogs(true)}
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Clock size={14} />
              <span>Activity Logs</span>
            </button>
            <button
              onClick={toggleEdits}
              disabled={isTogglingEdits}
              style={{ background: allowParticipantEdits ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)", border: `1px solid ${allowParticipantEdits ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.3)"}`, color: allowParticipantEdits ? "#4ade80" : "#f87171", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <div style={{ width: "24px", height: "14px", background: allowParticipantEdits ? "#4ade80" : "rgba(255,255,255,0.2)", borderRadius: "12px", position: "relative", transition: "all 0.3s" }}>
                <div style={{ width: "10px", height: "10px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: allowParticipantEdits ? "12px" : "2px", transition: "all 0.3s" }} />
              </div>
              <span>{allowParticipantEdits ? "Edits Open" : "Edits Locked"}</span>
            </button>
            <button
              onClick={toggleRegistrations}
              disabled={isTogglingRegistrations}
              style={{ background: !registrationsClosed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)", border: `1px solid ${!registrationsClosed ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.3)"}`, color: !registrationsClosed ? "#4ade80" : "#f87171", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <div style={{ width: "24px", height: "14px", background: !registrationsClosed ? "#4ade80" : "rgba(255,255,255,0.2)", borderRadius: "12px", position: "relative", transition: "all 0.3s" }}>
                <div style={{ width: "10px", height: "10px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: !registrationsClosed ? "12px" : "2px", transition: "all 0.3s" }} />
              </div>
              <span>{registrationsClosed ? "Registrations Closed" : "Registrations Open"}</span>
            </button>
            <button
              onClick={fetchRegistrations}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCsv}
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleLogout}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { title: "Total Registered", count: stats.total, color: "#38bdf8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)", icon: Users },
            { title: "Pending Verification", count: stats.pending, color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", icon: Clock },
            { title: "Confirmed Teams", count: stats.confirmed, color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", icon: CheckCircle2 },
            { title: "Rejected", count: stats.rejected, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", icon: XCircle },
          ].map((card) => {
            const IconComp = card.icon;
            return (
              <div key={card.title} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{card.title}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: card.color, marginTop: "0.25rem" }}>{card.count}</div>
                </div>
                <div style={{ color: card.color }}>
                  <IconComp size={32} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search Bar */}
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === st ? "1px solid #00f0ff" : "1px solid rgba(255,255,255,0.1)",
                  background: statusFilter === st ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.03)",
                  color: statusFilter === st ? "#00f0ff" : "#94a3b8",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: "flex", gap: "0.5rem", flex: "1 1 280px", maxWidth: "420px", position: "relative" }}>
            <div style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", display: "flex", alignItems: "center" }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by Transaction ID (UTR), Team, Leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 1rem 0.55rem 2.4rem",
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(0,240,255,0.25)",
                borderRadius: "0.375rem",
                color: "#f8fafc",
                fontSize: "0.88rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{ padding: "1rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", color: "#f87171", marginBottom: "1.5rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Registrations Table */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading registrations from MongoDB Atlas...</div>
          ) : registrations.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              No registration records found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "1px" }}>
                    <th style={{ padding: "0.875rem 1rem" }}>Reg ID & Date</th>
                    <th style={{ padding: "0.875rem 1rem" }}>Team & Leader</th>
                    <th style={{ padding: "0.875rem 1rem" }}>Contact</th>
                    <th style={{ padding: "0.875rem 1rem" }}>Members</th>
                    <th style={{ padding: "0.875rem 1rem" }}>Transaction ID (UTR) & Receipt</th>
                    <th style={{ padding: "0.875rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.875rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {/* ID & Date */}
                      <td style={{ padding: "1rem" }}>
                        <Link href={`/embedx/dashboard/${item.registrationId}`} target="_blank" style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace", textDecoration: "none" }}>
                          {item.registrationId}
                        </Link>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                          {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>

                      {/* Team & Leader */}
                      <td style={{ padding: "1rem" }}>
                        <Link
                          href={`/embedx/admin/${item.registrationId}`}
                          style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem", textDecoration: "none" }}
                          title="View full details"
                        >
                          {item.teamName}
                        </Link>
                        <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Crown size={14} style={{ color: "#fbbf24" }} />
                          <span>{item.leaderName} ({item.leaderBranch} · Yr {item.leaderYear} · Roll: {item.leaderRollNumber || "N/A"})</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ color: "#e2e8f0" }}>{item.email}</div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Phone size={13} />
                          <span>{item.mobile}</span>
                        </div>
                      </td>

                      {/* Members */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{item.memberCount} Total</div>
                        {item.members && item.members.length > 0 && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                            {item.members.map((m) => m.name).join(", ")}
                          </div>
                        )}
                      </td>

                      {/* UTR & Screenshot */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, fontSize: "0.9rem" }}>{item.utr}</span>
                          <button
                            onClick={() => copyToClipboard(item.utr)}
                            title="Copy Transaction ID"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#cbd5e1", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.7rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                          >
                            {copiedUtr === item.utr ? <Check size={12} style={{ color: "#4ade80" }} /> : <Copy size={12} />}
                            <span>{copiedUtr === item.utr ? "Copied" : ""}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => fetchReceipt(item.registrationId, item.teamName, item.utr)}
                          disabled={loadingReceiptFor === item.registrationId}
                          style={{
                            marginTop: "0.35rem",
                            background: "rgba(0,240,255,0.1)",
                            border: "1px solid rgba(0,240,255,0.3)",
                            color: "#00f0ff",
                            borderRadius: "0.25rem",
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.72rem",
                            cursor: loadingReceiptFor === item.registrationId ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <ImageIcon size={13} />
                          <span>{loadingReceiptFor === item.registrationId ? "Loading..." : "View Receipt"}</span>
                        </button>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "1rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              item.registrationStatus === "CONFIRMED"
                                ? "rgba(34,197,94,0.15)"
                                : item.registrationStatus === "REJECTED"
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(251,191,36,0.15)",
                            color:
                              item.registrationStatus === "CONFIRMED"
                                ? "#4ade80"
                                : item.registrationStatus === "REJECTED"
                                ? "#f87171"
                                : "#fbbf24",
                            border:
                              item.registrationStatus === "CONFIRMED"
                                ? "1px solid rgba(34,197,94,0.3)"
                                : item.registrationStatus === "REJECTED"
                                ? "1px solid rgba(239,68,68,0.3)"
                                : "1px solid rgba(251,191,36,0.3)",
                          }}
                        >
                          {item.registrationStatus}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        {!isSuperAdmin ? (
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                            View only
                          </span>
                        ) : (
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          {item.registrationStatus !== "CONFIRMED" && (
                            <button
                              disabled={updatingId === item.registrationId}
                              onClick={() => handleUpdateStatus(item.registrationId, "CONFIRMED")}
                              style={{
                                background: "#22c55e",
                                color: "#030712",
                                border: "none",
                                padding: "0.4rem 0.75rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Check size={13} />
                              <span>{updatingId === item.registrationId ? "..." : "Verify"}</span>
                            </button>
                          )}

                          {item.registrationStatus !== "REJECTED" && (
                            <button
                              disabled={updatingId === item.registrationId}
                              onClick={() => handleUpdateStatus(item.registrationId, "REJECTED")}
                              style={{
                                background: "rgba(239,68,68,0.15)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.4)",
                                padding: "0.4rem 0.75rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Receipt Image Modal */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(3,7,18,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ maxWidth: "560px", width: "100%", padding: "1.5rem", background: "#0b1222", border: "1px solid rgba(0,240,255,0.3)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem" }}>Payment Receipt Verification</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                    UTR / Txn ID: {selectedReceipt.utr}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedReceipt.utr)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#cbd5e1", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.7rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                  >
                    {copiedUtr === selectedReceipt.utr ? <Check size={12} style={{ color: "#4ade80" }} /> : <Copy size={12} />}
                    <span>{copiedUtr === selectedReceipt.utr ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ width: "100%", maxHeight: "65vh", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "#000", textAlign: "center", padding: "0.5rem" }}>
              <img
                src={selectedReceipt.url}
                alt="Payment Screenshot"
                style={{ maxWidth: "100%", height: "auto", objectFit: "contain", borderRadius: "0.375rem" }}
              />
            </div>

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Team: {selectedReceipt.team}</span>
              <a
                href={selectedReceipt.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#00f0ff", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              >
                <span>Open Original Image</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Global Activity Logs Modal */}
      {showActivityLogs && (
        <div
          onClick={() => setShowActivityLogs(false)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(3,7,18,0.85)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ maxWidth: "700px", width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", padding: "1.5rem", background: "#0b1222", border: "1px solid rgba(168,85,247,0.4)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={18} style={{ color: "#c084fc" }} /> Global Activity Logs
              </h3>
              <button onClick={() => setShowActivityLogs(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
              {(() => {
                const allLogs = registrations.flatMap(r => 
                  (r.editLogs || []).map(log => ({ ...log, teamName: r.teamName, regId: r.registrationId }))
                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                if (allLogs.length === 0) {
                  return <div style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No recent activity to display.</div>;
                }
                
                return allLogs.map((log, idx) => (
                  <div key={idx} style={{ padding: "0.75rem", background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>
                        {log.teamName} <span style={{ color: "#64748b", fontWeight: 400 }}>({log.regId})</span> &mdash; Edited by: <span style={{ color: log.editedBy === "ADMIN" ? "#fbbf24" : "#38bdf8" }}>{log.editedBy}</span>
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem" }}>
                      {log.changes}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
