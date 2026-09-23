import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, X, ArrowUp, Filter, Search, Layers, ChevronDown,
  Satellite, Map, Navigation, AlertTriangle, Flame, Eye, ZoomIn, ZoomOut
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CATEGORY_COLOR, PRIORITY_COLOR, IssueCategory } from "../data/mockData";

// ── Leaflet loaded via CDN in useEffect ──────────────────────────────────────
declare const L: any;

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

// Hotspot radius in meters — issues within this radius are clustered
const HOTSPOT_RADIUS = 2000;

const TILE_LAYERS = {
  satellite: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Street Map",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: "Dark",
  },
  hybrid: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: "Voyager",
  },
};

const CITY_COORDINATES: Record<string, [number, number]> = {
  Mumbai: [19.0760, 72.8777],
  Delhi: [28.6139, 77.2090],
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
  Hyderabad: [17.3850, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Ahmedabad: [23.0225, 72.5714],
};

function getIssueCoords(issue: any): [number, number] {
  if (issue.lat && issue.lng && !isNaN(issue.lat) && !isNaN(issue.lng)) {
    return [issue.lat, issue.lng];
  }
  const city = issue.city || "Mumbai";
  const base = CITY_COORDINATES[city] || CITY_COORDINATES["Mumbai"];
  let hash = 0;
  const str = (issue.id || "") + (issue.title || "");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((Math.abs(hash) % 120) / 1500) - 0.04;
  const offsetLng = (((Math.abs(hash >> 3)) % 120) / 1500) - 0.04;
  return [base[0] + offsetLat, base[1] + offsetLng];
}

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat as IssueCategory] ?? "#6366f1";
}

