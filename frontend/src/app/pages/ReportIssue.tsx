import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MapPin, Camera, FileText, Send, CheckCircle2, Eye,
  ChevronRight, ChevronLeft, X, Upload, AlertTriangle,
  Building2, Trees, Droplets, Car, PlayCircle,
  Navigation, ZoomIn, ZoomOut, Search
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Issue, IssueCategory, IssuePriority } from "../data/mockData";
import VoiceRecorder from "../components/VoiceRecorder";

declare const L: any;

const STEPS = [
  { id: 1, key: "step_1", defaultTitle: "Issue Details", icon: FileText },
  { id: 2, key: "step_2", defaultTitle: "Location", icon: MapPin },
  { id: 3, key: "step_3", defaultTitle: "Photos", icon: Camera },
  { id: 4, key: "step_4", defaultTitle: "Preview & Submit", icon: Send },
];

const CATEGORIES: { value: IssueCategory; key: string; defaultLabel: string; icon: typeof Building2; color: string }[] = [
  { value: "Infrastructure", key: "cat_infrastructure", defaultLabel: "Infrastructure", icon: Building2, color: "#3b82f6" },
  { value: "Safety", key: "cat_safety", defaultLabel: "Safety", icon: AlertTriangle, color: "#ef4444" },
  { value: "Environment", key: "cat_environment", defaultLabel: "Environment", icon: Trees, color: "#10b981" },
  { value: "Utilities", key: "cat_utilities", defaultLabel: "Utilities", icon: Droplets, color: "#f59e0b" },
  { value: "Traffic", key: "cat_traffic", defaultLabel: "Traffic", icon: Car, color: "#8b5cf6" },
  { value: "Public Spaces", key: "cat_public_spaces", defaultLabel: "Public Spaces", icon: PlayCircle, color: "#06b6d4" },
];

const PRIORITIES: { value: IssuePriority; key: string; descKey: string; defaultLabel: string; defaultDesc: string; color: string }[] = [
  { value: "low", key: "prio_low", descKey: "prio_low_desc", defaultLabel: "Low", defaultDesc: "Minor inconvenience", color: "#64748b" },
  { value: "medium", key: "prio_medium", descKey: "prio_medium_desc", defaultLabel: "Medium", defaultDesc: "Affects some residents", color: "#f59e0b" },
  { value: "high", key: "prio_high", descKey: "prio_high_desc", defaultLabel: "High", defaultDesc: "Significant impact", color: "#f97316" },
  { value: "critical", key: "prio_critical", descKey: "prio_critical_desc", defaultLabel: "Critical", defaultDesc: "Immediate danger", color: "#ef4444" },
];

