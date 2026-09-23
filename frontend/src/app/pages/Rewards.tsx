import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { Zap, TrendingUp, Award, Users, Lock, Gift, Copy, Check, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LEADERBOARD, ACTIVITY_LOG } from "../data/mockData";
import canvasConfetti from "canvas-confetti";

const DEFAULT_BADGES = [
  { id: "b1", name: "First Report", description: "Submitted your first civic issue", icon: "🏙️", unlocked: false, progress: 0, total: 1 },
  { id: "b2", name: "Community Voice", description: "Reported 10+ issues", icon: "📢", unlocked: false, progress: 0, total: 10 },
  { id: "b3", name: "Problem Solver", description: "Had 25 issues resolved", icon: "✅", unlocked: false, progress: 0, total: 25 },
  { id: "b4", name: "Neighborhood Hero", description: "Earned 5000 civic points", icon: "🦸", unlocked: false, progress: 0, total: 5000 },
  { id: "b5", name: "Trend Setter", description: "Get 100 upvotes on a single issue", icon: "🔥", unlocked: false, progress: 0, total: 100 },
  { id: "b6", name: "City Architect", description: "Report 100 issues", icon: "🏛️", unlocked: false, progress: 0, total: 100 },
];

// Brand vouchers that civic points can be redeemed for. "cost" is in civic points.
const REDEEM_BRANDS = [
  { id: "r1", brand: "Zomato", offer: "₹150 off on orders above ₹299", cost: 200, color: "#e23744", logo: "🍔" },
  { id: "r2", brand: "Lenskart", offer: "20% off eyewear & lenses", cost: 1000, color: "#2bb673", logo: "🕶️" },
  { id: "r3", brand: "Swiggy", offer: "₹125 off on your next order", cost: 5000, color: "#fc8019", logo: "🛵" },
  { id: "r4", brand: "Amazon", offer: "₹100 Amazon Pay gift voucher", cost: 1000, color: "#ff9900", logo: "📦" },
  { id: "r5", brand: "BookMyShow", offer: "Buy 1 Get 1 movie ticket", cost: 900, color: "#c4242b", logo: "🎬" },
  { id: "r6", brand: "Myntra", offer: "₹200 off fashion & apparel", cost: 1100, color: "#ff3e6c", logo: "👕" },
  { id: "r7", brand: "Starbucks", offer: "Free tall beverage", cost: 600, color: "#00704a", logo: "☕" },
  { id: "r8", brand: "Uber", offer: "₹100 ride credit", cost: 700, color: "#000000", logo: "🚗" },
];

function ProgressRing({ progress, size = 80, stroke = 6, color = "#3b82f6" }: { progress: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setCurrentProgress(progress), 200);
    return () => clearTimeout(timer);
  }, [inView, progress]);

  const animatedOffset = circumference - (currentProgress / 100) * circumference;

  return (
    <svg ref={ref} width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={animatedOffset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
      />
    </svg>
  );
}

