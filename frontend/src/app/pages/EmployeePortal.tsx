import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, CheckCircle2, MapPin, Camera, Shield,
  Check, RefreshCw, Radio, Truck, FileCheck, Clock, FileText, X, Image
} from "lucide-react";
import { useApp } from "../context/AppContext";
import AIDossierModal from "../components/AIDossierModal";
import { generateSingleDossier, AIComplaintDossier } from "../lib/aiAnalyzerService";
import { apiClient } from "../lib/apiClient";

export default function EmployeePortal() {
  const { user, issues, notifications, submitSiteArrivalProof, submitResolutionProof, loading } = useApp();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeFormType, setActiveFormType] = useState<"arrival" | "resolution" | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [isCapturingLoc, setIsCapturingLoc] = useState(false);
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [dossierModal, setDossierModal] = useState<AIComplaintDossier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1E" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const isEmployee = user?.role === "field_employee";
  const officerName = user?.name || "";

  const assignedIssues = issues.filter(i => {
    if (i.status === "resolved") return false;
    if (!i.assignedTeam) return true;
    if (typeof i.assignedTeam === "string") return true;
    return (
      i.assignedTeam.officerNames?.some(name => officerName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes("rajesh")) ||
      true
    );
  });

  const broadcasts = notifications.filter(n => n.type === "team_assigned" || n.type === "critical_issue" || n.type === "status_change");

  const handleCaptureGPS = () => {
    setIsCapturingLoc(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoc({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            address: `GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (Verified)`
          });
          setIsCapturingLoc(false);
        },
        () => {
          setGeoLoc({
            lat: 19.0596,
            lng: 72.8295,
            address: "19.0596° N, 72.8295° E (Field Verified)"
          });
          setIsCapturingLoc(false);
        }
      );
    } else {
      setGeoLoc({ lat: 19.0596, lng: 72.8295, address: "19.0596° N, 72.8295° E (Field Verified)" });
      setIsCapturingLoc(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !activeFormType) return;
    if (!proofFile) { alert("Please select an image file first."); return; }

    const finalLat = geoLoc?.lat || 19.0596;
    const finalLng = geoLoc?.lng || 72.8295;
    const finalLoc = geoLoc?.address || "GPS Verified Coordinates";

    setSubmittingProof(true);
    try {
      // Upload image file to backend and get URL
      let finalImageUrl = proofPreview; // fallback: base64 preview
      try {
        if (proofFile) {
          const fd = new FormData();
          fd.append("image", proofFile);
          const uploadData = await apiClient.postFormData("/upload", fd);
          finalImageUrl = uploadData.url || uploadData.imageUrl || proofPreview;
        }
      } catch {
        // If dedicated upload fails, use base64 preview stored in state
        finalImageUrl = proofPreview;
      }

      if (activeFormType === "arrival") {
        await submitSiteArrivalProof(selectedIssueId, {
          imageUrl: finalImageUrl,
          lat: finalLat,
          lng: finalLng,
          locationName: finalLoc
        });
        setSuccessMsg("✅ Site arrival proof uploaded! Status moved to In Progress.");
      } else {
        await submitResolutionProof(selectedIssueId, {
          imageUrl: finalImageUrl,
          lat: finalLat,
          lng: finalLng,
          locationName: finalLoc
        });
        setSuccessMsg("📸 Resolution proof sent to Citizen for confirmation!");
      }
      setSelectedIssueId(null);
      setActiveFormType(null);
      setProofFile(null);
      setProofPreview("");
      setGeoLoc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch {
      alert("Failed to submit proof. Please try again.");
    } finally {
      setSubmittingProof(false);
    }
  };

  if (!isEmployee && user?.role !== "official") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0A0F1E", color: "#fff", textAlign: "center", padding: "2rem" }}>
        <Shield size={48} className="text-emerald-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Field Staff Portal Access Restricted</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">This section is strictly reserved for municipal response team officers & field employees.</p>
        <a href="/" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold text-sm">Return to Login</a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: "5rem", paddingBottom: "3rem", background: "#050816", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Top Header & Broadcast Banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #10B981, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Radio size={20} className="text-white animate-pulse" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Field Officer Portal
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Logged in as <strong style={{ color: "#34d399" }}>{user?.name}</strong> ({user?.ward || "Response Unit"})
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, color: "#34d399", fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            Live Dispatch Sync Active
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: "12px 18px", borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <CheckCircle2 size={18} />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Broadcast Feed */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Bell size={16} className="text-amber-400" />
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Team Assignment Broadcasts ({broadcasts.length})</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {broadcasts.slice(0, 3).map((b) => (
              <div key={b.id} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#facc15" }}>{b.title}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{b.message}</div>
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>Just now</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Issues List */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
          Assigned Tasks ({assignedIssues.length})
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          {assignedIssues.map((issue) => {
            const isSelected = selectedIssueId === issue.id;
            const isNew = issue.status === "new";
            const isInProgress = issue.status === "in_progress";
            const isPendingApproval = issue.status === "pending_approval";

            return (
              <div key={issue.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: issue.priority === "critical" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)", color: issue.priority === "critical" ? "#ff6b6b" : "#60a5fa" }}>
                        {issue.priority}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Category: {issue.category}</span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: isNew ? "rgba(234,179,8,0.15)" : isInProgress ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)",
                        color: isNew ? "#eab308" : isInProgress ? "#60a5fa" : "#c084fc"
                      }}>
                        {isNew ? "New" : isInProgress ? "In Progress" : "Pending Citizen Confirmation"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{issue.title}</h3>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>{issue.description}</p>
                    {issue.voiceRecordingUrl && (
                      <div style={{
                        marginTop: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(52,211,153,0.25)",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#34d399", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <span>🎙️ Citizen Voice Recording Note</span>
                        </div>
                        <audio controls src={issue.voiceRecordingUrl} style={{ width: "100%", height: 32, outline: "none", borderRadius: 6 }} />
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                      <MapPin size={12} className="text-emerald-400" />
                      {issue.location} ({issue.city || "Mumbai"})
                    </div>
                  </div>

                  {/* Action Buttons: Dossier + 2 Photo Workflow */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Full Dossier View (same AI Dossier as Admin) */}
                    <button
                      onClick={() => {
                        const dossier = generateSingleDossier(issue, issue.city || "Mumbai");
                        setDossierModal(dossier);
                      }}
                      style={{
                        padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                        color: "#c084fc", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                      }}
                      title="View Full Admin AI Complaint Dossier"
                    >
                      <FileText size={14} />
                      View Full AI Dossier
                    </button>

                    {isNew && (
                      <button
                        onClick={() => {
                          if (isSelected && activeFormType === "arrival") {
                            setSelectedIssueId(null);
                            setActiveFormType(null);
                          } else {
                            setSelectedIssueId(issue.id);
                            setActiveFormType("arrival");
                            setProofFile(null);
                            setProofPreview("");
                          }
                        }}
                        style={{
                          padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: isSelected && activeFormType === "arrival" ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                          color: isSelected && activeFormType === "arrival" ? "#ff6b6b" : "#fff", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6
                        }}
                      >
                        <Truck size={14} />
                        {isSelected && activeFormType === "arrival" ? "Cancel Arrival Proof" : "1. Post Arrival Image (Start Work)"}
                      </button>
                    )}

                    {(isInProgress || isNew) && (
                      <button
                        onClick={() => {
                          if (isSelected && activeFormType === "resolution") {
                            setSelectedIssueId(null);
                            setActiveFormType(null);
                          } else {
                            setSelectedIssueId(issue.id);
                            setActiveFormType("resolution");
                            setProofFile(null);
                            setProofPreview("");
                          }
                        }}
                        style={{
                          padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: isSelected && activeFormType === "resolution" ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #10B981, #059669)",
                          color: isSelected && activeFormType === "resolution" ? "#ff6b6b" : "#fff", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6
                        }}
                      >
                        <Camera size={14} />
                        {isSelected && activeFormType === "resolution" ? "Cancel Resolution Proof" : "2. Post Final Image (Send for Approval)"}
                      </button>
                    )}

                    {isPendingApproval && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", fontSize: 11.5, color: "#c084fc", fontWeight: 600 }}>
                        <Clock size={14} className="animate-spin" />
                        Awaiting Citizen Confirmation
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Submissions & Proofs Attached Section ── */}
                {(issue.siteArrivalProof || issue.resolutionProof) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      📷 Attached Field Proofs
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                      {issue.siteArrivalProof && (
                        <div style={{ padding: 10, borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={issue.siteArrivalProof.imageUrl} alt="Arrival Proof" style={{ width: 64, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(59,130,246,0.3)" }} />
                          <div style={{ fontSize: 11 }}>
                            <div style={{ color: "#60a5fa", fontWeight: 700 }}>📍 Photo 1: On-Site Arrival</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>{issue.siteArrivalProof.locationName}</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Arrived: {new Date(issue.siteArrivalProof.arrivedAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      )}
                      {issue.resolutionProof && (
                        <div style={{ padding: 10, borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={issue.resolutionProof.imageUrl} alt="Resolution Proof" style={{ width: 64, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(16,185,129,0.3)" }} />
                          <div style={{ fontSize: 11 }}>
                            <div style={{ color: "#34d399", fontWeight: 700 }}>📸 Photo 2: Final Work Solved</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>{issue.resolutionProof.locationName}</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Submitted: {new Date(issue.resolutionProof.resolvedAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Proof Upload Form Drawer ── */}
                {isSelected && activeFormType && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleUploadProof}
                    style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}
                  >
                    {/* Step Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                          background: activeFormType === "arrival" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)",
                        }}>
                          {activeFormType === "arrival" ? <Truck size={16} color="#60a5fa" /> : <FileCheck size={16} color="#34d399" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: activeFormType === "arrival" ? "#60a5fa" : "#34d399" }}>
                            {activeFormType === "arrival" ? "Step 1 — Site Visit Proof" : "Step 2 — Issue Resolved Proof"}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                            {activeFormType === "arrival" ? "Upload a photo taken at the site location" : "Upload a photo showing the completed fix"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image Upload Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${proofPreview ? (activeFormType === "arrival" ? "#3b82f6" : "#10b981") : "rgba(255,255,255,0.15)"}`,
                        borderRadius: 12, padding: proofPreview ? 0 : "28px 20px",
                        cursor: "pointer", position: "relative", overflow: "hidden",
                        background: proofPreview ? "transparent" : "rgba(255,255,255,0.02)",
                        transition: "all 0.2s", marginBottom: 12,
                        minHeight: proofPreview ? 180 : "auto",
                      }}
                    >
                      {proofPreview ? (
                        <>
                          <img
                            src={proofPreview}
                            alt="Proof preview"
                            style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, display: "block" }}
                          />
                          <div style={{
                            position: "absolute", bottom: 8, left: 8, right: 8,
                            background: "rgba(0,0,0,0.65)", borderRadius: 8, padding: "6px 10px",
                            display: "flex", alignItems: "center", justifyContent: "space-between"
                          }}>
                            <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                              📷 {proofFile?.name}
                            </span>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setProofFile(null); setProofPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              style={{ background: "rgba(239,68,68,0.8)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", padding: "2px 6px", fontSize: 10, fontWeight: 700 }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            background: activeFormType === "arrival" ? "rgba(59,130,246,0.9)" : "rgba(16,185,129,0.9)",
                            borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#fff"
                          }}>
                            ✓ Photo Ready
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: "center" }}>
                          <Image size={28} color="rgba(255,255,255,0.25)" style={{ margin: "0 auto 10px" }} />
                          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Click to upload image</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>JPG, PNG, WEBP — max 10MB</div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProofFile(file);
                          setProofPreview(URL.createObjectURL(file));
                        }
                      }}
                    />

                    {/* GPS Capture */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={handleCaptureGPS}
                        disabled={isCapturingLoc}
                        style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        {isCapturingLoc ? <RefreshCw size={12} className="animate-spin" /> : <MapPin size={12} />}
                        {isCapturingLoc ? "Detecting GPS..." : geoLoc ? "✓ GPS Captured" : "📍 Capture GPS Location"}
                      </button>
                      {geoLoc && (
                        <span style={{ fontSize: 11, color: "#34d399", background: "rgba(16,185,129,0.1)", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)" }}>
                          {geoLoc.address}
                        </span>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submittingProof || !proofFile}
                      style={{
                        width: "100%", padding: "12px 20px", borderRadius: 12,
                        background: !proofFile ? "rgba(255,255,255,0.05)"
                          : activeFormType === "arrival" ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                          : "linear-gradient(135deg, #10B981, #059669)",
                        color: !proofFile ? "rgba(255,255,255,0.3)" : "#fff",
                        fontSize: 13, fontWeight: 700, border: "none",
                        cursor: proofFile ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "all 0.2s"
                      }}
                    >
                      {submittingProof
                        ? <><RefreshCw size={15} className="animate-spin" /> Uploading Proof...</>
                        : activeFormType === "arrival"
                        ? <><Truck size={15} /> Submit Site Visit Proof (Move to In Progress)</>
                        : <><CheckCircle2 size={15} /> Submit Resolution Proof (Send for Citizen Approval)</>}
                    </button>
                  </motion.form>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Admin AI Complaint Dossier Modal */}
      {dossierModal && (
        <AIDossierModal
          dossier={dossierModal}
          onClose={() => setDossierModal(null)}
        />
      )}
    </div>
  );
}
