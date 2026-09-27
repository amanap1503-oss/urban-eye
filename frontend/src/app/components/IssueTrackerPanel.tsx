import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Clock, MapPin, Camera, Users, Shield, ThumbsUp, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { Issue } from "../data/mockData";
import { useApp } from "../context/AppContext";
import AIReportModal from "./AIReportModal";

// ── Step definitions ──────────────────────────────────────────────────────────
interface TrackStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}

const STEPS: TrackStep[] = [
  {
    id: "reported",
    label: "Issue Reported",
    sublabel: "Civic complaint filed by citizen",
    icon: <MapPin size={16} />,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.35)",
  },
  {
    id: "team_assigned",
    label: "Team Assigned",
    sublabel: "Response team dispatched by admin",
    icon: <Users size={16} />,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
  },
  {
    id: "team_approved",
    label: "Team Accepted",
    sublabel: "Field officer acknowledged the task",
    icon: <Shield size={16} />,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "site_arrived",
    label: "Team On-Site",
    sublabel: "Field officer arrived & geo-image uploaded",
    icon: <Camera size={16} />,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.35)",
  },
  {
    id: "resolved_proof",
    label: "Fix Completed",
    sublabel: "Resolution geo-image submitted by officer",
    icon: <CheckCircle2 size={16} />,
    color: "#10b981",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "citizen_approved",
    label: "Citizen Confirmed",
    sublabel: "Issue marked resolved by citizen",
    icon: <ThumbsUp size={16} />,
    color: "#ec4899",
    glow: "rgba(236,72,153,0.35)",
  },
];

// ── Derive step completion from issue fields ──────────────────────────────────
function getStepStatus(issue: Issue, stepId: string): "done" | "active" | "pending" {
  const hasTeam = !!(issue.assignedTeam || issue.status === "in_progress" || issue.status === "pending_approval" || issue.status === "resolved");
  const hasArrival = !!issue.siteArrivalProof;
  const hasResolution = !!issue.resolutionProof;
  const isResolved = issue.resolutionProof?.approvedByCitizen || issue.status === "resolved";

  switch (stepId) {
    case "reported":
      return "done";
    case "team_assigned":
      return hasTeam ? "done" : "active";
    case "team_approved":
      return hasArrival || hasResolution || isResolved ? "done"
        : hasTeam ? "active"
        : "pending";
    case "site_arrived":
      return hasArrival ? "done"
        : hasTeam ? "active"
        : "pending";
    case "resolved_proof":
      return hasResolution ? "done"
        : hasArrival ? "active"
        : "pending";
    case "citizen_approved":
      return isResolved ? "done"
        : hasResolution ? "active"
        : "pending";
    default:
      return "pending";
  }
}

function getStepTimestamp(issue: Issue, stepId: string): string | null {
  switch (stepId) {
    case "reported": return issue.reportedAt || null;
    case "team_assigned": return issue.assignedTeam?.assignedAt || null;
    case "team_approved": return issue.siteArrivalProof?.arrivedAt || null;
    case "site_arrived": return issue.siteArrivalProof?.arrivedAt || null;
    case "resolved_proof": return issue.resolutionProof?.resolvedAt || null;
    case "citizen_approved": return issue.resolutionProof?.resolvedAt || null;
    default: return null;
  }
}

function getStepProofImage(issue: Issue, stepId: string): string | null {
  if (stepId === "site_arrived") return issue.siteArrivalProof?.imageUrl || null;
  if (stepId === "resolved_proof" || stepId === "citizen_approved") return issue.resolutionProof?.imageUrl || null;
  return null;
}