export default function MapView() {
  const { issues, upvoteIssue, user } = useApp();
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<any>(null);
  const labelLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const hotspotsRef = useRef<any[]>([]);
  const droppedPinRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileMode, setTileMode] = useState<keyof typeof TILE_LAYERS>("satellite");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | IssueCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(INDIA_ZOOM);
  const [pinMode, setPinMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState("");

  const selectedIssue = issues.find(i => i.id === selected);

  const filtered = issues.filter(i => {
    if (filter !== "all" && i.category !== filter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
      !i.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Load Leaflet CSS + JS from CDN ──────────────────────────────────────
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

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark satellite tile
    const layer = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = layer;

    // Custom attribution styling
    map.attributionControl.setPrefix(false);

    mapRef.current = map;
    setMapReady(true);

    // Track zoom level
    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    // Click handler for pin mode
    map.on("click", async (e: any) => {
      if (!(window as any).__pinMode) return;
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      setDroppedPin({ lat, lng, address });
      showDroppedPin(map, lat, lng, address);
      showToast("📍 Pin dropped!");
    });
  }, [leafletReady]);

  // ── Switch tile layer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (labelLayerRef.current) map.removeLayer(labelLayerRef.current);

    const cfg = TILE_LAYERS[tileMode];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);

    if ((cfg as any).labels) {
      labelLayerRef.current = L.tileLayer((cfg as any).labels, {
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [tileMode, mapReady]);

  // ── Render issue markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    filtered.forEach(issue => {
      const [lat, lng] = getIssueCoords(issue);
      const color = categoryColor(issue.category);
      const isNew = issue.status === "new";
      const isCritical = issue.priority === "critical";

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            ${isNew ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:mapPulse 2s ease-out infinite;"></div>` : ""}
            <div style="
              width:28px;height:28px;border-radius:50%;
              background:${color}22;
              border:2px solid ${color};
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 0 12px ${color}55;
              cursor:pointer;
            ">
              <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
            </div>
            ${isCritical ? `<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ef4444;border:1.5px solid #fff;font-size:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">!</div>` : ""}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelected(id => id === issue.id ? null : issue.id);
          map.flyTo([lat, lng], 15, { duration: 1.2 });
        });

      markersRef.current.push(marker);
    });
  }, [filtered, mapReady]);

  // ── Render heatmap & hotspot circles ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    hotspotsRef.current.forEach(h => map.removeLayer(h));
    hotspotsRef.current = [];

    if (!showHotspots) return;

    const groups: { lat: number; lng: number; count: number; category: string; maxPriority: string }[] = [];
    filtered.forEach(issue => {
      const [lat, lng] = getIssueCoords(issue);
      const existing = groups.find(g => {
        const dlat = g.lat - lat;
        const dlng = g.lng - lng;
        return Math.sqrt(dlat * dlat + dlng * dlng) < 0.04;
      });
      if (existing) {
        existing.count++;
        if (issue.priority === "critical") existing.maxPriority = "critical";
      } else {
        groups.push({ lat, lng, count: 1, category: issue.category, maxPriority: issue.priority || "medium" });
      }
    });

    groups.forEach(g => {
      const intensity = Math.min(g.count / 4, 1);
      const color = g.maxPriority === "critical" || g.count >= 3 ? "#ef4444" : g.count >= 2 ? "#f97316" : "#3b82f6";
      const circle = L.circle([g.lat, g.lng], {
        radius: 1000 + (g.count * 500),
        color: color,
        fillColor: color,
        fillOpacity: 0.18 + (intensity * 0.25),
        weight: 2,
        dashArray: g.count >= 2 ? "6 4" : undefined,
      }).addTo(map);

      circle.bindTooltip(`🔥 Heatmap Zone: ${g.count} issue(s) reported nearby`, {
        className: "leaflet-dark-tooltip",
        sticky: true,
      });

      hotspotsRef.current.push(circle);
    });
  }, [filtered, showHotspots, mapReady]);

  // ── Fly to selected issue ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedIssue) return;
    const coords = getIssueCoords(selectedIssue);
    mapRef.current.flyTo(coords, 15, { duration: 1.2 });
  }, [selected, mapReady]);

  // ── Pin mode sync to window ───────────────────────────────────────────────
  useEffect(() => {
    (window as any).__pinMode = pinMode;
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = pinMode ? "crosshair" : "";
    }
  }, [pinMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  function showDroppedPin(map: any, lat: number, lng: number, address: string) {
    if (droppedPinRef.current) map.removeLayer(droppedPinRef.current);
    const icon = L.divIcon({
      className: "",
      html: `<div style="font-size:28px;filter:drop-shadow(0 0 8px rgba(59,130,246,0.8));transform:translateY(-14px);">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindTooltip(address, { className: "leaflet-dark-tooltip", permanent: false });
    droppedPinRef.current = marker;
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function handleGPS() {
    if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
    setGpsLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setGpsLoading(false);

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
          // Blue pulsing user location dot
          if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
          const icon = L.divIcon({
            className: "",
            html: `
              <div style="position:relative;width:20px;height:20px;">
                <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.2);animation:mapPulse 2s ease-out infinite;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          const address = await reverseGeocode(lat, lng);
          userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
          userMarkerRef.current.bindTooltip(`📍 You are here: ${address}`, {
            className: "leaflet-dark-tooltip",
            permanent: false,
          });
          showToast("📍 Located you!");
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.code === 1 ? "Location permission denied" : "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleVote(id: string) {
    if (votedIds.has(id)) return;
    upvoteIssue(id);
    setVotedIds(prev => new Set([...prev, id]));
  }

  function flyToIndia() {
    mapRef.current?.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.5 });
  }

  const categories = ["Infrastructure", "Safety", "Environment", "Utilities", "Traffic", "Public Spaces"] as const;

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16 flex flex-col">
      {/* Pulse animation injected globally */}
      <style>{`
        @keyframes mapPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0;   }
        }

        /* ── leaflet overrides ── */
        .leaflet-dark-tooltip {
          background: rgba(7,13,26,0.95) !important;
          border: 1px solid rgba(59,130,246,0.3) !important;
          color: #e2e8f0 !important; font-size: 12px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
          padding: 6px 10px !important;
        }
        .leaflet-dark-tooltip::before { display: none !important; }
        .leaflet-attribution-flag     { display: none !important; }
        .leaflet-control-attribution  {
          background: rgba(7,13,26,0.8) !important;
          color: rgba(100,116,139,0.6) !important; font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: rgba(100,116,139,0.8) !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live City Map</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time civic issues across India — GPS-tracked, hotspot-analyzed</p>
          </div>

          {/* Tile switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {(Object.keys(TILE_LAYERS) as (keyof typeof TILE_LAYERS)[]).map(mode => (
              <button key={mode} onClick={() => setTileMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tileMode === mode ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "text-slate-400 hover:text-white"}`}>
                {mode === "satellite" ? <Satellite size={12} /> : mode === "dark" ? <Map size={12} /> : <Layers size={12} />}
                {TILE_LAYERS[mode].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Controls row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4">

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search issues or locations..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-56" />
          </div>

          {/* City Quick Jump FlyTo Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {Object.keys(CITY_COORDINATES).slice(0, 5).map(c => (
              <button key={c}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo(CITY_COORDINATES[c], 13, { duration: 1.5 });
                    showToast(`✈️ Flying to ${c}`);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                {c}
              </button>
            ))}
          </div>

          {/* Category filter toggle */}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showFilters ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <Filter size={12} /> Categories <ChevronDown size={11} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Hotspots toggle */}
          <button onClick={() => setShowHotspots(h => !h)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showHotspots ? "border-orange-500/40 bg-orange-500/15 text-orange-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <Flame size={12} /> Hotspots {showHotspots ? "ON" : "OFF"}
          </button>

          {/* GPS */}
          <button onClick={handleGPS} disabled={gpsLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${userLocation ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"} disabled:opacity-50`}>
            <Navigation size={12} className={gpsLoading ? "animate-spin" : ""} />
            {gpsLoading ? "Locating..." : userLocation ? "Located ✓" : "My Location"}
          </button>

          {/* Pin drop */}
          <button onClick={() => { setPinMode(p => !p); if (pinMode) { if (droppedPinRef.current && mapRef.current) mapRef.current.removeLayer(droppedPinRef.current); setDroppedPin(null); } }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${pinMode ? "border-blue-500/60 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <MapPin size={12} /> {pinMode ? "Click map to pin..." : "Drop Pin"}
          </button>

          {/* Zoom to India */}
          <button onClick={flyToIndia}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs font-medium transition-all">
            <Eye size={12} /> All India
          </button>
        </motion.div>

        {/* Category pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-white/8 bg-[rgba(11,16,32,0.8)]">
                <button onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === "all" ? "bg-white/15 text-white border-white/20" : "border-white/8 text-slate-400 hover:text-white"}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilter(filter === cat ? "all" : cat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={filter === cat
                      ? { borderColor: categoryColor(cat) + "60", backgroundColor: categoryColor(cat) + "20", color: categoryColor(cat) }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: categoryColor(cat) }} />
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS error */}
        {gpsError && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={12} /> {gpsError}
            <button onClick={() => setGpsError("")} className="ml-auto"><X size={11} /></button>
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-sm font-medium w-fit">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 pb-6">
        <div className="grid lg:grid-cols-4 gap-4 h-full" style={{ minHeight: 560 }}>

          {/* Map */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden border border-blue-500/15 relative"
            style={{ minHeight: 500 }}>

            {/* Map container */}
            <div ref={mapDivRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />

            {/* Loading overlay */}
            {!mapReady && (
              <div className="absolute inset-0 bg-[#070d1a] flex items-center justify-center rounded-2xl z-10">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Loading map...</p>
                </div>
              </div>
            )}

            {/* Zoom controls */}
            {mapReady && (
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
                <button onClick={() => mapRef.current?.zoomIn()}
                  className="w-9 h-9 rounded-xl bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm">
                  <ZoomIn size={15} />
                </button>
                <button onClick={() => mapRef.current?.zoomOut()}
                  className="w-9 h-9 rounded-xl bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm">
                  <ZoomOut size={15} />
                </button>
              </div>
            )}

            {/* Pin mode badge */}
            {pinMode && (
              <div className="absolute top-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-2 shadow-[0_0_16px_rgba(59,130,246,0.5)]">
                <MapPin size={12} className="animate-bounce" /> Click anywhere to drop a pin
              </div>
            )}

            {/* Dropped pin info */}
            {droppedPin && !pinMode && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-3 right-3 z-[1000] px-4 py-3 rounded-xl bg-[rgba(7,13,26,0.95)] border border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white mb-0.5">Dropped Pin</p>
                    <p className="text-xs text-slate-400 truncate">{droppedPin.address}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{droppedPin.lat.toFixed(5)}, {droppedPin.lng.toFixed(5)}</p>
                  </div>
                  <button onClick={() => { if (droppedPinRef.current && mapRef.current) mapRef.current.removeLayer(droppedPinRef.current); setDroppedPin(null); }}
                    className="text-slate-400 hover:text-white flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stats bar */}
            <div className="absolute bottom-0 left-0 right-0 z-[999] px-4 py-2.5 border-t border-white/5 bg-[rgba(7,13,26,0.9)] backdrop-blur-sm flex items-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" />{filtered.length} issues</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />{filtered.filter(i => i.status === "new").length} new</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" />{filtered.filter(i => i.status === "resolved").length} resolved</span>
              {showHotspots && <span className="flex items-center gap-1.5"><Flame size={10} className="text-orange-400" />Hotspots active</span>}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.9)] backdrop-blur-sm overflow-hidden flex flex-col"
            style={{ maxHeight: 600 }}>

            {selectedIssue ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/6 flex items-start justify-between flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: categoryColor(selectedIssue.category) + "20", color: categoryColor(selectedIssue.category) }}>
                        {selectedIssue.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${selectedIssue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                          selectedIssue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>
                        {selectedIssue.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{selectedIssue.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white flex-shrink-0"><X size={15} /></button>
                </div>

                {selectedIssue.image && (
                  <div className="relative overflow-hidden flex-shrink-0" style={{ height: 140 }}>
                    <img src={selectedIssue.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] to-transparent" />
                  </div>
                )}

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedIssue.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={10} /><span>{selectedIssue.location}</span>
                  </div>
                  {selectedIssue.lat && selectedIssue.lng && (
                    <div className="text-[10px] text-slate-600 font-mono">
                      {selectedIssue.lat.toFixed(5)}, {selectedIssue.lng.toFixed(5)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Reported by</div>
                      <div className="text-white font-medium truncate">{selectedIssue.reportedBy || "Anonymous"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Date</div>
                      <div className="text-white font-medium">{selectedIssue.reportedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => handleVote(selectedIssue.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${votedIds.has(selectedIssue.id) ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-white/5 border-white/10 text-slate-300 hover:border-blue-500/30 hover:text-blue-300"}`}>
                      <ArrowUp size={11} /> {selectedIssue.votes} votes
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (mapRef.current && selectedIssue) {
                        const coords = getIssueCoords(selectedIssue);
                        mapRef.current.flyTo(coords, 17, { duration: 1.5 });
                        showToast(`✈️ Flying to ${selectedIssue.title}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-all flex items-center justify-center gap-1.5">
                    <Navigation size={11} /> Fly to location
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-white/6 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-white">Issues</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{filtered.length} results — click to focus</p>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No issues match your filters</div>
                  ) : (
                    filtered.map(issue => (
                      <button key={issue.id} onClick={() => setSelected(issue.id)}
                        className="w-full text-left p-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0 group">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColor(issue.category) }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate group-hover:text-blue-200 transition-colors">{issue.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={8} />{issue.location}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${issue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                                  issue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>
                                {issue.status.replace("_", " ")}
                              </span>
                              {issue.priority === "critical" && <span className="text-[9px] text-red-400 font-bold">CRITICAL</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-500 flex-shrink-0">
                            <ArrowUp size={8} />{issue.votes}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap gap-4 items-center px-2">
          <span className="text-xs text-slate-500 font-medium">Legend:</span>
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor(cat), boxShadow: `0 0 6px ${categoryColor(cat)}80` }} />
              {cat}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full border border-dashed border-orange-400 bg-orange-400/10" />
            Hotspot zone
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            Your location
          </div>
        </motion.div>
      </div>
    </div>
  );
}