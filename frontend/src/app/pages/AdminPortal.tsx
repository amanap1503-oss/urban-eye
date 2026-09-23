import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, Shield, Users, Clock, AlertTriangle, ChevronDown,
  Zap, FileText, CheckCircle, UserCheck, Calendar, TrendingUp,
  ArrowUpRight, Bell, RefreshCw, Eye, Cpu, Image as ImageIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { analyzeCityIssues, suggestResponseTeam } from "../lib/aiAnalyzerService";
import type { AIComplaintDossier, IssueCluster } from "../lib/aiAnalyzerService";
import AIDossierModal from "../components/AIDossierModal";
import AIReportModal from "../components/AIReportModal";

type AdminTab = "analyzer" | "roster" | "dispatch" | "sla" | "ai_reports";

const CITIES = ["Mumbai", "Pune"];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  on_shift: { bg: "rgba(16,185,129,0.12)", text: "#34d399", dot: "#10b981" },
  off_duty: { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", dot: "#64748b" },
  on_leave: { bg: "rgba(249,115,22,0.12)", text: "#fb923c", dot: "#f97316" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)", text: "#ff6b6b", border: "rgba(239,68,68,0.25)" },
  high: { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.25)" },
  medium: { bg: "rgba(234,179,8,0.12)", text: "#facc15", border: "rgba(234,179,8,0.25)" },
  low: { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.25)" },
};

function TabButton({ active, icon, label, badge, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
        borderRadius: 10, border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
        background: active ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
        color: active ? "#60a5fa" : "rgba(255,255,255,0.5)",
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
        position: "relative",
      }}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "1px 6px", borderRadius: 10, marginLeft: 4,
        }}>{badge}</span>
      )}
    </button>
  );
}

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          background: color.replace(")", ",0.12)").replace("rgb", "rgba"),
        }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── SLA Countdown Component ────────────────────────────────────────────
function SLACountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(deadline).getTime();
  const diff = target - now;
  const overdue = diff <= 0;

  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / 3600000);
  const mins = Math.floor((absDiff % 3600000) / 60000);
  const secs = Math.floor((absDiff % 60000) / 1000);

  const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <span style={{
      fontFamily: "'Space Grotesk', monospace",
      fontSize: 14, fontWeight: 700,
      color: overdue ? "#ff6b6b" : hours < 2 ? "#fb923c" : "#34d399",
    }}>
      {overdue ? `OVERDUE −${timeStr}` : timeStr}
    </span>
  );
}

