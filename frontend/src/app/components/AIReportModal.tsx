import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Zap, AlertTriangle, Clock, Users, Shield, FileText,
  TrendingUp, Eye, CheckCircle, Loader2, Cpu, Target, MapPin, Volume2, Mic
} from "lucide-react";
import { API_BASE } from "../lib/apiClient";

// ── Types ──────────────────────────────────────────────────────────────
interface YoloDetection {
  class: string;
  confidence: number;
}

interface AIReport {
  issue_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url?: string;
  status: string;
  priority: string;
  ai_score: number;
  citizen_impact_score: number;
  suggested_category: string;
  summary: string;
  risk_assessment: string;
  recommended_action: string;
  suggested_sla_hours: number;
  full_report: string;
  yolo_detections: YoloDetection[];
  ai_annotated_image_url?: string;
  voice_recording_url?: string;
  image_analyzed: boolean;
  yolo_ran: boolean;
}

interface AIReportModalProps {
  issueId: string | null;
  issueTitle?: string;
  onClose: () => void;
}

// ── Color maps ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)", text: "#ff6b6b", border: "rgba(239,68,68,0.35)", glow: "0 0 40px rgba(239,68,68,0.18)" },
  high:     { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.35)", glow: "0 0 40px rgba(249,115,22,0.15)" },
  medium:   { bg: "rgba(234,179,8,0.12)",  text: "#facc15", border: "rgba(234,179,8,0.35)",  glow: "0 0 40px rgba(234,179,8,0.15)"  },
  low:      { bg: "rgba(100,116,139,0.1)", text: "#94a3b8", border: "rgba(100,116,139,0.3)", glow: "0 0 40px rgba(100,116,139,0.1)" },
};

// Confidence → color
function confColor(conf: number): string {
  if (conf >= 0.85) return "#34d399";
  if (conf >= 0.65) return "#60a5fa";
  return "#facc15";
}

// Score bar
function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${color}, #60a5fa)` }}
      />
    </div>
  );
}