function getStepDetail(issue: Issue, stepId: string): string | null {
  switch (stepId) {
    case "team_assigned":
      return issue.assignedTeam ? `${issue.assignedTeam.teamName} — ${issue.assignedTeam.officerNames.join(", ")}` : null;
    case "site_arrived":
      return issue.siteArrivalProof?.arrivedBy
        ? `📍 ${issue.siteArrivalProof.locationName || issue.location} • by ${issue.siteArrivalProof.arrivedBy}`
        : null;
    case "resolved_proof":
      return issue.resolutionProof?.resolvedBy
        ? `📍 ${issue.resolutionProof.locationName || issue.location} • by ${issue.resolutionProof.resolvedBy}`
        : null;
    default: return null;
  }
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ── Single issue tracker ──────────────────────────────────────────────────────
export function IssueTracker({ issue, compact = false }: { issue: Issue; compact?: boolean }) {
  const { approveResolution } = useApp();
  const [showAiReport, setShowAiReport] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const overallPercent = Math.round(
    (STEPS.filter(s => getStepStatus(issue, s.id) === "done").length / STEPS.length) * 100
  );

  const statusLabel =
    issue.status === "resolved" ? "Resolved" :
    issue.status === "pending_approval" ? "Awaiting Your Confirmation" :
    issue.status === "in_progress" ? "In Progress" : "Reported";

  const statusColor =
    issue.status === "resolved" ? "#10b981" :
    issue.status === "pending_approval" ? "#ec4899" :
    issue.status === "in_progress" ? "#3b82f6" : "#f59e0b";

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Issue header */}
      <div style={{ padding: compact ? "14px 18px 10px" : "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {issue.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MapPin size={11} color="#60a5fa" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{issue.location}</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowAiReport(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#a5b4fc",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.2)";
                e.currentTarget.style.border = "1px solid rgba(99,102,241,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                e.currentTarget.style.border = "1px solid rgba(99,102,241,0.25)";
              }}
            >
              <Cpu size={11} />
              View AI Report
            </button>
            <span style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.05em",
              background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`,
              whiteSpace: "nowrap"
            }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 5, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 100,
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{overallPercent}% complete</p>
          <button
            onClick={() => setIsExpanded(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: isExpanded ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.05)",
              border: isExpanded ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, color: isExpanded ? "#93c5fd" : "rgba(255,255,255,0.4)",
              fontSize: 10, fontWeight: 600, padding: "3px 9px", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {isExpanded ? "Hide Tracker" : "Show Live Tracker"}
          </button>
        </div>
      </div>

      {/* Steps timeline — collapsible */}
      <AnimatePresence initial={false}>
      {isExpanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
      <div style={{ padding: compact ? "12px 18px" : "16px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
        {STEPS.map((step, idx) => {
          const status = getStepStatus(issue, step.id);
          const ts = getStepTimestamp(issue, step.id);
          const proof = getStepProofImage(issue, step.id);
          const detail = getStepDetail(issue, step.id);
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.id} style={{ display: "flex", gap: 14, position: "relative" }}>
              {/* Line */}
              {!isLast && (
                <div style={{
                  position: "absolute", left: 15, top: 32, bottom: -4, width: 2,
                  background: status === "done" ? step.color : "rgba(255,255,255,0.06)",
                  transition: "background 0.5s"
                }} />
              )}

              {/* Dot */}
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.07 }}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: status === "done"
                      ? `linear-gradient(135deg, ${step.color}cc, ${step.color}66)`
                      : status === "active"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: `2px solid ${status === "done" ? step.color : status === "active" ? step.color + "60" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: status === "done" ? `0 0 12px ${step.glow}` : "none",
                    color: status === "done" ? "#fff" : status === "active" ? step.color : "rgba(255,255,255,0.2)",
                    position: "relative",
                  }}
                >
                  {step.icon}
                  {status === "active" && (
                    <span style={{
                      position: "absolute", top: -2, right: -2, width: 8, height: 8,
                      borderRadius: "50%", background: step.color,
                      boxShadow: `0 0 6px ${step.glow}`,
                      animation: "pulse 1.5s infinite"
                    }} />
                  )}
                </motion.div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: compact ? 12.5 : 13, fontWeight: 600,
                    color: status === "done" ? "#fff" : status === "active" ? step.color : "rgba(255,255,255,0.3)"
                  }}>
                    {step.label}
                  </span>
                  {status === "done" && (
                    <CheckCircle2 size={12} color={step.color} />
                  )}
                  {status === "active" && (
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: step.color, background: `${step.color}18`, padding: "1px 7px", borderRadius: 100, border: `1px solid ${step.color}30` }}>
                      In Progress
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{step.sublabel}</p>

                {/* Detail text */}
                {detail && status === "done" && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "4px 0 0", fontStyle: "italic" }}>{detail}</p>
                )}

                {/* Timestamp */}
                {ts && status === "done" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Clock size={9} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{formatTime(ts)}</span>
                  </div>
                )}

                {/* Proof image */}
                {proof && status === "done" && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <img
                      src={proof}
                      alt="Geo proof"
                      style={{ width: compact ? 60 : 80, height: compact ? 45 : 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${step.color}40` }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontSize: 10, color: step.color, fontWeight: 600 }}>📍 Geo-verified image</span>
                  </div>
                )}

                {/* Citizen approval CTA */}
                {step.id === "citizen_approved" && status === "active" && (
                  <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
                    <p style={{ fontSize: 11.5, color: "#f9a8d4", fontWeight: 600, margin: "0 0 8px" }}>
                      📸 Field officer has submitted the final resolution photo. Please confirm!
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => approveResolution(issue.id, true)}
                        style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: 11.5, fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        ✓ Confirm Resolved
                      </button>
                      <button
                        onClick={() => approveResolution(issue.id, false)}
                        style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11.5, fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </motion.div>
      )}
      </AnimatePresence>
      {showAiReport && (
        <AIReportModal
          issueId={issue.id}
          issueTitle={issue.title}
          onClose={() => setShowAiReport(false)}
        />
      )}
    </div>
  );
}

// ── Full-screen modal wrapper ─────────────────────────────────────────────────
interface IssueTrackerModalProps {
  issues: Issue[];
  onClose: () => void;
  userUid?: string;
}

export function IssueTrackerModal({ issues, onClose, userUid }: IssueTrackerModalProps) {
  // Filter to user's own issues first; fall back to all issues so tracker is never blank
  const ownIssues = userUid ? issues.filter(i => i.reportedBy === userUid) : [];
  const myIssues = ownIssues.length > 0 ? ownIssues : issues;
  const [selectedId, setSelectedId] = useState<string | null>(myIssues[0]?.id || null);
  const selected = myIssues.find(i => i.id === selectedId) || myIssues[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 820, maxHeight: "88vh",
            background: "#0b1020", border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 22, overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Live Issue Tracker
                </h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Real-time status of your reported issues
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>

          {myIssues.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, color: "rgba(255,255,255,0.3)" }}>
              <MapPin size={48} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>No issues reported yet</p>
              <p style={{ fontSize: 13, margin: "6px 0 0" }}>Submit your first issue to start tracking</p>
            </div>
          ) : (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Sidebar list */}
              <div style={{
                width: 240, borderRight: "1px solid rgba(255,255,255,0.06)",
                overflowY: "auto", padding: "12px 0",
                flexShrink: 0,
              }}>
                {myIssues.map(issue => {
                  const done = STEPS.filter(s => getStepStatus(issue, s.id) === "done").length;
                  const pct = Math.round((done / STEPS.length) * 100);
                  const isActive = selectedId === issue.id;
                  const hasCta = issue.resolutionProof && !issue.resolutionProof.approvedByCitizen && issue.status !== "resolved";

                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedId(issue.id)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 16px",
                        background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                        borderLeft: `3px solid ${isActive ? "#3b82f6" : "transparent"}`,
                        border: "none", cursor: "pointer",
                        display: "block",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                          {issue.title}
                        </p>
                        {hasCta && <span style={{ fontSize: 9, color: "#ec4899", background: "rgba(236,72,153,0.15)", padding: "1px 5px", borderRadius: 100, fontWeight: 700 }}>ACTION</span>}
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 100 }} />
                      </div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>{pct}% · {issue.location}</p>
                    </button>
                  );
                })}
              </div>

              {/* Detail panel */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {selected && <IssueTracker issue={selected} />}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
