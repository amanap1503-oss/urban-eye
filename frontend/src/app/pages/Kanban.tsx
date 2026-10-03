import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Plus, Search, Filter, MoreHorizontal, ArrowUp,
  MapPin, Flame, AlertTriangle, Lock
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Issue, CATEGORY_COLOR, PRIORITY_COLOR } from "../data/mockData";

const COLUMNS = [
  { id: "new", label: "New", color: "#64748b", bg: "rgba(100,116,139,0.08)", count_color: "#94a3b8" },
  { id: "in_progress", label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", count_color: "#60a5fa" },
  { id: "resolved", label: "Resolved", color: "#10b981", bg: "rgba(16,185,129,0.08)", count_color: "#34d399" },
] as const;

const ITEM_TYPE = "ISSUE_CARD";

const IssueCard = forwardRef<HTMLDivElement, { issue: Issue; index: number }>(
  function IssueCard({ issue, index }, ref) {
  const { upvoteIssue, approveResolution, user } = useApp();
  const [voted, setVoted] = useState(false);

  // Municipal officers/admins can move any card; a citizen can move their own report.
  const isAdmin = user?.role === "official" || user?.role === "ward";
  const isOwner =
    isAdmin ||
    !user ||
    (!!issue.reportedBy && issue.reportedBy === user.uid) ||
    (!!issue.reportedBy && issue.reportedBy === user.name);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: issue.id },
    canDrag: isOwner,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [issue.id, isOwner]);

  function handleVote(e: React.MouseEvent) {
    e.stopPropagation();
    if (voted) return;
    upvoteIssue(issue.id);
    setVoted(true);
  }

  return (
    <motion.div
      ref={(node) => {
        // Compose the react-dnd connector ref with the forwarded ref so the card
        // is actually registered as a drag source (and still works in a DnD wrapper).
        drag(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: index * 0.05 }}
      className={`group p-4 rounded-xl border bg-[rgba(11,16,32,0.9)] hover:bg-[rgba(15,20,40,0.95)] transition-all ${
        isOwner
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default opacity-85"
      } ${
        isDragging
          ? "shadow-[0_8px_32px_rgba(59,130,246,0.2)] border-blue-500/30 rotate-1"
          : "border-white/8 hover:border-white/15"
      }`}
      style={{ boxShadow: isDragging ? "0 12px 40px rgba(59,130,246,0.25)" : undefined }}
      title={!isOwner ? "Sign in, or sign in as a municipal officer, to move this issue" : undefined}
    >
      {/* Category & Priority */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: CATEGORY_COLOR[issue.category] + "18",
            color: CATEGORY_COLOR[issue.category],
            border: `1px solid ${CATEGORY_COLOR[issue.category]}25`,
          }}
        >
          {issue.category}
        </span>
        {issue.priority === "critical" && (
          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
            <Flame size={9} /> Critical
          </span>
        )}
        {issue.priority === "high" && (
          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20">
            <AlertTriangle size={9} /> High
          </span>
        )}
        {!isOwner && (
          <span className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/5 text-slate-500 border border-white/8">
            <Lock size={8} /> Read Only
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white leading-snug mb-2 group-hover:text-blue-100 transition-colors line-clamp-2">{issue.title}</p>

      {/* Citizen Approval Card Action if Pending Confirmation */}
      {issue.status === "pending_approval" && (
        <div className="mt-3 pt-3 border-t border-purple-500/20 bg-purple-500/5 -mx-4 -mb-4 p-3 rounded-b-xl">
          <div className="text-[11px] font-semibold text-purple-300 mb-1 flex items-center gap-1">
            <span>📸</span> Final Photo Uploaded — Citizen Confirmation Required
          </div>
          {issue.resolutionProof && (
            <div className="flex items-center gap-2 mb-2">
              <img src={issue.resolutionProof.imageUrl} alt="Proof" className="w-12 h-10 rounded object-cover border border-purple-500/30" />
              <div className="text-[10px] text-slate-400">
                Resolved by {issue.resolutionProof.resolvedBy}
              </div>
            </div>
          )}
          {user?.role === "citizen" || user?.uid === issue.reportedBy ? (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  approveResolution(issue.id, true);
                }}
                className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all"
              >
                ✓ Approve & Mark Resolved
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  approveResolution(issue.id, false);
                }}
                className="py-1 px-2 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[11px] font-semibold transition-all"
              >
                ✕ Reject
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic mt-1">
              Awaiting confirmation from citizen reporter ({issue.reportedBy || "Citizen"}). Admins cannot override final photo approval.
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-3">
        <MapPin size={10} />
        <span className="truncate">{issue.location}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono" style={{ color: PRIORITY_COLOR[issue.priority] + "cc" }}>#{issue.id}</span>
          <span>·</span>
          <span>{issue.reportedAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVote}
            className={`flex items-center gap-1 text-[11px] font-medium transition-all ${
              voted ? "text-blue-400" : "text-slate-500 hover:text-blue-400"
            }`}
          >
            <ArrowUp size={10} className={voted ? "text-blue-400" : ""} />
            {issue.votes}
          </button>
          <button className="text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

function Column({
  col,
  issues,
  onDrop,
}: {
  col: typeof COLUMNS[number];
  issues: Issue[];
  onDrop: (id: string, status: Issue["status"]) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => onDrop(item.id, col.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div
      ref={drop as any}
      className={`flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOver ? "border-blue-500/40 shadow-[0_0_24px_rgba(59,130,246,0.15)]" : "border-white/8"
      }`}
      style={{ background: isOver ? "rgba(59,130,246,0.04)" : col.bg }}
    >
      {/* Column header */}
      <div className="px-4 py-3.5 border-b border-white/6 flex items-center justify-between sticky top-0 backdrop-blur-sm" style={{ background: col.bg }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color, boxShadow: `0 0 8px ${col.color}` }} />
          <span className="text-sm font-semibold text-white">{col.label}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center"
            style={{ backgroundColor: col.color + "20", color: col.count_color }}
          >
            {issues.length}
          </span>
        </div>
        <button className="w-7 h-7 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[200px]" style={{ maxHeight: "calc(100vh - 300px)" }}>
        <AnimatePresence mode="popLayout">
          {issues.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div
                className="w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center mb-3"
                style={{ borderColor: col.color + "30" }}
              >
                <Plus size={16} style={{ color: col.color + "60" }} />
              </div>
              <p className="text-xs text-slate-500">Drop issues here</p>
            </motion.div>
          ) : (
            issues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Kanban() {
  const { issues, updateIssueStatus } = useApp();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");

  function handleDrop(id: string, status: Issue["status"]) {
    updateIssueStatus(id, status);
  }

  const filtered = issues.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
    return true;
  });

  const normalizeStatus = (status: string): Issue["status"] => {
    const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
    if (s === "reported" || s === "new") return "new";
    if (s === "in_progress" || s === "inprogress" || s === "pending_approval") return "in_progress";
    if (s === "resolved") return "resolved";
    return "new";
  };

  const byStatus = (columnStatus: Issue["status"]) =>
    filtered.filter(i => normalizeStatus(i.status) === columnStatus);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#050816] text-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between mb-6 gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Issue Board</h1>
              <p className="text-slate-400 text-sm mt-1">Drag a card into another column to update its status</p>
            </div>
          </motion.div>

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter issues..."
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-48"
              />
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {(["all", "critical", "high", "medium", "low"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    priorityFilter === p ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <Filter size={12} />
              Showing {filtered.length} of {issues.length} issues
            </div>
          </motion.div>

          {/* Columns */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4"
          >
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                col={col}
                issues={byStatus(col.id)}
                onDrop={handleDrop}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </DndProvider>
  );
}