// ─── Main Admin Portal ──────────────────────────────────────────────────
export default function AdminPortal() {
  const { user, issues, selectedCity, setSelectedCity, roster, assignTeamToIssue, updateOfficerStatus, addOfficer, updateOfficer, loading } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>("analyzer");
  const [selectedDossier, setSelectedDossier] = useState<AIComplaintDossier | null>(null);
  const [dispatchingIssueId, setDispatchingIssueId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [aiReportIssueId, setAiReportIssueId] = useState<string | null>(null);
  const [aiReportTitle, setAiReportTitle] = useState<string | undefined>(undefined);
  const [aiReportsFilter, setAiReportsFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [aiReportsStatusFilter, setAiReportsStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");

  // Roster Management Modal state
  const [officerModalOpen, setOfficerModalOpen] = useState(false);
  const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);
  const [officerForm, setOfficerForm] = useState({
    name: "",
    department: "Public Works",
    role: "Senior Engineer",
    phone: "",
    city: selectedCity || "Mumbai",
    status: "on_shift" as "on_shift" | "off_duty" | "on_leave",
    shiftStart: "08:00",
    shiftEnd: "16:00"
  });

  // ── ALL hooks must be called unconditionally (Rules of Hooks) ──
  // Run AI analysis whenever city or issues change
  const analysis = useMemo(
    () => analyzeCityIssues(selectedCity, issues),
    [selectedCity, issues]
  );

  const isAuthorizedAdmin = user?.role === "official" || user?.role === "ward";

  const currentCity = (selectedCity || "Mumbai").toLowerCase();

  const escalatedIssues = useMemo(() => {
    return (issues || []).filter(i =>
      (i.city || "Mumbai").toLowerCase() === currentCity && i.escalated
    );
  }, [issues, currentCity]);

  const overdueIssues = useMemo(() => {
    return (issues || []).filter(i => {
      if ((i.city || "Mumbai").toLowerCase() !== currentCity) return false;
      if (i.status === "resolved") return false;
      let deadline = i.slaDeadline;
      if (!deadline) {
        const hours = i.slaHours || (i.priority === "critical" ? 4 : i.priority === "high" ? 12 : 24);
        const baseTime = i.reportedAt ? new Date(i.reportedAt).getTime() : (i as any).createdAt ? new Date((i as any).createdAt).getTime() : Date.now();
        deadline = new Date(baseTime + hours * 3600 * 1000).toISOString();
      }
      return new Date(deadline).getTime() < Date.now();
    });
  }, [issues, currentCity]);

  const slaAlertCount = overdueIssues.length + escalatedIssues.length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Loading guard ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0A0F1E",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(59,130,246,0.2)",
          borderTopColor: "#3b82f6",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Authorization guard ──
  if (!isAuthorizedAdmin) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "2rem",
        background: "#0A0F1E", color: "#fff", textAlign: "center",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ff6b6b", marginBottom: 20,
        }}>
          <Shield size={32} />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>
          City Admin Portal Access Restricted
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 420, lineHeight: 1.6, margin: "0 0 24px" }}>
          This portal is restricted to authorized municipal officers, ward representatives, and city dispatch admins.
        </p>
        <a
          href="/"
          style={{
            padding: "12px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #1E6BE6, #8B5CF6)",
            color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(30,107,230,0.3)",
          }}
        >
          Go to City Admin Sign In
        </a>
      </div>
    );
  }


  return (
    <div style={{
      minHeight: "100vh", paddingTop: "5rem", paddingBottom: "3rem",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{
              position: "fixed", top: 80, left: "50%", zIndex: 100,
              background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
              backdropFilter: "blur(12px)", borderRadius: 12, padding: "12px 20px",
              display: "flex", alignItems: "center", gap: 10,
              color: "#34d399", fontSize: 13, fontWeight: 500,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <CheckCircle size={16} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dossier Modal */}
      {selectedDossier && (
        <AIDossierModal dossier={selectedDossier} onClose={() => setSelectedDossier(null)} />
      )}

      {/* AI Report Modal */}
      <AIReportModal
        issueId={aiReportIssueId}
        issueTitle={aiReportTitle}
        onClose={() => { setAiReportIssueId(null); setAiReportTitle(undefined); }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(59,130,246,0.3)",
              }}>
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <h1 style={{
                  fontSize: 24, fontWeight: 700, color: "#fff", margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  AI Command Center
                </h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  Intelligent Issue Analysis & Smart Team Dispatch
                </p>
              </div>
            </div>
          </div>

          {/* City Selector */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                appearance: "none", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 36px 10px 14px",
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
                outline: "none",
              }}
            >
              {CITIES.map((c) => <option key={c} value={c} style={{ background: "#0b1228" }}>{c}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard icon={<FileText size={16} />} label="City Issues" value={analysis.stats.totalCityIssues} color="rgb(96,165,250)" sub={`${selectedCity} total`} />
          <StatCard icon={<AlertTriangle size={16} />} label="Critical" value={analysis.stats.criticalCount} color="rgb(239,68,68)" sub="Immediate action" />
          <StatCard icon={<TrendingUp size={16} />} label="High Priority" value={analysis.stats.highCount} color="rgb(249,115,22)" sub="Within 12h SLA" />
          <StatCard icon={<Clock size={16} />} label="Avg SLA" value={`${analysis.stats.avgSlaHours}h`} color="rgb(16,185,129)" sub="Response target" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <TabButton active={activeTab === "analyzer"} icon={<Brain size={15} />} label="AI Analyzer" onClick={() => setActiveTab("analyzer")} />
          <TabButton active={activeTab === "roster"} icon={<Users size={15} />} label="Workforce Roster" onClick={() => setActiveTab("roster")} />
          <TabButton active={activeTab === "dispatch"} icon={<Zap size={15} />} label="Smart Dispatch" onClick={() => setActiveTab("dispatch")} />
          <TabButton active={activeTab === "sla"} icon={<Clock size={15} />} label="SLA Monitor" badge={slaAlertCount} onClick={() => setActiveTab("sla")} />
          <TabButton active={activeTab === "ai_reports"} icon={<Cpu size={15} />} label="AI Reports" badge={issues.filter(i => (i.city || "Mumbai").toLowerCase() === selectedCity.toLowerCase()).length} onClick={() => setActiveTab("ai_reports")} />
        </div>

        {/* ─── TAB 1: AI ANALYZER ──────────────────────────────────────── */}
        {activeTab === "analyzer" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>City-Wise Prioritization Matrix</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>AI comparative analysis for {selectedCity} — {analysis.clusters.length} issue cluster(s) detected</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: "#60a5fa", fontWeight: 500 }}>
                  <RefreshCw size={11} />
                  Live Analysis
                </div>
              </div>

              {analysis.clusters.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  No issues found for {selectedCity}. Issues will appear here when citizens report them.
                </div>
              ) : (
                <div>
                  {analysis.clusters.map((cluster, idx) => {
                    const pColors = PRIORITY_COLORS[cluster.priorityLevel] || PRIORITY_COLORS.medium;
                    const dossier = analysis.dossiers[cluster.primaryIssue.id];
                    return (
                      <div key={cluster.id} style={{
                        padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", gap: 16,
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Rank */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: pColors.bg, border: `1px solid ${pColors.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: pColors.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                          {idx + 1}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {cluster.primaryIssue.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{cluster.location}</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{cluster.category}</span>
                            {cluster.duplicateCount > 1 && (
                              <>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
                                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>{cluster.duplicateCount} reports</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: pColors.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {cluster.calculatedPriorityScore}
                          </div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Score</div>
                        </div>

                        {/* Priority Badge */}
                        <span style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.5px",
                          background: pColors.bg, color: pColors.text, border: `1px solid ${pColors.border}`,
                          flexShrink: 0,
                        }}>
                          {cluster.priorityLevel}
                        </span>

                        {/* SLA */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>{cluster.suggestedSlaHours}h</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>SLA</div>
                        </div>

                        {/* View Dossier button */}
                        {dossier && (
                          <button
                            onClick={() => setSelectedDossier(dossier)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 8,
                              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                              color: "#60a5fa", fontSize: 11, fontWeight: 500, cursor: "pointer",
                              fontFamily: "'Inter', sans-serif", flexShrink: 0,
                            }}
                          >
                            <Eye size={12} />
                            Dossier
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── TAB 2: WORKFORCE ROSTER ─────────────────────────────────── */}
        {activeTab === "roster" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                    <Users size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                    {selectedCity} Municipal Workforce
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                    Manage officer shifts, status, departments, and availability. This data is private and not visible to citizens.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingOfficerId(null);
                    setOfficerForm({
                      name: "",
                      department: "Public Works",
                      role: "Field Officer",
                      phone: "",
                      city: selectedCity || "Mumbai",
                      status: "on_shift",
                      shiftStart: "08:00",
                      shiftEnd: "16:00"
                    });
                    setOfficerModalOpen(true);
                  }}
                  style={{
                    padding: "8px 14px", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <UserCheck size={14} /> + Add Officer
                </button>
              </div>

              {/* Officer Table Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.8fr 1.2fr",
                gap: 8, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                <span>Officer</span>
                <span>Department</span>
                <span>Shift</span>
                <span>Tasks</span>
                <span>Status</span>
                <span>Action / Edit</span>
              </div>

              {roster
                .filter(o => o.city.toLowerCase() === selectedCity.toLowerCase())
                .map((officer) => {
                  const statusStyle = STATUS_COLORS[officer.status] || STATUS_COLORS.off_duty;
                  return (
                    <div key={officer.id} style={{
                      display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.8fr 1.2fr",
                      gap: 8, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}>
                      {/* Officer Name + Role */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={officer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(officer.name)}&background=1E6BE6&color=fff&size=64`}
                          alt={officer.name}
                          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{officer.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{officer.role}</div>
                        </div>
                      </div>

                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{officer.department}</span>

                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={11} />
                        {officer.shiftStart}–{officer.shiftEnd}
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{officer.activeAssignments}</span>

                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                        background: statusStyle.bg, color: statusStyle.text,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusStyle.dot }} />
                        {officer.status.replace("_", " ")}
                      </span>

                      {/* Status Toggle + Edit Button */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <select
                          value={officer.status}
                          onChange={(e) => updateOfficerStatus(officer.id, e.target.value as any)}
                          style={{
                            appearance: "none", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                            color: "#fff", fontSize: 11, padding: "5px 8px", cursor: "pointer",
                            fontFamily: "'Inter', sans-serif", outline: "none", flex: 1
                          }}
                        >
                          <option value="on_shift" style={{ background: "#0b1228" }}>On Shift</option>
                          <option value="off_duty" style={{ background: "#0b1228" }}>Off Duty</option>
                          <option value="on_leave" style={{ background: "#0b1228" }}>On Leave</option>
                        </select>

                        <button
                          onClick={() => {
                            setEditingOfficerId(officer.id);
                            setOfficerForm({
                              name: officer.name,
                              department: officer.department,
                              role: officer.role,
                              phone: officer.phone || "",
                              city: officer.city,
                              status: officer.status,
                              shiftStart: officer.shiftStart,
                              shiftEnd: officer.shiftEnd
                            });
                            setOfficerModalOpen(true);
                          }}
                          style={{
                            padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 11,
                            cursor: "pointer", fontFamily: "'Inter', sans-serif"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* ─── TAB 3: SMART DISPATCH ───────────────────────────────────── */}
        {activeTab === "dispatch" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                  <Zap size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                  AI Smart Team Dispatcher
                </h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                  AI recommends response teams based on on-shift officers. Approve to dispatch and notify citizens.
                </p>
              </div>

              {/* Un-assigned issues in current city */}
              {(() => {
                const unassigned = issues.filter(i =>
                  (i.city || "Mumbai").toLowerCase() === selectedCity.toLowerCase() &&
                  !i.assignedTeam && i.status !== "resolved"
                );

                if (unassigned.length === 0) {
                  return (
                    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      <CheckCircle size={24} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
                      All issues in {selectedCity} have been assigned. Great work!
                    </div>
                  );
                }

                return unassigned.map((issue) => {
                  const recommendation = suggestResponseTeam(issue, roster);
                  const pColors = PRIORITY_COLORS[issue.aiPriorityLevel || issue.priority] || PRIORITY_COLORS.medium;
                  const isDispatching = dispatchingIssueId === issue.id;

                  return (
                    <div key={issue.id} style={{
                      padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      {/* Issue Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{
                              padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                              textTransform: "uppercase", background: pColors.bg, color: pColors.text, border: `1px solid ${pColors.border}`,
                            }}>
                              {issue.aiPriorityLevel || issue.priority}
                            </span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              AI Score: {issue.aiPriorityScore || "—"}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{issue.title}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{issue.location} · {issue.category}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>SLA Window</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", fontFamily: "'Space Grotesk', sans-serif" }}>
                            {issue.slaHours || 24}h
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div style={{
                        background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)",
                        borderRadius: 10, padding: "12px 14px", marginBottom: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Brain size={13} style={{ color: "#60a5fa" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Smart Dispatch</span>
                          </div>
                          {recommendation.urgencyLabel && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                              background: "rgba(239,68,68,0.15)", color: "#ff6b6b", border: "1px solid rgba(239,68,68,0.3)",
                              fontFamily: "'Space Grotesk', monospace"
                            }}>
                              ⚡ {recommendation.urgencyLabel}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                          {recommendation.teamName}
                        </div>

                        {recommendation.matchedKeywords && recommendation.matchedKeywords.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Detected Signals:</span>
                            {recommendation.matchedKeywords.map((kw, i) => (
                              <span key={i} style={{
                                fontSize: 9, fontFamily: "monospace", padding: "1px 6px", borderRadius: 4,
                                background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)"
                              }}>
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 10 }}>
                          {recommendation.reason}
                        </div>

                        {recommendation.recommendedOfficers.length > 0 && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {recommendation.recommendedOfficers.map((off) => (
                              <div key={off.id} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 12px",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}>
                                <img src={off.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(off.name)}&size=32`} alt={off.name}
                                  style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{off.name}</div>
                                  <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 500 }}>{off.role} · {off.department}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setDispatchingIssueId(issue.id);
                            setTimeout(() => {
                              assignTeamToIssue(
                                issue.id,
                                recommendation.teamName,
                                recommendation.recommendedOfficers.map(o => o.name),
                                issue.slaHours
                              );
                              setDispatchingIssueId(null);
                              showNotification(`✅ Team "${recommendation.teamName}" dispatched! Citizens notified.`);
                            }, 800);
                          }}
                          disabled={isDispatching || recommendation.recommendedOfficers.length === 0}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 8,
                            background: isDispatching ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.15)",
                            border: "1px solid rgba(59,130,246,0.3)",
                            color: "#60a5fa", fontSize: 12, fontWeight: 600, cursor: isDispatching ? "not-allowed" : "pointer",
                            fontFamily: "'Inter', sans-serif", opacity: recommendation.recommendedOfficers.length === 0 ? 0.4 : 1,
                          }}
                        >
                          {isDispatching ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <UserCheck size={13} />}
                          {isDispatching ? "Dispatching…" : "Approve & Dispatch"}
                        </button>
                        <button
                          onClick={() => {
                            const dossier = analysis.dossiers[issue.id];
                            if (dossier) setSelectedDossier(dossier);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "8px 14px", borderRadius: 8,
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <FileText size={12} />
                          View Dossier
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}

        {/* ─── TAB 4: SLA MONITOR ──────────────────────────────────────── */}
        {activeTab === "sla" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                  <Clock size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                  Live SLA Escalation Dashboard
                </h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                  Overdue issues auto-escalate. Live countdown for all assigned teams in {selectedCity}.
                </p>
              </div>

              {/* Escalation Alerts */}
              {(overdueIssues.length > 0 || escalatedIssues.length > 0) && (
                <div style={{ padding: "12px 20px", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Bell size={13} style={{ color: "#ff6b6b" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6b6b" }}>
                      {overdueIssues.length + escalatedIssues.length} Escalation Alert(s)
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                    {overdueIssues.length} overdue SLA(s) auto-escalated to higher authorities. Immediate reassignment required.
                  </p>
                </div>
              )}

              {/* SLA Issue List */}
              {(() => {
                const cityIssues = issues.filter(i =>
                  (i.city || "Mumbai").toLowerCase() === selectedCity.toLowerCase() &&
                  i.status !== "resolved"
                );

                if (cityIssues.length === 0) {
                  return (
                    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      No active issues with SLA timers in {selectedCity}.
                    </div>
                  );
                }

                return cityIssues.map((issue) => {
                  const pColors = PRIORITY_COLORS[issue.aiPriorityLevel || issue.priority] || PRIORITY_COLORS.medium;

                  // Determine deadline: use set deadline or calculate fallback deadline based on slaHours / priority
                  let deadline = issue.slaDeadline;
                  if (!deadline) {
                    const hours = issue.slaHours || (issue.priority === "critical" ? 4 : issue.priority === "high" ? 12 : 24);
                    const rawDate = issue.reportedAt || (issue as any).createdAt;
                    const baseTime = rawDate ? new Date(rawDate).getTime() : Date.now();
                    deadline = new Date(baseTime + hours * 3600 * 1000).toISOString();
                  }

                  const isOverdue = new Date(deadline).getTime() < Date.now();

                  return (
                    <div key={issue.id} style={{
                      padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", gap: 16,
                      background: isOverdue ? "rgba(239,68,68,0.03)" : "transparent",
                    }}>
                      {/* Priority */}
                      <span style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                        textTransform: "uppercase", background: pColors.bg, color: pColors.text, border: `1px solid ${pColors.border}`,
                        flexShrink: 0,
                      }}>
                        {issue.aiPriorityLevel || issue.priority}
                      </span>

                      {/* Issue Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {issue.title}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          {issue.assignedTeam
                            ? typeof issue.assignedTeam === "string"
                              ? issue.assignedTeam
                              : `${issue.assignedTeam.teamName || "Assigned Team"}${
                                  Array.isArray(issue.assignedTeam.officerNames) && issue.assignedTeam.officerNames.length > 0
                                    ? ` · ${issue.assignedTeam.officerNames.join(", ")}`
                                    : ""
                                }`
                            : "Unassigned · Pending Dispatch"}
                        </div>
                      </div>

                      {/* SLA Countdown */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>
                          {isOverdue ? "Overdue by" : "Time remaining"}
                        </div>
                        <SLACountdown deadline={deadline} />
                      </div>

                      {/* Escalation Badge */}
                      {(isOverdue || issue.escalated) && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: "rgba(239,68,68,0.15)", color: "#ff6b6b", border: "1px solid rgba(239,68,68,0.25)",
                          flexShrink: 0,
                        }}>
                          <ArrowUpRight size={10} />
                          Escalated
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}

        {/* ─── TAB 5: AI REPORTS ───────────────────────────────────────── */}
        {activeTab === "ai_reports" && (() => {
          const cityIssues = issues.filter(i =>
            (i.city || "Mumbai").toLowerCase() === selectedCity.toLowerCase()
          );
          const filtered = cityIssues.filter(i => {
            const pMatch = aiReportsFilter === "all" || (i.aiPriorityLevel || i.priority) === aiReportsFilter;
            const sMatch = aiReportsStatusFilter === "all" || i.status === aiReportsStatusFilter;
            return pMatch && sMatch;
          });

          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* Header + Filters */}
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, overflow: "hidden",
              }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <Cpu size={15} style={{ color: "#a78bfa" }} />
                        AI-Powered Issue Reports — {selectedCity}
                      </h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                        {filtered.length} issue(s) · Click "View AI Report" to see full YOLO + Gemini analysis
                      </p>
                    </div>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(["all", "critical", "high", "medium", "low"] as const).map(p => (
                        <button key={p} onClick={() => setAiReportsFilter(p)} style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                          background: aiReportsFilter === p
                            ? p === "critical" ? "rgba(239,68,68,0.25)" : p === "high" ? "rgba(249,115,22,0.25)" : p === "medium" ? "rgba(234,179,8,0.2)" : p === "low" ? "rgba(100,116,139,0.2)" : "rgba(59,130,246,0.2)"
                            : "rgba(255,255,255,0.04)",
                          color: aiReportsFilter === p
                            ? p === "critical" ? "#ff6b6b" : p === "high" ? "#fb923c" : p === "medium" ? "#facc15" : p === "low" ? "#94a3b8" : "#60a5fa"
                            : "rgba(255,255,255,0.4)",
                          border: aiReportsFilter === p
                            ? p === "critical" ? "1px solid rgba(239,68,68,0.4)" : p === "high" ? "1px solid rgba(249,115,22,0.4)" : p === "medium" ? "1px solid rgba(234,179,8,0.4)" : p === "low" ? "1px solid rgba(100,116,139,0.3)" : "1px solid rgba(59,130,246,0.4)"
                            : "1px solid rgba(255,255,255,0.06)",
                          textTransform: "capitalize",
                        }}>{p}</button>
                      ))}
                      <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
                      {(["all", "new", "in_progress", "resolved"] as const).map(s => (
                        <button key={s} onClick={() => setAiReportsStatusFilter(s)} style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                          background: aiReportsStatusFilter === s ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                          color: aiReportsStatusFilter === s ? "#a78bfa" : "rgba(255,255,255,0.4)",
                          border: aiReportsStatusFilter === s ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
                          textTransform: "capitalize",
                        }}>{s.replace("_", " ")}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Issue Grid */}
                {filtered.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    <Cpu size={28} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                    No issues match the selected filters for {selectedCity}.
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: 16, padding: 20,
                  }}>
                    {filtered.map((issue) => {
                      const pColors = PRIORITY_COLORS[issue.aiPriorityLevel || issue.priority] || PRIORITY_COLORS.medium;
                      const statusColor = issue.status === "resolved" ? "#34d399" : issue.status === "in_progress" ? "#60a5fa" : issue.status === "new" ? "#fb923c" : "#94a3b8";
                      const statusBg = issue.status === "resolved" ? "rgba(16,185,129,0.1)" : issue.status === "in_progress" ? "rgba(59,130,246,0.1)" : issue.status === "new" ? "rgba(249,115,22,0.1)" : "rgba(100,116,139,0.1)";
                      const statusBorder = issue.status === "resolved" ? "rgba(16,185,129,0.25)" : issue.status === "in_progress" ? "rgba(59,130,246,0.25)" : issue.status === "new" ? "rgba(249,115,22,0.25)" : "rgba(100,116,139,0.2)";

                      return (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -2, boxShadow: `0 12px 40px rgba(0,0,0,0.4), ${pColors.glow}` }}
                          transition={{ duration: 0.25 }}
                          style={{
                            background: "rgba(255,255,255,0.025)",
                            border: `1px solid rgba(255,255,255,0.07)`,
                            borderRadius: 14, overflow: "hidden",
                            cursor: "default",
                            transition: "all 0.25s",
                          }}
                        >
                          {/* Thumbnail */}
                          <div style={{ position: "relative", width: "100%", height: 160, background: "#060d1f", overflow: "hidden" }}>
                            {issue.image ? (
                              <img
                                src={issue.image}
                                alt={issue.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ImageIcon size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div style={{
                              position: "absolute", inset: 0,
                              background: "linear-gradient(to top, rgba(6,13,31,0.85) 0%, transparent 60%)",
                            }} />
                            {/* Priority badge floating on image */}
                            <span style={{
                              position: "absolute", top: 10, left: 10,
                              padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.5px",
                              background: pColors.bg, color: pColors.text, border: `1px solid ${pColors.border}`,
                              backdropFilter: "blur(8px)",
                            }}>
                              {issue.aiPriorityLevel || issue.priority}
                            </span>
                            {/* AI score */}
                            {issue.aiPriorityScore && (
                              <span style={{
                                position: "absolute", top: 10, right: 10,
                                fontSize: 11, fontWeight: 700, color: pColors.text,
                                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                                padding: "3px 8px", borderRadius: 8,
                                fontFamily: "'Space Grotesk', monospace",
                                border: `1px solid ${pColors.border}`,
                              }}>
                                ⚡ {issue.aiPriorityScore}
                              </span>
                            )}
                            {/* YOLO detections floating at bottom of image */}
                            {issue.yoloDetections && issue.yoloDetections.length > 0 && (
                              <div style={{
                                position: "absolute", bottom: 8, left: 8, right: 8,
                                display: "flex", flexWrap: "wrap", gap: 5,
                              }}>
                                {issue.yoloDetections.slice(0, 4).map((det, i) => (
                                  <span key={i} style={{
                                    fontSize: 9, fontWeight: 600, fontFamily: "monospace",
                                    padding: "2px 7px", borderRadius: 10,
                                    background: "rgba(34,211,238,0.15)",
                                    color: "#22d3ee",
                                    border: "1px solid rgba(34,211,238,0.25)",
                                    backdropFilter: "blur(6px)",
                                    textTransform: "capitalize",
                                  }}>
                                    🎯 {det.class} {Math.round(det.confidence * 100)}%
                                  </span>
                                ))}
                                {issue.yoloDetections.length > 4 && (
                                  <span style={{
                                    fontSize: 9, fontWeight: 600, fontFamily: "monospace",
                                    padding: "2px 7px", borderRadius: 10,
                                    background: "rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.5)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                  }}>
                                    +{issue.yoloDetections.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div style={{ padding: "14px 16px" }}>
                            {/* Title + Status */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.4, flex: 1 }}>
                                {issue.title}
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                                background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`,
                                textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0,
                              }}>
                                {issue.status.replace("_", " ")}
                              </span>
                            </div>

                            {/* Meta: location · category */}
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span>📍 {issue.location}</span>
                              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                              <span>{issue.category}</span>
                              {issue.assignedTeam && (
                                <>
                                  <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                                  <span style={{ color: "#34d399" }}>👥 Assigned</span>
                                </>
                              )}
                            </div>

                            {/* AI Summary snippet */}
                            {issue.aiSummary && (
                              <div style={{
                                fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5,
                                marginBottom: 10, display: "-webkit-box",
                                WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                background: "rgba(139,92,246,0.05)",
                                border: "1px solid rgba(139,92,246,0.1)",
                                borderRadius: 8, padding: "8px 10px",
                              }}>
                                🤖 {issue.aiSummary}
                              </div>
                            )}

                            {/* Citizen Voice Note Audio Player */}
                            {issue.voiceRecordingUrl && (
                              <div style={{
                                marginBottom: 10,
                                padding: "8px 10px",
                                borderRadius: 8,
                                background: "rgba(16,185,129,0.08)",
                                border: "1px solid rgba(52,211,153,0.25)",
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "#34d399", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                  <span>🎙️ Citizen Voice Recording</span>
                                </div>
                                <audio controls src={issue.voiceRecordingUrl} style={{ width: "100%", height: 32, outline: "none", borderRadius: 6 }} />
                              </div>
                            )}

                            {/* No AI data yet */}
                            {!issue.aiSummary && (
                              <div style={{
                                fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5,
                                marginBottom: 10,
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 8, padding: "8px 10px",
                                fontStyle: "italic",
                              }}>
                                AI report will be generated from full backend analysis.
                              </div>
                            )}

                            {/* Divider */}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 10 }} />

                            {/* Footer: View AI Report button */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                                {issue.id}
                              </div>
                              <button
                                onClick={() => {
                                  setAiReportIssueId(issue.id);
                                  setAiReportTitle(issue.title);
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                                  background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.18))",
                                  border: "1px solid rgba(139,92,246,0.35)",
                                  color: "#a78bfa", fontSize: 12, fontWeight: 600,
                                  fontFamily: "'Inter', sans-serif",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))";
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.6)";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.18))";
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.35)";
                                }}
                              >
                                <Cpu size={13} />
                                View AI Report
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}

      </div>

      {/* ── Add / Edit Officer Roster Modal ── */}
      {officerModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(5,8,22,0.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#0B1020", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20, width: "100%", maxWidth: 500, padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                {editingOfficerId ? "✏️ Edit Employee Roster Record" : "👤 Add New Response Officer"}
              </h3>
              <button
                onClick={() => setOfficerModalOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingOfficerId) {
                updateOfficer(editingOfficerId, officerForm);
                showNotification(`Updated officer record for ${officerForm.name}`);
              } else {
                addOfficer(officerForm);
                showNotification(`Added new officer ${officerForm.name} to ${officerForm.city} Roster`);
              }
              setOfficerModalOpen(false);
            }} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Officer Full Name</label>
                <input
                  type="text" required value={officerForm.name}
                  onChange={e => setOfficerForm({ ...officerForm, name: e.target.value })}
                  placeholder="e.g. Inspector Ramesh Kulkarni"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Department</label>
                  <select
                    value={officerForm.department}
                    onChange={e => setOfficerForm({ ...officerForm, department: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0B1020", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  >
                    <option value="Public Works">Public Works</option>
                    <option value="Water & Power">Water & Power</option>
                    <option value="Traffic & Safety">Traffic & Safety</option>
                    <option value="Sanitation & Bio-Hazard">Sanitation & Bio-Hazard</option>
                    <option value="Parks & Amenities">Parks & Amenities</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Designation / Role</label>
                  <input
                    type="text" required value={officerForm.role}
                    onChange={e => setOfficerForm({ ...officerForm, role: e.target.value })}
                    placeholder="e.g. Senior Road Engineer"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Shift Start Time</label>
                  <input
                    type="time" value={officerForm.shiftStart}
                    onChange={e => setOfficerForm({ ...officerForm, shiftStart: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Shift End Time</label>
                  <input
                    type="time" value={officerForm.shiftEnd}
                    onChange={e => setOfficerForm({ ...officerForm, shiftEnd: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Duty Status</label>
                  <select
                    value={officerForm.status}
                    onChange={e => setOfficerForm({ ...officerForm, status: e.target.value as any })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0B1020", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  >
                    <option value="on_shift">On Shift</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4, fontWeight: 600 }}>Assigned City</label>
                  <select
                    value={officerForm.city}
                    onChange={e => setOfficerForm({ ...officerForm, city: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0B1020", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 10, padding: "12px 20px", borderRadius: 10,
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff",
                  fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer"
                }}
              >
                {editingOfficerId ? "Save Officer Updates" : "Add Officer to Roster"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