function BadgeCard({ badge }: { badge: any }) {
  return (
    <motion.div
      whileHover={badge.unlocked ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`relative p-4 rounded-2xl border transition-all duration-300 ${badge.unlocked
          ? "border-white/12 bg-[rgba(11,16,32,0.8)] hover:border-blue-500/25"
          : "border-white/5 bg-[rgba(5,8,22,0.5)] opacity-60"
        }`}
    >
      {!badge.unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[rgba(5,8,22,0.5)] backdrop-blur-[2px] z-10">
          <Lock size={16} className="text-slate-500" />
        </div>
      )}
      <div className="flex flex-col items-center text-center gap-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${badge.unlocked ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10" : "bg-white/5 border border-white/5"
          }`}>
          {badge.icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{badge.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{badge.description}</p>
        </div>
        {!badge.unlocked && (
          <div className="w-full">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Progress</span>
              <span>{badge.progress}/{badge.total}</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                initial={{ width: 0 }}
                whileInView={{ width: `${(badge.progress / badge.total) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const RANK_TIERS = [
  { name: "Newcomer", minPoints: 0, maxPoints: 500, color: "#64748b", icon: "🌱" },
  { name: "Issue Tracker", minPoints: 500, maxPoints: 2000, color: "#f59e0b", icon: "🔍" },
  { name: "Community Star", minPoints: 2000, maxPoints: 4000, color: "#06b6d4", icon: "⭐" },
  { name: "City Champion", minPoints: 4000, maxPoints: 6000, color: "#3b82f6", icon: "🏆" },
  { name: "Civic Pioneer", minPoints: 6000, maxPoints: 8000, color: "#8b5cf6", icon: "🚀" },
  { name: "City Guardian", minPoints: 8000, maxPoints: 10000, color: "#ec4899", icon: "🛡️" },
];

function RedeemCard({
  brand, onRedeem, disabled
}: {
  brand: typeof REDEEM_BRANDS[number];
  onRedeem: (brand: typeof REDEEM_BRANDS[number]) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      whileHover={!disabled ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`p-4 rounded-2xl border bg-[rgba(11,16,32,0.8)] transition-all duration-300 ${disabled ? "border-white/5 opacity-50" : "border-white/12 hover:border-blue-500/25"
        }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${brand.color}22`, border: `1px solid ${brand.color}44` }}
        >
          {brand.logo}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{brand.brand}</p>
          <p className="text-[10px] text-slate-400 leading-snug">{brand.offer}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-violet-300 flex items-center gap-1">
          <Zap size={11} /> {brand.cost.toLocaleString()} pts
        </span>
        <button
          onClick={() => onRedeem(brand)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all active:scale-95"
        >
          Redeem
        </button>
      </div>
    </motion.div>
  );
}

function RedeemModal({
  brand, code, error, onClose
}: {
  brand: typeof REDEEM_BRANDS[number] | null;
  code: string | null;
  error: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!brand) return null;

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1020] p-6 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X size={16} />
          </button>

          {error ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">⚠️</p>
              <p className="text-white font-semibold mb-1">Couldn't redeem</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-3xl mb-3">{brand.logo}</p>
              <p className="text-white font-semibold mb-1">{brand.brand} Voucher Unlocked!</p>
              <p className="text-sm text-slate-400 mb-4">{brand.offer}</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-dashed border-white/15">
                <span className="flex-1 font-mono text-sm text-emerald-300 tracking-wider">{code}</span>
                <button onClick={handleCopy} className="text-slate-300 hover:text-white">
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-3">Apply this code at checkout on the {brand.brand} app or website.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


export default function Rewards() {
  const { user, redeemReward, issues } = useApp();
  const confettiRef = useRef(false);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const [redeemTarget, setRedeemTarget] = useState<typeof REDEEM_BRANDS[number] | null>(null);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  async function handleRedeem(brand: typeof REDEEM_BRANDS[number]) {
    setRedeemTarget(brand);
    setRedeemCode(null);
    setRedeemError(null);
    try {
      const code = await redeemReward(brand.cost);
      setRedeemCode(code);
      canvasConfetti({ particleCount: 50, spread: 60, origin: { y: 0.4 }, colors: ["#3b82f6", "#10b981"] });
    } catch (err: any) {
      setRedeemError(err?.message || "Something went wrong. Please try again.");
    }
  }

  if (!user) return null;

  // Count issues actually created by this user from live issue list
  const myIssues = issues.filter(i =>
    i.reportedBy === user.uid ||
    i.reportedBy === user.name ||
    (i as any).reporterId === user.uid ||
    (i as any).reporterName === user.name
  );
  const reportedCount = Math.max(myIssues.length, user.reportsFiled ?? 0);
  const resolvedCount = Math.max(
    myIssues.filter(i => i.status === "resolved").length,
    user.reportsResolved ?? 0
  );
  const maxUpvote = myIssues.reduce((max, i) => Math.max(max, i.votes ?? 0), 0);

  // Compute badge progress from real user data
  const badges = DEFAULT_BADGES.map(b => {
    let progress = b.progress;
    let unlocked = b.unlocked;
    if (b.id === "b1") { progress = Math.min(reportedCount, 1); unlocked = reportedCount >= 1; }
    if (b.id === "b2") { progress = Math.min(reportedCount, 10); unlocked = reportedCount >= 10; }
    if (b.id === "b3") { progress = Math.min(resolvedCount, 25); unlocked = resolvedCount >= 25; }
    if (b.id === "b4") { progress = Math.min(user.points, 5000); unlocked = user.points >= 5000; }
    if (b.id === "b5") { progress = Math.min(maxUpvote, 100); unlocked = maxUpvote >= 100; }
    if (b.id === "b6") { progress = Math.min(reportedCount, 100); unlocked = reportedCount >= 100; }
    return { ...b, progress, unlocked };
  });

  const currentTier = RANK_TIERS.find(t => user.points >= t.minPoints && user.points < t.maxPoints) ?? RANK_TIERS[0];
  const nextTier = RANK_TIERS[RANK_TIERS.indexOf(currentTier) + 1];
  const tierProgress = ((user.points - currentTier.minPoints) / (currentTier.maxPoints - currentTier.minPoints)) * 100;

  useEffect(() => {
    if (heroInView && !confettiRef.current) {
      confettiRef.current = true;
      setTimeout(() => {
        canvasConfetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.3, x: 0.5 },
          colors: ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981"],
          startVelocity: 25,
          gravity: 0.8,
          scalar: 0.8,
        });
      }, 600);
    }
  }, [heroInView]);

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Rewards Center</h1>
          <p className="text-slate-400 text-sm mt-1">Earn points and climb the civic leaderboard</p>
        </motion.div>

        {/* Hero Stats Card */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-blue-500/20 overflow-hidden mb-8 p-6"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08), rgba(6,182,212,0.06))" }}
        >
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.1) 0%, transparent 60%)"
          }} />

          <div className="relative grid md:grid-cols-3 gap-6 items-center">
            {/* Points & Rank */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <ProgressRing progress={tierProgress} size={96} stroke={7} color={currentTier.color} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl">{currentTier.icon}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide">Current Rank</p>
                <p className="text-xl font-bold" style={{ color: currentTier.color }}>{currentTier.name}</p>
                <p className="text-3xl font-black text-white mt-1 tabular-nums">{user.points.toLocaleString()}</p>
                <p className="text-xs text-slate-400">civic points</p>
              </div>
            </div>

            {/* Progress to next tier */}
            <div>
              {nextTier && (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300 font-medium">Progress to {nextTier.name}</span>
                    <span className="font-mono text-xs" style={{ color: nextTier.color }}>
                      {(nextTier.minPoints - user.points).toLocaleString()} pts needed
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${tierProgress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{Math.round(tierProgress)}% complete</p>
                </>
              )}
              {!nextTier && (
                <div className="text-center">
                  <p className="text-emerald-400 font-semibold">🎉 Maximum rank achieved!</p>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Issues Reported", value: reportedCount, icon: "📍", color: "#3b82f6" },
                { label: "Issues Resolved", value: resolvedCount, icon: "✅", color: "#10b981" },
                { label: "Badges Earned", value: badges.filter(b => b.unlocked).length, icon: "🏅", color: "#f59e0b" },
                { label: "Civic Level", value: `Lv.${user.level ?? 1}`, icon: "⭐", color: "#8b5cf6" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main left column (Badges, Redeem, Activity) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  Achievement Badges
                </h2>
                <span className="text-xs text-slate-400">
                  {badges.filter(b => b.unlocked).length}/{badges.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </motion.div>

            {/* Redeem Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Gift size={18} className="text-pink-400" />
                  Redeem Your Points
                </h2>
                <span className="text-xs text-slate-400">Convert civic points into real brand vouchers</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {REDEEM_BRANDS.map((brand) => (
                  <RedeemCard
                    key={brand.id}
                    brand={brand}
                    onRedeem={handleRedeem}
                    disabled={user.points < brand.cost}
                  />
                ))}
              </div>
            </motion.div>

            {/* Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-white/6">
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              </div>
              <div className="divide-y divide-white/4">
                {ACTIVITY_LOG.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-base flex-shrink-0">
                      {entry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{entry.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{entry.date}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">+{entry.points}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Rank tiers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm p-4"
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400" />
                Rank Tiers
              </h3>
              <div className="space-y-2">
                {RANK_TIERS.map((tier, i) => {
                  const isCurrentTier = tier.name === currentTier.name;
                  const isPast = i < RANK_TIERS.indexOf(currentTier);
                  return (
                    <div
                      key={tier.name}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isCurrentTier ? "bg-white/8 border border-white/12" : "opacity-50"
                        }`}
                    >
                      <span className="text-lg">{tier.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{tier.name}</p>
                        <p className="text-[10px] text-slate-500">{tier.minPoints.toLocaleString()}–{tier.maxPoints.toLocaleString()} pts</p>
                      </div>
                      {isPast && <span className="text-emerald-400 text-[10px] font-bold">✓</span>}
                      {isCurrentTier && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">YOU</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-white/6">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={14} className="text-purple-400" />
                  City Leaderboard
                </h3>
              </div>
              {LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-white/4 last:border-0 transition-colors ${entry.name === user.name ? "bg-blue-500/8" : "hover:bg-white/3"
                    }`}
                >
                  <div className={`w-6 text-center text-xs font-bold ${entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : entry.rank === 3 ? "text-amber-600" : "text-slate-500"
                    }`}>
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </div>
                  <img src={entry.avatar} alt={entry.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${entry.name === user.name ? "text-blue-300" : "text-white"}`}>{entry.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{entry.badge}</p>
                  </div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: "#3b82f6" }}>
                    {entry.points.toLocaleString()}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Points Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm p-4"
            >
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                Earn More Points
              </h3>
              <div className="space-y-2">
                {[
                  { action: "Report an issue", points: "+50", icon: "📍" },
                  { action: "Issue gets resolved", points: "+100", icon: "✅" },
                  { action: "Add photo evidence", points: "+25", icon: "📸" },
                  { action: "Issue gets 10 upvotes", points: "+30", icon: "⬆️" },
                  { action: "Leave a comment", points: "+10", icon: "💬" },
                  { action: "Unlock a badge", points: "+200", icon: "🏆" },
                ].map((item) => (
                  <div key={item.action} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span>{item.icon}</span>
                      <span>{item.action}</span>
                    </div>
                    <span className="font-bold text-emerald-400">{item.points}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <RedeemModal
        brand={redeemTarget}
        code={redeemCode}
        error={redeemError}
        onClose={() => setRedeemTarget(null)}
      />
    </div>
  );
}