import React, { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { ThreeCity } from "../components/ThreeCity";
import { ThreeGlobe } from "../components/ThreeGlobe";
import { AreaChartComponent, CivicHealthGauge } from "../components/Charts";
import ScrollExpandMedia from "../../components/ui/scroll-expansion-hero";
import {
  PlusCircle,
  MapPin,
  LayoutDashboard,
  ChevronRight,
  Sliders,
  ArrowUp,
  AlertCircle,
  MessageSquare,
  CornerDownRight,
  CheckCircle2,
  Twitter,
  Flag,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Issue } from "../data/mockData";

// ── False Report Modal ────────────────────────────────────────────────────────
interface FlagModalProps {
  issue: Issue;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const FLAG_REASONS = [
  "Duplicate report",
  "Fake / fabricated issue",
  "Incorrect location",
  "Already resolved",
  "Spam or irrelevant",
  "Other",
];

const FlagModal: React.FC<FlagModalProps> = ({ issue, onClose, onSubmit }) => {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const reason = selected === "Other" ? custom : selected;
    if (!reason.trim()) return;
    onSubmit(reason);
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold">Report submitted</p>
            <p className="text-xs text-slate-400 mt-1">Our team will review this issue.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-400" /> Flag as False Report
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{issue.title}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {FLAG_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${selected === r
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                      : "bg-white/5 border-white/5 text-slate-300 hover:border-white/15"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {selected === "Other" && (
              <textarea
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                className="w-full mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!selected || (selected === "Other" && !custom.trim())}
              className="w-full py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Submit Flag
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
interface DeleteModalProps {
  issue: Issue;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ issue, onClose, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" /> Delete Report
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{issue.title}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5">
        <p className="text-xs text-rose-300 leading-relaxed">
          This will permanently delete the report. This action cannot be undone.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-all flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete &amp; lose 50pts
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Issue Card ────────────────────────────────────────────────────────────────
interface IssueCardProps {
  issue: Issue;
}

const LocalIssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const { upvoteIssue, updateIssueStatus, approveResolution, reportFakeIssue, deleteIssue, user } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<string[]>([
    "Agreed, I drove past this yesterday and had to brake hard.",
    "Assigned to district maintenance crew, resolving soon.",
  ]);
  const [voted, setVoted] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flagged, setFlagged] = useState(false);

  // The reportedBy field stores the poster's uid (set in AppContext.addIssue).
  const isOwner = !!user && user.uid === (issue as any).reportedBy;
  const canFlag = !!user && !isOwner && !flagged;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments(prev => [...prev, commentText]);
    setCommentText("");
  };

  const handleUpvote = () => {
    if (voted) return;
    upvoteIssue(issue.id);
    setVoted(true);
  };

  const handleFlag = async (reason: string) => {
    await reportFakeIssue(issue.id, reason);
    setFlagged(true);
  };

  const handleDelete = async () => {
    await deleteIssue(issue.id);
    setShowDeleteModal(false);
  };

  const handleTweet = () => {
    const text = `🚨 ${issue.title} — reported via Urban Eye at ${issue.location}. #UrbanEye #CivicTech #${issue.category.replace(/\s+/g, "")}`;
    const shareUrl = window.location.origin + window.location.pathname;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "medium": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "low": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-pink-500/20 text-pink-300";
      case "in_progress": return "bg-cyan-500/20 text-cyan-300";
      case "resolved": return "bg-emerald-500/20 text-emerald-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <>
      <AnimatePresence>
        {showFlagModal && (
          <FlagModal
            issue={issue}
            onClose={() => setShowFlagModal(false)}
            onSubmit={handleFlag}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            issue={issue}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40 hover:bg-slate-900/40 transition-all duration-300 shadow-xl group"
      >
        {/* Top Banner Image */}
        {issue.image ? (
          <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
            <img
              src={issue.image}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${getPriorityColor(issue.priority)} bg-slate-950/85 backdrop-blur-md`}>
                {issue.priority}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${getStatusColor(issue.status)} bg-slate-950/85 backdrop-blur-md`}>
                {issue.status.replace("_", " ")}
              </span>
            </div>
            <span className="absolute bottom-4 right-4 text-[10px] bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg font-mono text-slate-300 flex items-center gap-1 border border-white/5 truncate max-w-[150px]">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {issue.location}
            </span>
            {/* Delete button — owner only, overlaid on image corner */}
            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete your report"
                className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all border border-rose-500/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* No image — compact badge + delete row */
          <div className="px-5 pt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${getStatusColor(issue.status)}`}>
                {issue.status.replace("_", " ")}
              </span>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete your report"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Card Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>{issue.category}</span>
              <span>{issue.reportedAt}</span>
            </div>
            <h3
              className="font-sans font-bold text-base text-white group-hover:text-cyan-300 transition-colors cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {issue.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{issue.description}</p>
            {issue.yoloDetections && issue.yoloDetections.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {issue.yoloDetections.map((det, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm"
                  >
                    <span>🤖 {det.class}</span>
                    <span className="opacity-60">{Math.round(det.confidence * 100)}%</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-bold text-slate-500 pt-1">
            <div className="space-y-1">
              <div className={`h-1 rounded-full ${["new", "in_progress", "resolved"].includes(issue.status) ? "bg-pink-400" : "bg-white/5"}`} />
              <span className={issue.status === "new" ? "text-pink-400" : "text-slate-400"}>INTENDED</span>
            </div>
            <div className="space-y-1">
              <div className={`h-1 rounded-full ${["in_progress", "resolved"].includes(issue.status) ? "bg-cyan-400" : "bg-white/5"}`} />
              <span className={issue.status === "in_progress" ? "text-cyan-400" : "text-slate-400"}>MAPPED</span>
            </div>
            <div className="space-y-1">
              <div className={`h-1 rounded-full ${issue.status === "resolved" ? "bg-emerald-400" : "bg-white/5"}`} />
              <span className={issue.status === "resolved" ? "text-emerald-400" : "text-slate-400"}>RESOLVED</span>
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-1 flex-wrap">
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${voted
                  ? "bg-cyan-500/10 border-cyan-400 text-cyan-300"
                  : "bg-white/5 border-white/5 text-slate-300 hover:border-white/10"
                }`}
            >
              <ArrowUp className={`w-3.5 h-3.5 ${voted ? "animate-bounce text-cyan-300" : ""}`} />
              <span>{issue.votes + (voted ? 1 : 0)} Upvotes</span>
            </button>

            {/* Comments toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-mono text-slate-400 hover:text-white transition-all flex items-center gap-1.5 px-2 py-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{comments.length} Comments</span>
            </button>

            {/* Tweet */}
            <button
              onClick={handleTweet}
              title="Share on X (Twitter)"
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5 bg-white/5 text-slate-300 hover:border-sky-400/40 hover:text-sky-300 hover:bg-sky-500/10 active:scale-95"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tweet</span>
            </button>

            {/* Flag — visible to logged-in non-owners who haven't flagged yet */}
            {canFlag && (
              <button
                onClick={() => setShowFlagModal(true)}
                title="Flag as false report"
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5 bg-white/5 text-slate-300 hover:border-rose-400/40 hover:text-rose-300 hover:bg-rose-500/10 active:scale-95"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
            {flagged && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20">
                Flagged
              </span>
            )}
          </div>

          {/* Expanded Comments Panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-3 border-t border-white/5"
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">DIAGNOSTIC TELEMETRY</div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs space-y-1.5">
                  <p className="text-slate-400 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Physical Address:</strong> {issue.location}</span>
                  </p>
                  <p className="text-slate-400">
                    <strong>Coordinates:</strong> {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
                  </p>
                  {issue.status === "pending_approval" && (
                    <div className="p-3.5 bg-purple-500/10 rounded-xl border border-purple-500/25 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                        <span>📸</span> Field Officer Uploaded Final Resolution Proof
                      </div>
                      {issue.resolutionProof && (
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-purple-500/20">
                          <img src={issue.resolutionProof.imageUrl} alt="Final Proof" className="w-16 h-12 rounded object-cover" />
                          <div className="text-[11px] text-slate-300">
                            <div><strong className="text-purple-300">Resolved by:</strong> {issue.resolutionProof.resolvedBy}</div>
                            <div className="text-[10px] text-slate-400">📍 {issue.resolutionProof.locationName}</div>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Please confirm if the problem on site has been completely solved to your satisfaction.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => approveResolution(issue.id, true)}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                        >
                          ✓ Confirm & Move to Resolved
                        </button>
                        <button
                          onClick={() => approveResolution(issue.id, false)}
                          className="py-2 px-3 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-xs font-bold transition-all"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}</div>

                {issue.status !== "resolved" && (
                  <button
                    onClick={() => updateIssueStatus(issue.id, "resolved")}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Resolved (Moderator action)
                  </button>
                )}

                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none">
                  {comments.map((comment, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300">
                        <strong className="text-slate-400 font-mono">Resident:</strong> {comment}
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or offer assistance..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-600 transition-all active:scale-95"
                  >
                    Post
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { issues, user, loading } = useApp();
  const [feedCategory, setFeedCategory] = useState<string>("All");
  const [feedStatus, setFeedStatus] = useState<string>("All");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  const activeReportsCount = issues.filter(r => r.status !== "resolved").length;
  const resolvedReportsCount = issues.filter(r => r.status === "resolved").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Loading Urban Eye...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#050816] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300 font-sans"
    >
      <div className="fixed top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-950/20 via-cyan-950/5 to-transparent pointer-events-none z-0" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "40px 40px" }}
      />

      <main className="flex-1 relative z-10 w-full">
        {/* Full-Page Interactive Scroll Expansion Hero & Content Wrapper */}
        <ScrollExpandMedia
          mediaType="video"
          mediaSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1"
          posterSrc="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1280&auto=format&fit=crop"
          bgImageSrc="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=80"
          title="Building Smarter Cities"
          date="Urban Eye Intelligence"
          scrollToExpand="Scroll down to expand Dashboard"
          textBlend
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-32 space-y-12 w-full">
            {/* Hero Card */}
            <div className="relative min-h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 backdrop-blur-3xl flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 gap-8 shadow-2xl">
              <div className="max-w-xl space-y-6 relative z-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="font-mono text-[9px] font-bold text-cyan-300 uppercase tracking-widest">SYSTEM ONLINE: DISTRICT SECTOR-12</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white leading-tight font-sans">
                  Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">Smarter Cities</span> Together
                </h1>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Report civic issues. Track real-time progress. Transform community zones through direct collaborative governance metrics and gamified milestones.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                  <Link
                    to="/report"
                    className="magnetic-button w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Report Issue
                  </Link>
                  <button
                    onClick={() => document.getElementById("charts-command-center")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4.5 h-4.5 text-slate-400" /> Explore Dashboard
                  </button>
                </div>
              </div>
              <div
                className="w-full lg:w-[480px] h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#030510]/50 relative flex items-center justify-center"
                style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }}
              >
                <ThreeCity />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Active Reports", val: activeReportsCount, tag: "NEEDS REPAIR", color: "text-pink-400" },
                { title: "Resolved Sockets", val: resolvedReportsCount, tag: "COMPLETED", color: "text-emerald-400" },
                { title: "Citizen Trust Score", val: "98.2%", tag: "EXCELLENT", color: "text-cyan-400" },
                { title: "Community Points", val: user?.points ?? 0, tag: "REDEEMABLE", color: "text-violet-400" },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">{stat.title}</span>
                    <div className="text-3xl font-display font-extrabold text-white tracking-tighter mt-1">{stat.val}</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${stat.color} uppercase tracking-widest block mt-2`}>● {stat.tag}</span>
                </div>
              ))}
            </div>

            {/* Globe bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-between overflow-hidden min-h-[460px]">
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                    <h3 className="font-bold text-base text-white">Civic Intelligence Globe</h3>
                  </div>
                  <p className="text-xs text-slate-400">Live hot-spot detection across transatlantic and Indian municipal cells. Spin and drag to load telemetry.</p>
                </div>
                <div className="flex-1 h-[340px] w-full relative z-0">
                  <ThreeGlobe />
                </div>
              </div>

              <div className="lg:col-span-1 glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">Live Operations Stream</h3>
                  <p className="text-xs text-slate-400">Real-time telemetry reports broadcasted by neighborhood watch units</p>
                </div>
                <div className="space-y-3.5 my-4 overflow-y-auto max-h-[260px] scrollbar-none pr-1 pt-1">
                  {issues.slice(0, 4).map(rep => (
                    <div key={rep.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex gap-3 items-start hover:border-white/10 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-slate-300 text-xs">
                        {rep.category === "Infrastructure" ? "🏢" : rep.category === "Safety" ? "🛡️" : rep.category === "Environment" ? "🌱" : rep.category === "Utilities" ? "💡" : rep.category === "Traffic" ? "🚦" : "🏛️"}
                      </div>
                      <div className="text-left text-xs space-y-0.5">
                        <strong className="text-slate-200 block text-sm leading-snug line-clamp-1">{rep.title}</strong>
                        <span className="text-[10px] text-slate-400 block">{rep.location} • {rep.reportedAt}</span>
                        <span className={`text-[9px] font-mono font-bold uppercase ${rep.status === "new" ? "text-pink-400" : rep.status === "in_progress" ? "text-cyan-400" : "text-emerald-400"}`}>
                          ● {rep.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => document.getElementById("community-feed-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
                >
                  View Community Feed <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Charts */}
            <div id="charts-command-center" className="space-y-6 pt-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" /> District Diagnostics Room
                </h3>
                <p className="text-xs text-slate-400">Visual analytical logs representing municipal load balancing</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AreaChartComponent />
                <CivicHealthGauge />
              </div>
            </div>

            {/* Community Feed */}
            <div id="community-feed-section" className="space-y-6 pt-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Community Broadcast Feed</h2>
                  <p className="text-xs text-slate-400">Verified resident complaints, priority indexes, and ongoing civic resolutions.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-400 font-mono">Category:</span>
                  <select
                    value={feedCategory}
                    onChange={e => setFeedCategory(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="All">All Categories</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Safety">Safety</option>
                    <option value="Environment">Environment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Public Spaces">Public Spaces</option>
                  </select>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs text-slate-400 font-mono">Status:</span>
                  <select
                    value={feedStatus}
                    onChange={e => setFeedStatus(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="All">All Statuses</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {issues
                  .filter(rep => {
                    const matchesCategory = feedCategory === "All" || rep.category === feedCategory;
                    const matchesStatus = feedStatus === "All" || rep.status === feedStatus;
                    return matchesCategory && matchesStatus;
                  })
                  .map(rep => (
                    <LocalIssueCard key={rep.id} issue={rep} />
                  ))}
              </div>
            </div>
          </div>
        </ScrollExpandMedia>
      </main>
    </div>
  );
}