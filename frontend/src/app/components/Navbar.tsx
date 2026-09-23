import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Bell, Search, ChevronDown, Zap, LogOut, CheckCheck, Trash2, Radio, Globe } from "lucide-react";
import { useApp } from "../context/AppContext";
import { IssueTrackerModal } from "./IssueTrackerPanel";
import { LANGUAGES, LanguageCode } from "../lib/i18n";

const NAV_LINKS = [
  { labelKey: "nav_dashboard", defaultLabel: "Dashboard", href: "/dashboard" },
  { labelKey: "nav_report", defaultLabel: "Report Issue", href: "/report" },
  { labelKey: "nav_map", defaultLabel: "City Map", href: "/map" },
  { labelKey: "nav_kanban", defaultLabel: "Kanban", href: "/kanban" },
  { labelKey: "nav_admin", defaultLabel: "AI Admin", href: "/admin", isAi: true },
  { labelKey: "nav_employee", defaultLabel: "Field Staff", href: "/employee", isEmployee: true },
  { labelKey: "nav_rewards", defaultLabel: "Rewards", href: "/rewards" },
  { labelKey: "nav_profile", defaultLabel: "Profile", href: "/profile" },
];

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const {
    user, issues, logout, theme, toggleTheme,
    language, setLanguage, t,
    notifications = [], markNotificationAsRead, markAllNotificationsAsRead, clearNotifications
  } = useApp();
  const newIssues = issues.filter((i) => i.status === "new").length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const isBlueSteel = theme === "blue-steel";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    navigate("/");
    logout();
  };

  const avatarSrc = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "U")}&background=1E6BE6&color=fff&size=64`;
  const displayName = user?.name ?? "User";
  const displayPoints = user?.points ?? 0;
  const isAdmin = user?.role === "official" || user?.role === "ward";

  return (
    <>
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(5,8,22,0.92)] backdrop-blur-xl border-b border-blue-500/10 shadow-[0_4px_32px_rgba(59,130,246,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.5)]"
            >
              <Zap size={16} className="text-white fill-white" />
            </motion.div>
            <span className="text-white font-bold text-lg tracking-tight">
              Urban<span className="text-blue-400">Eye</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.filter((link) => {
              const isAdmin = user?.role === "official" || user?.role === "ward";
              const isEmployee = user?.role === "field_employee";
              if ((link as any).isEmployee && !isEmployee) return false;
              if (link.isAi && !isAdmin) return false;
              if (isEmployee && (link.href === "/report" || link.href === "/rewards")) return false;
              if (link.href === "/rewards" && isAdmin) return false;
              return true;
            }).map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? "text-white bg-blue-500/10 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t(link.labelKey)}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Track button — only for logged-in citizens (not admin/employee) */}
            {user && !isAdmin && user.role !== "field_employee" && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setTrackerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/25 bg-blue-500/8 text-xs font-semibold text-blue-300 hover:bg-blue-500/15 hover:text-white transition-all duration-200 shadow-[0_0_10px_rgba(59,130,246,0.12)]"
                title="Live Issue Tracker"
              >
                <Radio size={13} className="animate-pulse" />
                <span className="hidden lg:block">Live Track</span>
              </motion.button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative" data-dropdown>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 hover:text-white transition-all duration-200 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                title="Select Language / भाषा चुनें"
              >
                <Globe size={14} className="text-blue-400" />
                <span className="font-bold">{LANGUAGES.find(l => l.code === language)?.nativeName || "EN"}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-52 bg-[#0b1020] border border-blue-500/20 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] py-1.5 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 border-b border-white/8 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t("select_language")}</span>
                      <span className="text-[10px] text-blue-400 font-normal">10 Languages</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {LANGUAGES.map((langObj) => {
                        const isSelected = language === langObj.code;
                        return (
                          <button
                            key={langObj.code}
                            onClick={() => {
                              setLanguage(langObj.code);
                              setLangOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-blue-500/20 text-blue-300 font-bold border-l-2 border-blue-400"
                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{langObj.flag}</span>
                              <span className="font-medium">{langObj.nativeName}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">{langObj.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 ${
                isBlueSteel
                  ? "bg-slate-800/80 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title={isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
            >
              <span className="text-sm">{isBlueSteel ? "☀️" : "🌊"}</span>
              <span className="hidden lg:block">{isBlueSteel ? "Default" : "Blue Steel"}</span>
            </motion.button>

            <div className="relative" data-dropdown>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Notifications"
              >
                <Bell size={15} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#050816] shadow-sm animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0b1020] border border-blue-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                  >
                    <div className="p-3.5 px-4 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">Citizen Notifications</p>
                          {unreadNotifs > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {unreadNotifs} unread
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Real-time updates & admin team dispatches</p>
                      </div>
                      {unreadNotifs > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline transition-all"
                        >
                          <CheckCheck size={13} />
                          Mark read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell size={28} className="mx-auto mb-2 opacity-30 text-blue-400" />
                          <p className="text-xs font-medium text-slate-300">No notifications yet</p>
                          <p className="text-[11px] text-slate-500 mt-1">Real-time alerts will appear here when teams are dispatched.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.issueId) {
                                navigate("/kanban");
                              }
                            }}
                            className={`flex items-start gap-3 p-3.5 transition-all cursor-pointer ${
                              n.read ? "bg-transparent hover:bg-white/[0.03]" : "bg-blue-500/[0.06] hover:bg-blue-500/[0.1]"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                              {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-semibold ${n.read ? "text-slate-300" : "text-white"}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                                {n.message}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 px-2">{notifications.length} total alerts</span>
                        <button
                          onClick={clearNotifications}
                          className="text-slate-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                          Clear all
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" data-dropdown>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-1 rounded-lg hover:bg-white/5 px-2 py-1 transition-all"
              >
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-500/40 hover:border-blue-400 transition-colors"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-white leading-none">{displayName.split(" ")[0]}</p>
                  {isAdmin ? (
                    <p className="text-[10px] text-purple-400 mt-0.5 font-semibold">🛡️ City Admin</p>
                  ) : (
                    <p className="text-[10px] text-blue-400 mt-0.5">{displayPoints.toLocaleString()} pts</p>
                  )}
                </div>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 hidden lg:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-52 bg-[#0b1020] border border-blue-500/15 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden py-1"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email ?? ""}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">👤</span>
                      View profile
                    </Link>

                    {user?.role !== "official" && user?.role !== "ward" && user?.role !== "field_employee" && (
                      <Link
                        to="/rewards"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="text-base">🏆</span>
                        Rewards
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="text-base">🏛️</span>
                        Command Center
                      </Link>
                    )}
                    {user?.role === "field_employee" && (
                      <Link
                        to="/employee"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="text-base">👷</span>
                        Staff Portal
                      </Link>
                    )}

                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[rgba(5,8,22,0.97)] border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.filter((link) => {
                const isAdmin = user?.role === "official" || user?.role === "ward";
                const isEmployee = user?.role === "field_employee";
                if ((link as any).isEmployee && !isEmployee) return false;
                if (link.isAi && !isAdmin) return false;
                if (isEmployee && (link.href === "/report" || link.href === "/rewards")) return false;
                if (link.href === "/rewards" && isAdmin) return false;
                return true;
              }).map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500/15 text-white border border-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border mt-1"
                style={{
                  background: isBlueSteel ? "#384959" : "rgba(255,255,255,0.05)",
                  color: isBlueSteel ? "#BDDDFC" : "#94a3b8",
                  borderColor: isBlueSteel ? "#6A89A7" : "rgba(255,255,255,0.08)",
                }}
              >
                <span>{isBlueSteel ? "☀️" : "🌊"}</span>
                {isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
              </button>

              {/* Mobile sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-2 border-t border-white/5 pt-3"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    {/* Live Issue Tracker Modal */}
    {trackerOpen && (
      <IssueTrackerModal
        issues={issues}
        userUid={user?.uid}
        onClose={() => setTrackerOpen(false)}
      />
    )}
    </>
  );
}