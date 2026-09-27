import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../lib/firebase";
import { getOrCreateUserProfile, UserProfile, updateUserProfile } from "../lib/userService";
import { logActivity, subscribeToActivities, UserActivity } from "../lib/activityService";
import { Issue, ISSUES, INITIAL_CITY_ROSTERS } from "../data/mockData";
import { CityRosterOfficer } from "../lib/aiAnalyzerService";
import { apiClient, API_BASE } from "../lib/apiClient";
import { realtimeWS } from "../lib/wsClient";
import { LanguageCode, getTranslation } from "../lib/i18n";

type ThemeName = "default" | "blue-steel";

export interface AppNotification {
  id: string;
  type: "team_assigned" | "status_change" | "upvote" | "critical_issue" | "issue_reported";
  title: string;
  message: string;
  icon: string;
  issueId?: string;
  createdAt: string;
  read: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  issues: Issue[];
  activities: UserActivity[];
  notifications: AppNotification[];
  theme: ThemeName;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  roster: CityRosterOfficer[];
  toggleTheme: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (adminId: string) => void;
  loginAsEmployee: (employeeId: string, name?: string) => void;
  submitSiteArrivalProof: (issueId: string, proof: { imageUrl: string; lat: number; lng: number; locationName?: string }) => Promise<void>;
  submitResolutionProof: (issueId: string, proof: { imageUrl: string; lat: number; lng: number; locationName?: string }) => Promise<void>;
  approveResolution: (issueId: string, approved: boolean) => Promise<void>;
  addIssue: (issue: Omit<Issue, "id">, imageFile?: File | null) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  upvoteIssue: (id: string) => Promise<void>;
  updateIssueStatus: (id: string, status: Issue["status"]) => Promise<void>;
  reportFakeIssue: (id: string, reason: string) => Promise<void>;
  updateProfile: (data: { name?: string; photoURL?: string }) => Promise<void>;
  redeemReward: (cost: number) => Promise<string>;
  assignTeamToIssue: (issueId: string, teamName: string, officerNames: string[], slaHours?: number) => void;
  updateOfficerStatus: (officerId: string, status: "on_shift" | "off_duty" | "on_leave") => void;
  addOfficer: (officer: Omit<CityRosterOfficer, "id" | "activeAssignments">) => void;
  updateOfficer: (officerId: string, data: Partial<CityRosterOfficer>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [issues, setIssues] = useState<Issue[]>(ISSUES);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Mumbai");
  const [roster, setRoster] = useState<CityRosterOfficer[]>(INITIAL_CITY_ROSTERS);

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    return (window.localStorage.getItem("urbanEyeLanguage") as LanguageCode) || "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("urbanEyeLanguage", lang);
    }
  };

  const t = (key: string) => getTranslation(language, key);
  // User-specific notification key in localStorage
  const notifStorageKey = user?.uid ? `urbanEyeNotifications_${user.uid}` : "urbanEyeNotifications_guest";

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
    try {
      const saved = window.localStorage.getItem("urbanEyeNotifications_guest");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Reload notifications when active user changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(notifStorageKey);
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch {
      setNotifications([]);
    }
  }, [user?.uid]);

  // Persist notifications under user-specific key
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(notifStorageKey, JSON.stringify(notifications));
    } catch {}
  }, [notifications, notifStorageKey]);

  function markNotificationAsRead(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllNotificationsAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "default";
    const saved = window.localStorage.getItem("urbanEyeTheme");
    return saved === "blue-steel" ? "blue-steel" : "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "blue-steel") {
      root.classList.add("theme-blue-steel");
    } else {
      root.classList.remove("theme-blue-steel");
    }
    try {
      window.localStorage.setItem("urbanEyeTheme", theme);
    } catch {}
  }, [theme]);

  function toggleTheme() {
    setTheme(t => (t === "blue-steel" ? "default" : "blue-steel"));
  }

  // Handle Auth initialization
  useEffect(() => {
    try {
      const savedAdmin = window.sessionStorage.getItem("urbanEyeAdminUser");
      if (savedAdmin) {
        setUser(JSON.parse(savedAdmin));
        setLoading(false);
        return;
      }
    } catch {}

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        const savedAdmin = window.sessionStorage.getItem("urbanEyeAdminUser");
        if (savedAdmin) {
          setUser(JSON.parse(savedAdmin));
          setLoading(false);
          return;
        }

        if (fbUser) {
          setFirebaseUser(fbUser);
          const profile = await getOrCreateUserProfile(fbUser);
          setUser(profile);

          // Register user in Python PostgreSQL backend and sync points
          try {
            const dbRes = await apiClient.post("/auth/register", {
              uid: fbUser.uid,
              name: fbUser.displayName || "Citizen",
              email: fbUser.email,
              city: "Mumbai"
            });
            if (dbRes) {
              setUser(u => u ? {
                ...u,
                points: typeof dbRes.points === "number" ? dbRes.points : u.points,
                reportsFiled: typeof dbRes.reportsFiled === "number" ? dbRes.reportsFiled : u.reportsFiled,
                reportsResolved: typeof dbRes.reportsResolved === "number" ? dbRes.reportsResolved : u.reportsResolved,
              } : u);
            }
          } catch (e) {
            console.warn("Backend user registration sync:", e);
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          setActivities([]);
        }
      } catch (err) {
        console.warn("Auth state error:", err);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // ── Normalize raw backend issue to frontend Issue shape ──────────────────────
  function normalizeIssue(raw: any): Issue {
    // Map backend status strings to frontend status union
    const statusMap: Record<string, Issue["status"]> = {
      "Reported":           "new",
      "reported":           "new",
      "new":                "new",
      "In Progress":        "in_progress",
      "in_progress":        "in_progress",
      "Pending Approval":   "pending_approval",
      "pending_approval":   "pending_approval",
      "Resolved":           "resolved",
      "resolved":           "resolved",
    };

    // Map backend assignedTeam (string) to frontend assignedTeam object
    let assignedTeam = raw.assignedTeam;
    if (typeof raw.assignedTeam === "string" && raw.assignedTeam) {
      assignedTeam = {
        teamName: raw.assignedTeam,
        officerNames: Array.isArray(raw.assignedOfficers) ? raw.assignedOfficers : [],
        assignedAt: raw.assignedAt || raw.createdAt || new Date().toISOString(),
      };
    }

    return {
      id: raw.id,
      title: raw.title || "",
      description: raw.description || "",
      category: raw.category || "Infrastructure",
      priority: raw.priority || "medium",
      status: statusMap[raw.status] || "new",
      location: raw.location || "",
      city: raw.city || "Mumbai",
      lat: raw.lat || 0,
      lng: raw.lng || 0,
      votes: raw.votes ?? 0,
      comments: raw.comments ?? 0,
      reportedBy: raw.reportedBy || raw.reporterId || "",
      reportedAt: raw.reportedAt || raw.createdAt || new Date().toISOString(),
      image: (raw.imageUrl || raw.image || "").startsWith("/uploads") 
        ? `${API_BASE}${raw.imageUrl || raw.image}` 
        : (raw.imageUrl || raw.image || undefined),
      tags: raw.tags || [],
      aiPriorityScore: raw.aiScore,
      aiPriorityLevel: raw.priorityLevel,
      slaHours: raw.slaHours,
      slaDeadline: raw.slaDeadline,
      escalated: raw.escalated,
      assignedTeam,
      upvotedBy: raw.upvotedBy || [],
      siteArrivalProof: raw.siteArrivalProof || undefined,
      resolutionProof: raw.resolutionProof || undefined,
      yoloDetections: raw.yoloDetections || [],
      aiSummary: raw.aiSummary || "",
      aiRiskAssessment: raw.aiRiskAssessment || "",
      recommendedAction: raw.recommendedAction || "",
      voiceRecordingUrl: raw.voiceRecordingUrl || raw.voice_recording_url || undefined,
    };
  }

  // Fetch initial issues from PostgreSQL API and subscribe to WebSocket real-time events
  useEffect(() => {
    async function loadBackendIssues() {
      try {
        const fetched = await apiClient.get("/issues");
        if (Array.isArray(fetched) && fetched.length > 0) {
          // Backend has real data — use it
          setIssues(fetched.map(normalizeIssue));
        }
        // If backend returns empty array (fresh/empty DB), keep mock data as fallback
      } catch (e) {
        console.warn("Python FastAPI backend offline or unreachable, using local fallback issues:", e);
      }
    }

    loadBackendIssues();

    // Connect WebSocket client
    const userId = user?.uid || "anonymous";
    realtimeWS.connect(userId);

    const unsubscribe = realtimeWS.subscribe((event) => {
      console.log("[WebSocket Event Received]", event);
      if (event.type === "issue_created" && event.issue) {
        // Skip if this client created the issue — we already added it optimistically
        if (pendingTempIds.current.has(event.issue.id)) return;
        const normalized = normalizeIssue(event.issue);
        setIssues(prev => {
          const exists = prev.some(i => i.id === normalized.id || (i.title === normalized.title && i.location === normalized.location));
          return exists ? prev : [normalized, ...prev];
        });
      } else if (event.type === "issue_deleted" && event.issue_id) {
        setIssues(prev => prev.filter(i => i.id !== event.issue_id));
      } else if (event.type === "issue_status_updated") {
        const statusMap: Record<string, Issue["status"]> = {
          "Reported": "new", "reported": "new", "new": "new",
          "In Progress": "in_progress", "in_progress": "in_progress",
          "Pending Approval": "pending_approval", "pending_approval": "pending_approval",
          "Resolved": "resolved", "resolved": "resolved",
        };
        const normalizedStatus = statusMap[event.status] || event.status;
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? { ...i, status: normalizedStatus } : i)
        );
      } else if (event.type === "issue_upvoted") {
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? { ...i, votes: event.votes, upvotedBy: event.upvotedBy } : i)
        );
      } else if (event.type === "team_assigned") {
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? {
            ...i,
            assignedTeam: {
              teamName: typeof event.teamName === "string" ? event.teamName : (event.teamName?.teamName || "Assigned Team"),
              officerNames: Array.isArray(event.officerNames) ? event.officerNames : (event.teamName?.officerNames || []),
              assignedAt: new Date().toISOString()
            },
            slaHours: event.slaHours || i.slaHours
          } : i)
        );

        if (event.notification && (!event.reporterId || event.reporterId === user?.uid)) {
          setNotifications(prev => [event.notification, ...prev]);
        }
      } else if (event.type === "arrival_proof_submitted") {
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? {
            ...i,
            status: "in_progress",
            siteArrivalProof: event.siteArrivalProof
          } : i)
        );
        if (event.notification && (!event.reporterId || event.reporterId === user?.uid)) {
          setNotifications(prev => [event.notification, ...prev]);
        }
      } else if (event.type === "resolution_proof_submitted") {
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? {
            ...i,
            status: "pending_approval",
            resolutionProof: event.resolutionProof
          } : i)
        );
        if (event.notification && (!event.reporterId || event.reporterId === user?.uid)) {
          setNotifications(prev => [event.notification, ...prev]);
        }
      } else if (event.type === "citizen_approved") {
        setIssues(prev =>
          prev.map(i => i.id === event.issue_id ? {
            ...i,
            status: event.approved ? "resolved" : "in_progress",
            resolutionProof: i.resolutionProof ? { ...i.resolutionProof, approvedByCitizen: event.approved } : undefined
          } : i)
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Subscribe to current user's activity feed
  useEffect(() => {
    if (!user?.uid) {
      setActivities([]);
      return;
    }
    const unsub = subscribeToActivities(user.uid, setActivities);
    return unsub;
  }, [user?.uid]);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function loginWithGithub() {
    await signInWithPopup(auth, githubProvider);
  }

  async function loginAsAdmin(adminId: string) {
    try {
      const res = await apiClient.post("/auth/admin/login", {
        admin_id: adminId,
        password: "aryan@8291"
      });
      if (res && res.user) {
        const adminUser: UserProfile = {
          uid: res.user.uid,
          name: res.user.name,
          email: res.user.email,
          photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          role: "official",
          points: 9999,
          level: 99,
          reportsFiled: 0,
          reportsResolved: 42,
          joinedAt: new Date().toISOString(),
          ward: "City Command HQ"
        };
        setUser(adminUser);
        try {
          window.sessionStorage.setItem("urbanEyeAdminUser", JSON.stringify(adminUser));
        } catch {}
        return;
      }
    } catch (e) {
      console.warn("Backend admin login endpoint fallback:", e);
    }

    const adminUser: UserProfile = {
      uid: `admin-${adminId}`,
      name: `City Admin (${adminId})`,
      email: `${adminId}@urbaneye.gov`,
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      role: "official",
      points: 0,
      level: 1,
      reportsFiled: 0,
      reportsResolved: 0,
      joinedAt: new Date().toISOString(),
      ward: "City Command HQ"
    };
    setUser(adminUser);
    try {
      window.sessionStorage.setItem("urbanEyeAdminUser", JSON.stringify(adminUser));
    } catch {}
  }

  async function loginAsEmployee(employeeId: string, name: string = "Field Officer") {
    const empUser: UserProfile = {
      uid: `emp-${employeeId}`,
      name: `${name} (${employeeId})`,
      email: `${employeeId}@urbaneye.gov`,
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      role: "field_employee",
      points: 0,
      level: 1,
      reportsFiled: 0,
      reportsResolved: 0,
      joinedAt: new Date().toISOString(),
      ward: "Field Operations Unit"
    };
    setUser(empUser);
    try {
      window.sessionStorage.setItem("urbanEyeAdminUser", JSON.stringify(empUser));
    } catch {}
  }

  async function submitSiteArrivalProof(issueId: string, proof: { imageUrl: string; lat: number; lng: number; locationName?: string }) {
    const arrivedBy = user?.name || "Field Officer";
    const arrivedAt = new Date().toISOString();

    setIssues(prev => prev.map(i => {
      if (i.id !== issueId) return i;
      return {
        ...i,
        status: "in_progress",
        siteArrivalProof: {
          imageUrl: proof.imageUrl,
          lat: proof.lat,
          lng: proof.lng,
          locationName: proof.locationName || i.location,
          arrivedAt,
          arrivedBy
        }
      };
    }));

    const targetIssue = issues.find(i => i.id === issueId);
    const newNotif: AppNotification = {
      id: `notif-arrival-${Date.now()}`,
      type: "status_change",
      title: "🚛 Field Team Arrived at Site",
      message: `${arrivedBy} has reached the location and uploaded site arrival proof for '${targetIssue?.title || "Reported Issue"}'. Status moved to In Progress.`,
      icon: "🚛",
      issueId,
      createdAt: arrivedAt,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    try {
      await apiClient.patch(`/issues/${issueId}/arrival-proof`, {
        image_url: proof.imageUrl,
        lat: proof.lat,
        lng: proof.lng,
        location_name: proof.locationName || targetIssue?.location,
        submitted_by: arrivedBy
      });
    } catch (e) {
      console.warn("Backend update error:", e);
    }
  }

  async function submitResolutionProof(issueId: string, proof: { imageUrl: string; lat: number; lng: number; locationName?: string }) {
    const resolvedBy = user?.name || "Field Officer";
    const resolvedAt = new Date().toISOString();

    setIssues(prev => prev.map(i => {
      if (i.id !== issueId) return i;
      return {
        ...i,
        status: "pending_approval",
        resolutionProof: {
          imageUrl: proof.imageUrl,
          lat: proof.lat,
          lng: proof.lng,
          locationName: proof.locationName || i.location,
          resolvedAt,
          resolvedBy,
          approvedByCitizen: false
        }
      };
    }));

    const targetIssue = issues.find(i => i.id === issueId);
    const newNotif: AppNotification = {
      id: `notif-proof-${Date.now()}`,
      type: "status_change",
      title: "⏳ Resolution Proof Uploaded - Citizen Verification Required",
      message: `Field Officer ${resolvedBy} submitted final resolution proof for '${targetIssue?.title || "Reported Issue"}'. Citizen confirmation is required to mark as Resolved.`,
      icon: "📸",
      issueId,
      createdAt: resolvedAt,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    try {
      await apiClient.patch(`/issues/${issueId}/resolution-proof`, {
        image_url: proof.imageUrl,
        lat: proof.lat,
        lng: proof.lng,
        location_name: proof.locationName || targetIssue?.location,
        submitted_by: resolvedBy
      });
    } catch (e) {
      console.warn("Backend update error:", e);
    }
  }

  async function approveResolution(issueId: string, approved: boolean) {
    const newStatus = approved ? "resolved" : "in_progress";

    setIssues(prev => prev.map(i => {
      if (i.id !== issueId) return i;
      return {
        ...i,
        status: newStatus,
        resolutionProof: i.resolutionProof ? {
          ...i.resolutionProof,
          approvedByCitizen: approved
        } : undefined
      };
    }));

    const targetIssue = issues.find(i => i.id === issueId);
    const newNotif: AppNotification = {
      id: `notif-approve-${Date.now()}`,
      type: "status_change",
      title: approved ? "✅ Resolution Approved by Citizen" : "⚠️ Resolution Rejected by Citizen",
      message: approved
        ? `Citizen confirmed resolution for '${targetIssue?.title || "Reported Issue"}'. Issue officially moved to Resolved in Kanban.`
        : `Citizen requested further work on '${targetIssue?.title || "Reported Issue"}'. Moved back to In Progress.`,
      icon: approved ? "✅" : "⚠️",
      issueId,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    try {
      await apiClient.patch(`/issues/${issueId}/citizen-approve`, {
        approved,
        citizen_id: user?.uid
      });
    } catch (e) {
      console.warn("Backend update error:", e);
    }
  }

  async function logout() {
    try {
      window.sessionStorage.removeItem("urbanEyeAdminUser");
    } catch {}
    setUser(null);
    setFirebaseUser(null);
    try {
      await signOut(auth);
    } catch {}
  }

  // Track tempIds that this client created so the WS echo doesn't duplicate them
  const pendingTempIds = useRef<Set<string>>(new Set());

  async function addIssue(issue: Omit<Issue, "id">, imageFile?: File | null) {
    const tempId = `iss-${Date.now()}`;
    const newIssue: Issue = { ...issue, id: tempId };
    pendingTempIds.current.add(tempId);
    setIssues(prev => [newIssue, ...prev]);

    if (user) {
      const newReportsFiled = (user.reportsFiled || 0) + 1;
      setUser(u => u ? { ...u, reportsFiled: newReportsFiled } : u);
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: "issue_reported",
      title: "📍 New Civic Report Submitted",
      message: `Your report "${issue.title}" at ${issue.location} has been registered.`,
      icon: "📍",
      issueId: tempId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Send to Python FastAPI backend
    try {
      const formData = new FormData();
      formData.append("title", issue.title);
      formData.append("description", issue.description);
      formData.append("category", issue.category);
      formData.append("location", issue.location);
      if (issue.lat) formData.append("lat", issue.lat.toString());
      if (issue.lng) formData.append("lng", issue.lng.toString());
      formData.append("city", issue.city || selectedCity || "Mumbai");
      formData.append("reporter_id", user?.uid || "anonymous");
      formData.append("reporter_name", user?.name || "Anonymous Citizen");
      if (issue.voiceRecordingUrl) {
        formData.append("voice_recording", issue.voiceRecordingUrl);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const created = await apiClient.postFormData("/issues", formData);
      if (created && created.id) {
        // Mark the real backend ID so the WebSocket echo is ignored
        pendingTempIds.current.add(created.id);
        // Replace temp local copy with backend response
        setIssues(prev => prev.map(i => i.id === tempId ? created : i));
        // Clean up after a short delay (WS echo arrives within ms)
        setTimeout(() => {
          pendingTempIds.current.delete(created.id);
          pendingTempIds.current.delete(tempId);
        }, 5000);
      }
    } catch (err) {
      console.warn("Backend error adding issue:", err);
      pendingTempIds.current.delete(tempId);
      // Rollback the optimistic UI update
      setIssues(prev => prev.filter(i => i.id !== tempId));
      throw err;
    }
  }

  async function deleteIssue(id: string) {
    if (!user) return;
    const issue = issues.find(i => i.id === id);
    setIssues(prev => prev.filter(i => i.id !== id));

    const newPoints = Math.max(0, (user.points || 0) - 50);
    const newReportsFiled = Math.max(0, (user.reportsFiled || 0) - 1);
    setUser(u => u ? { ...u, points: newPoints, reportsFiled: newReportsFiled } : u);
    logActivity(user.uid, "issue_deleted", `Deleted report: ${issue?.title ?? id}`, id);

    try {
      await apiClient.delete(`/issues/${id}`);
    } catch (err) {
      console.warn("Backend error deleting issue:", err);
    }
  }

  async function upvoteIssue(id: string) {
    if (!user) return;
    let didUpvote = false;
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      const upvoted = (i.upvotedBy || []).includes(user.uid);
      didUpvote = !upvoted;
      const newUpvoted = upvoted
        ? (i.upvotedBy || []).filter(u => u !== user.uid)
        : [...(i.upvotedBy || []), user.uid];
      const newVotes = upvoted ? Math.max(0, i.votes - 1) : i.votes + 1;
      return { ...i, votes: newVotes, upvotedBy: newUpvoted };
    }));
    if (didUpvote) {
      logActivity(user.uid, "issue_upvoted", `Upvoted issue`, id);
    }

    try {
      const formData = new FormData();
      formData.append("user_id", user.uid);
      await apiClient.patchFormData(`/issues/${id}/upvote`, formData);
    } catch (err) {
      console.warn("Backend error upvoting issue:", err);
    }
  }

  async function updateIssueStatus(id: string, status: Issue["status"]) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (user) {
      logActivity(user.uid, "status_changed", `Status changed to ${status}`, id);
    }
    try {
      await apiClient.patch(`/issues/${id}/status`, { status });
    } catch (err) {
      console.warn("Backend error updating status:", err);
    }
  }

  async function reportFakeIssue(id: string, reason: string) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, flaggedFake: true, flaggedReason: reason } : i));
    try {
      await apiClient.post(`/issues/${id}/flag-fake`, { reason });
    } catch (err) {
      console.warn("Backend error flagging issue:", err);
    }
  }

  async function updateProfile(data: { name?: string; photoURL?: string }) {
    if (!user) return;
    setUser(u => u ? { ...u, name: data.name ?? u.name, photoURL: data.photoURL ?? u.photoURL } : u);
    try {
      await apiClient.patch(`/auth/profile/${user.uid}`, {
        name: data.name,
        photo_url: data.photoURL
      });
    } catch (err) {
      console.warn("Backend error updating profile:", err);
    }
  }

  async function redeemReward(cost: number): Promise<string> {
    if (!user) throw new Error("Not logged in");
    if ((user.points || 0) < cost) throw new Error("Insufficient civic points");
    const newPoints = (user.points || 0) - cost;
    setUser(u => u ? { ...u, points: newPoints } : u);
    const voucherCode = `URBAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return voucherCode;
  }

  function assignTeamToIssue(issueId: string, teamName: string, officerNames: string[], slaHours: number = 24) {
    setIssues(prev => prev.map(i => {
      if (i.id !== issueId) return i;
      return {
        ...i,
        assignedTeam: {
          teamName,
          officerNames,
          assignedAt: new Date().toISOString()
        },
        slaHours
      };
    }));

    try {
      apiClient.patch(`/issues/${issueId}/team`, {
        team_name: teamName,
        officer_names: officerNames,
        sla_hours: slaHours
      });
    } catch (err) {
      console.warn("Backend error assigning team:", err);
    }
  }

  function updateOfficerStatus(officerId: string, status: "on_shift" | "off_duty" | "on_leave") {
    setRoster(prev => prev.map(o => o.id === officerId ? { ...o, status } : o));
  }

  function addOfficer(officer: Omit<CityRosterOfficer, "id" | "activeAssignments">) {
    const newId = `off-${Date.now()}`;
    const newOfficer: CityRosterOfficer = {
      ...officer,
      id: newId,
      activeAssignments: 0,
      avatar: officer.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop`
    };
    setRoster(prev => [newOfficer, ...prev]);
  }

  function updateOfficer(officerId: string, data: Partial<CityRosterOfficer>) {
    setRoster(prev => prev.map(o => o.id === officerId ? { ...o, ...data } : o));
  }

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        issues,
        activities,
        notifications,
        theme,
        language,
        setLanguage,
        t,
        selectedCity,
        setSelectedCity,
        roster,
        toggleTheme,
        loginWithGoogle,
        loginWithGithub,
        logout,
        loginAsAdmin,
        loginAsEmployee,
        submitSiteArrivalProof,
        submitResolutionProof,
        approveResolution,
        addIssue,
        deleteIssue,
        upvoteIssue,
        updateIssueStatus,
        reportFakeIssue,
        updateProfile,
        redeemReward,
        assignTeamToIssue,
        updateOfficerStatus,
        addOfficer,
        updateOfficer,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