// Reads an uploaded photo, downscales it on a canvas, and resolves with a
// persistent base64 data: URL. We deliberately avoid URL.createObjectURL()
// here — a blob: URL only lives as long as the browser tab that created it,
// so once the issue is saved to Firestore and reopened later (or viewed by
// another user/device) that link is dead and the image disappears. A base64
// data URL survives reloads and renders for every viewer.
function fileToCompressedDataUrl(file: File, maxWidth = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result as string);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Real GPS Location Map Component ──────────────────────────────────────────
function LocationPicker({ onSelect }: {
  onSelect: (data: { lat: number; lng: number; address: string }) => void
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(!!(window as any).L);
  const [mapReady, setMapReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [pinned, setPinned] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Load Leaflet
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Init map
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });
    // OpenStreetMap & CARTO tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      placeMarker(map, lat, lng, address);
    });

    mapRef.current = map;
    setMapReady(true);
  }, [leafletReady]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name?.split(",").slice(0, 4).join(", ") ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  function placeMarker(map: any, lat: number, lng: number, address: string) {
    if (markerRef.current) map.removeLayer(markerRef.current);
    const icon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:36px;height:36px;">
          <div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(59,130,246,0.2);animation:reportPulse 1.5s ease-out infinite;"></div>
          <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#3b82f6;border:3px solid white;box-shadow:0 0 20px rgba(59,130,246,0.7);display:flex;align-items:center;justify-content:center;">
            <div style="transform:rotate(45deg);color:white;font-size:14px;">📍</div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
    markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
    markerRef.current.on("dragend", async (e: any) => {
      const { lat: newLat, lng: newLng } = e.target.getLatLng();
      const newAddress = await reverseGeocode(newLat, newLng);
      const data = { lat: newLat, lng: newLng, address: newAddress };
      setPinned(data);
      onSelect(data);
    });
    const data = { lat, lng, address };
    setPinned(data);
    onSelect(data);
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }

  function handleGPS() {
    if (!navigator.geolocation) { setGpsError("GPS not available in this browser"); return; }
    setGpsLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        if (mapRef.current) placeMarker(mapRef.current, lat, lng, address);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.code === 1 ? "Permission denied — please allow location access" : "Could not detect location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ", India")}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat), lngNum = parseFloat(lon);
        if (mapRef.current) placeMarker(mapRef.current, latNum, lngNum, display_name);
      } else {
        setGpsError("Location not found. Try a different search.");
      }
    } catch {
      setGpsError("Search failed. Please try again.");
    }
    setSearching(false);
  }

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes reportPulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        .leaflet-dark-tooltip {
          background: rgba(7,13,26,0.95) !important; border: 1px solid rgba(59,130,246,0.3) !important;
          color: #e2e8f0 !important; font-size: 12px !important; border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important; padding: 6px 10px !important;
        }
        .leaflet-dark-tooltip::before { display: none !important; }
        .leaflet-control-attribution { background: rgba(7,13,26,0.6) !important; color: rgba(100,116,139,0.4) !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: rgba(100,116,139,0.6) !important; }
      `}</style>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search area, street, landmark in India..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50">
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-blue-500/20" style={{ height: 340 }}>
        <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

        {!mapReady && (
          <div className="absolute inset-0 bg-[#070d1a] flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Loading satellite map...</p>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        {mapReady && (
          <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
            <button onClick={() => mapRef.current?.zoomIn()}
              className="w-8 h-8 rounded-lg bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 text-xs">
              <ZoomIn size={13} />
            </button>
            <button onClick={() => mapRef.current?.zoomOut()}
              className="w-8 h-8 rounded-lg bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 text-xs">
              <ZoomOut size={13} />
            </button>
          </div>
        )}

        {/* GPS button */}
        {mapReady && (
          <button onClick={handleGPS} disabled={gpsLoading}
            className={`absolute top-2 left-2 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm border shadow-lg ${gpsLoading ? "bg-blue-600/70 border-blue-500/50 text-white" : "bg-[rgba(7,13,26,0.9)] border-white/15 text-slate-300 hover:text-white hover:border-blue-500/40"
              } disabled:opacity-60`}>
            <Navigation size={11} className={gpsLoading ? "animate-spin" : ""} />
            {gpsLoading ? "Detecting..." : "Use My GPS"}
          </button>
        )}

        {/* Hint overlay if no pin yet */}
        {mapReady && !pinned && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[999] px-3 py-1.5 rounded-lg bg-[rgba(7,13,26,0.85)] border border-white/10 text-xs text-slate-400 backdrop-blur-sm whitespace-nowrap">
            Click on the map to pin your location • Drag pin to adjust
          </div>
        )}
      </div>

      {/* GPS error */}
      {gpsError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <AlertTriangle size={11} /> {gpsError}
          <button onClick={() => setGpsError("")} className="ml-auto"><X size={10} /></button>
        </div>
      )}

      {/* Selected location */}
      {pinned && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
          <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-200 mb-0.5">Location pinned ✓</p>
            <p className="text-xs text-slate-300 leading-relaxed">{pinned.address}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{pinned.lat.toFixed(5)}, {pinned.lng.toFixed(5)}</p>
          </div>
          <button onClick={() => { if (markerRef.current && mapRef.current) mapRef.current.removeLayer(markerRef.current); setPinned(null); onSelect({ lat: 0, lng: 0, address: "" }); }}
            className="text-slate-400 hover:text-white flex-shrink-0"><X size={12} /></button>
        </motion.div>
      )}
    </div>
  );
}

// ── Main ReportIssue Page ─────────────────────────────────────────────────────
export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { addIssue, user, language, t } = useApp();
  const navigate = useNavigate();

  const [voiceAudio, setVoiceAudio] = useState<string | null>(null);
  const voiceBaselineRef = useRef<string>("");

  const [form, setForm] = useState({
    title: "", description: "", category: "" as IssueCategory | "",
    priority: "medium" as IssuePriority, location: "", lat: 0, lng: 0, image: "",
  });
  const [uploadedImage, setUploadedImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function canAdvance() {
    if (step === 1) return form.title.length > 5 && !!form.category && form.description.length > 10;
    if (step === 2) return !!form.location && form.lat !== 0;
    return true;
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImageProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setUploadedImage(dataUrl);
    } finally {
      setImageProcessing(false);
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Tracking ID shown on the confirmation screen, regenerated on each submit.
  const [trackingId, setTrackingId] = useState("");

  /** Reset the whole wizard back to a blank first step for a new report. */
  function resetForm() {
    setSubmitted(false);
    setStep(1);
    setForm({ title: "", description: "", category: "", priority: "medium", location: "", lat: 0, lng: 0, image: "" });
    setUploadedImage("");
    setSelectedFile(null);
    setVoiceAudio(null);
    setSubmitError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const newIssue: Omit<Issue, "id"> = {
        title: form.title, description: form.description,
        category: form.category as IssueCategory, priority: form.priority,
        status: "new", location: form.location, lat: form.lat, lng: form.lng,
        votes: 1, comments: 0,
        reportedBy: user?.uid || "anonymous",
        reportedAt: new Date().toISOString().split("T")[0],
        image: uploadedImage || form.image,
        voiceRecordingUrl: voiceAudio || undefined,
        tags: [form.category as string, form.priority],
      };
      await addIssue(newIssue, selectedFile);
      setTrackingId(Date.now().toString().slice(-6));
      setSubmitted(true);
    } catch (err) {
      // addIssue rolls back and re-throws on backend failure. Surface the
      // problem instead of failing silently, so the user knows to retry.
      console.error("Report submission failed:", err);
      setSubmitError(
        err instanceof Error && err.message
          ? `Couldn't submit your report (${err.message}). Please try again.`
          : "Couldn't submit your report. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-md px-4 w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
            className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: "0 0 48px rgba(16,185,129,0.3)" }}>
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Issue Reported!</h2>

          <p className="text-slate-400 mb-4 text-sm">Your report with GPS coordinates has been submitted successfully.</p>

          {/* Submission summary */}
          <div className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6 space-y-3">
            {form.title && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Report</p>
                <p className="text-sm text-white font-medium leading-snug">{form.title}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs">{form.location || "Location captured"}</span>
            </div>
            {form.lat !== 0 && (
              <p className="text-[10px] font-mono text-slate-500">GPS: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
            )}
            <div className="flex items-center justify-between border-t border-white/8 pt-3">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Tracking ID</span>
              <span className="font-mono text-xs text-emerald-300">#URB{trackingId}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            We'll keep you updated as your report is reviewed and assigned.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/8 text-white text-sm font-medium hover:bg-white/12 transition-all">
              Report Another
            </button>
            <button onClick={() => navigate("/map")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(59,130,246,0.4)]">
              View on Map
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/8 text-white text-sm font-medium hover:bg-white/12 transition-all">
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("report_page_title")}</h1>
          <p className="text-slate-400 mt-2 text-sm">{t("report_page_subtitle")}</p>
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="h-1 bg-white/8 rounded-full mb-5 overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="flex items-center justify-between">
            {STEPS.map(s => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > s.id ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" :
                    step === s.id ? "bg-blue-600/25 border border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]" :
                      "bg-white/5 border border-white/10 text-slate-500"}`}>
                  {step > s.id ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step === s.id ? "text-blue-300" : "text-slate-500"}`}>{t(s.key)}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm p-6 mb-6">

          {/* Step 1 — Issue Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">{t("step_1")}</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t("issue_title_label")} *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={t("issue_title_placeholder")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t("category_label")} *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${form.category === cat.value ? "border-blue-500/50 bg-blue-500/15 text-white" : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white"}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "20" }}>
                        <cat.icon size={13} style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs">{t(cat.key)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t("priority_label")} *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                      className="px-3 py-3 rounded-xl border text-center transition-all"
                      style={form.priority === p.value ? { borderColor: p.color + "80", backgroundColor: p.color + "15" } : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <div className="text-sm font-semibold" style={form.priority === p.value ? { color: p.color } : { color: "#94a3b8" }}>{t(p.key)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t(p.descKey)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t("description_label")} *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t("description_placeholder")}
                  rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
                <div className="flex justify-end mt-1"><span className="text-xs text-slate-500">{form.description.length}/500</span></div>
              </div>

              {/* Optional Voice Recording & Speech-to-Text */}
              <VoiceRecorder
                language={language}
                onStartRecording={() => {
                  voiceBaselineRef.current = form.description;
                }}
                onTranscript={(transcribedText) => {
                  const base = voiceBaselineRef.current.trim();
                  const updated = base ? `${base}\n${transcribedText}` : transcribedText;
                  setForm(f => ({ ...f, description: updated }));
                }}
                onAudioRecorded={(audioBase64) => setVoiceAudio(audioBase64)}
              />
            </div>
          )}

          {/* Step 2 — Real GPS Map */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Pin the Location</h2>
                <p className="text-sm text-slate-400 mt-1">Use GPS to auto-detect, search an area, or click the satellite map to drop a pin</p>
              </div>
              <LocationPicker onSelect={({ lat, lng, address }) => {
                setForm(f => ({ ...f, lat, lng, location: address }));
              }} />
            </div>
          )}

          {/* Step 3 — Photo */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Add Photo Evidence</h2>
              <p className="text-sm text-slate-400">Photos significantly increase resolution speed</p>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-all">
                  <Upload size={22} className="text-blue-400" />
                </div>
                <p className="text-white font-medium mb-1">{imageProcessing ? "Processing photo..." : "Click to upload photo"}</p>
                <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </div>
              {uploadedImage && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover" />
                  <button onClick={() => setUploadedImage("")}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80">
                    <X size={13} className="text-white" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500 text-center">You can skip this and add photos later</p>
            </div>
          )}

          {/* Step 4 — Preview & Submit */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Eye size={16} className="text-blue-400" />
                <h2 className="text-base font-semibold text-white">Review Your Report</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {(uploadedImage || form.image) && (
                  <img src={uploadedImage || form.image} alt="" className="w-full h-44 object-cover" />
                )}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-white text-lg">{form.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{form.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {form.category && (
                      <span className="px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/20 font-medium">
                        {form.category}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/20 capitalize font-medium">
                      {form.priority} Priority
                    </span>
                  </div>
                  {form.location && (
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <MapPin size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{form.location}</span>
                    </div>
                  )}
                  {form.lat !== 0 && (
                    <p className="text-[10px] font-mono text-slate-500">GPS: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isSubmitting ? t("btn_submitting") : "Submit Report"}
              </button>

              {submitError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{submitError}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={16} /> {t("btn_back")}
          </button>
          <span className="text-xs text-slate-500 font-medium">{t("step_1").split(" ")[0]} {step} / {STEPS.length}</span>
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
              {t("btn_next")} <ChevronRight size={16} />
            </button>
          ) : (
            <div className="w-[100px]"></div> /* Placeholder to keep back button on left */
          )}
        </div>
      </div>
    </div>
  );
}