// Section card
function Section({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────
export default function AIReportModal({ issueId, issueTitle, onClose }: AIReportModalProps) {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issueId) return;
    setReport(null);
    setError(null);
    setLoading(true);

    fetch(`${API_BASE}/issues/${issueId}/ai-report`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((data) => { setReport(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [issueId]);

  if (!issueId) return null;
  const colors = report ? (PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium) : PRIORITY_COLORS.medium;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1100,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.94 }}
          transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 680, maxHeight: "92vh", overflowY: "auto",
            background: "linear-gradient(140deg, #080f20 0%, #0b1530 55%, #07101e 100%)",
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            boxShadow: `0 32px 100px rgba(0,0,0,0.7), ${colors.glow}`,
            fontFamily: "'Inter', sans-serif",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {/* ─ Header ─────────────────────────────────────────────────── */}
          <div style={{
            padding: "1.25rem 1.5rem 1rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            position: "sticky", top: 0, zIndex: 10,
            background: "linear-gradient(140deg, #080f20 0%, #0b1530 100%)",
          }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              {/* Badge row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20,
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                  fontSize: 10, fontWeight: 700, color: "#a5b4fc",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  <Cpu size={9} /> AI Analysis Report
                </div>
                {report && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    fontSize: 10, fontWeight: 700, color: colors.text,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    <Zap size={9} /> {report.priority} priority
                  </div>
                )}
              </div>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.35,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {issueTitle || "Issue AI Report"}
              </h2>
              {report && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "5px 0 0" }}>
                  <MapPin size={10} style={{ display: "inline", marginRight: 4 }} />
                  {report.location} · {report.category}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, width: 32, height: 32, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* ─ Body ───────────────────────────────────────────────────── */}
          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>

            {/* Loading state */}
            {loading && (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", color: "#6366f1", marginBottom: 16 }}
                >
                  <Loader2 size={36} />
                </motion.div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
                  Running YOLO detection + Gemini AI analysis…
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6 }}>
                  This may take 5–15 seconds
                </p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12, padding: "1.5rem", textAlign: "center",
              }}>
                <AlertTriangle size={28} color="#ff6b6b" style={{ marginBottom: 10 }} />
                <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0, fontWeight: 600 }}>Analysis Failed</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6 }}>{error}</p>
              </div>
            )}

            {/* Report content */}
            {report && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                {/* ── Score grid ─────────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { icon: <TrendingUp size={14} />, label: "AI Score", value: `${report.ai_score}`, suffix: "/100", color: colors.text },
                    { icon: <Clock size={14} />, label: "SLA Window", value: `${report.suggested_sla_hours}h`, suffix: "", color: "#60a5fa" },
                    { icon: <Users size={14} />, label: "Impact Score", value: `${report.citizen_impact_score}`, suffix: "/100", color: "#a78bfa" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12, padding: "12px 10px", textAlign: "center",
                    }}>
                      <div style={{ color: item.color, display: "flex", justifyContent: "center", marginBottom: 6 }}>{item.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>
                        {item.value}<span style={{ fontSize: 11, opacity: 0.4 }}>{item.suffix}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 3 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Citizen Voice Note Audio Player (Admin Access) ───────────────── */}
                {report.voice_recording_url && (
                  <Section title="Citizen Voice Recording" icon={<Mic size={13} />} color="#34d399">
                    <div style={{
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(52,211,153,0.3)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                          <Volume2 size={16} />
                          <span>Original Voice Complaint Audio Clip</span>
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: 10 }}>
                          Official Admin Access
                        </span>
                      </div>
                      <audio
                        controls
                        src={report.voice_recording_url}
                        style={{ width: "100%", height: 40, borderRadius: 8, outline: "none" }}
                      />
                    </div>
                  </Section>
                )}

                {/* ── Detection badges ───────────────────────────────── */}
                <Section title="YOLO Computer Vision" icon={<Eye size={13} />} color="#22d3ee">
                  {report.ai_annotated_image_url ? (
                    <div style={{
                      width: "100%",
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(34,211,238,0.2)",
                      marginBottom: 14,
                      background: "#050a15",
                    }}>
                      <img
                        src={report.ai_annotated_image_url.startsWith("http") ? report.ai_annotated_image_url : `${API_BASE}${report.ai_annotated_image_url}`}
                        alt="YOLO Object Detection Bounding Boxes"
                        style={{
                          width: "100%",
                          maxHeight: 280,
                          objectFit: "contain",
                          display: "block",
                          margin: "0 auto",
                        }}
                      />
                      {/* Laser Scanning Line Animation */}
                      <div style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: 2,
                        background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
                        boxShadow: "0 0 10px #22d3ee, 0 0 20px #22d3ee",
                        animation: "scan 3s linear infinite",
                        top: 0,
                      }} />
                      {/* High-tech HUD corner markers */}
                      <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontFamily: "monospace", color: "#22d3ee", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(34,211,238,0.3)" }}>
                        📷 DETECTED_FEED
                      </div>
                    </div>
                  ) : report.image_url ? (
                    <div style={{
                      width: "100%",
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      marginBottom: 14,
                      background: "#050a15",
                    }}>
                      <img
                        src={report.image_url.startsWith("http") ? report.image_url : `${API_BASE}${report.image_url}`}
                        alt="Original Issue"
                        style={{
                          width: "100%",
                          maxHeight: 280,
                          objectFit: "contain",
                          display: "block",
                          margin: "0 auto",
                        }}
                      />
                      <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)" }}>
                        📷 ORIGINAL_IMAGE
                      </div>
                    </div>
                  ) : null}
                  <style>{`
                        @keyframes scan {
                          0% { top: 0%; opacity: 0; }
                          10% { opacity: 1; }
                          90% { opacity: 1; }
                          100% { top: 100%; opacity: 0; }
                        }
                      `}</style>

                  {report.yolo_detections.length > 0 ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                        {report.yolo_detections.map((det, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "5px 12px", borderRadius: 20,
                              background: `rgba(34,211,238,0.08)`,
                              border: `1px solid rgba(34,211,238,0.2)`,
                              fontSize: 11, fontFamily: "monospace",
                            }}
                          >
                            <span style={{ color: confColor(det.confidence), fontWeight: 700, textTransform: "capitalize" }}>{det.class}</span>
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>
                              {Math.round(det.confidence * 100)}%
                            </span>
                          </motion.span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                        <span style={{ color: "#34d399" }}>●</span> ≥85% confident
                        <span style={{ color: "#60a5fa", marginLeft: 8 }}>●</span> 65–84%
                        <span style={{ color: "#facc15", marginLeft: 8 }}>●</span> 50–64%
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, fontStyle: "italic" }}>
                      {report.image_analyzed
                        ? "No objects detected above 50% confidence threshold — analysis based on description."
                        : "No image attached — analysis based on citizen description only."}
                    </p>
                  )}
                </Section>

                {/* ── Full report ────────────────────────────────────── */}
                <Section title="Full Inspection Report" icon={<FileText size={13} />} color="#818cf8">
                  <p style={{
                    fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, margin: 0,
                    borderLeft: "3px solid rgba(129,140,248,0.3)", paddingLeft: 12,
                  }}>
                    {report.full_report}
                  </p>
                </Section>

                {/* ── Summary ────────────────────────────────────────── */}
                <Section title="AI Intelligence Summary" icon={<Zap size={13} />} color="#60a5fa">
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>
                    {report.summary}
                  </p>
                </Section>

                {/* ── Risk ───────────────────────────────────────────── */}
                <Section title="Risk Assessment" icon={<AlertTriangle size={13} />} color={colors.text}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>
                    {report.risk_assessment}
                  </p>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hazard Level</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{report.ai_score}/100</span>
                    </div>
                    <ScoreBar value={report.ai_score} color={colors.text} />
                  </div>
                </Section>

                {/* ── Recommended action ─────────────────────────────── */}
                <Section title="Recommended Action" icon={<Shield size={13} />} color="#34d399">
                  <div style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Target size={14} color="#34d399" />
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>
                      {report.recommended_action}
                    </p>
                  </div>
                </Section>

                {/* ── Impact progress ────────────────────────────────── */}
                <div style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <Users size={10} style={{ display: "inline", marginRight: 4 }} />
                      Citizen Impact Score
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#a78bfa" }}>{report.citizen_impact_score}/100</span>
                  </div>
                  <ScoreBar value={report.citizen_impact_score} color="#a78bfa" />
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                <div style={{
                  marginTop: 16, padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)", borderRadius: 10,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={9} color="#34d399" />
                      Image analyzed: {report.image_analyzed ? "Yes" : "No"}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={9} color={report.yolo_ran ? "#34d399" : "#94a3b8"} />
                      YOLO detected: {report.yolo_ran ? `${report.yolo_detections.length} objects` : "Nothing"}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                    Urban Eye AI · Gemini + YOLOv8
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
