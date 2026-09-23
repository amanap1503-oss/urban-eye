export type IssueCategory = "Infrastructure" | "Safety" | "Environment" | "Utilities" | "Traffic" | "Public Spaces";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IssueStatus = "new" | "in_progress" | "pending_approval" | "resolved";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  location: string;
  city?: string;
  lat: number;
  lng: number;
  votes: number;
  comments: number;
  reportedBy: string;
  reportedAt: string;
  image?: string;
  tags: string[];
  aiPriorityScore?: number;
  aiPriorityLevel?: "critical" | "high" | "medium" | "low";
  slaHours?: number;
  slaDeadline?: string;
  escalated?: boolean;
  assignedTeam?: {
    teamName: string;
    officerNames: string[];
    assignedAt: string;
  };
  upvotedBy?: string[];
  siteArrivalProof?: {
    imageUrl: string;
    lat: number;
    lng: number;
    locationName?: string;
    arrivedAt: string;
    arrivedBy: string;
  };
  resolutionProof?: {
    imageUrl: string;
    lat: number;
    lng: number;
    locationName?: string;
    resolvedAt: string;
    resolvedBy: string;
    approvedByCitizen?: boolean;
  };
  yoloDetections?: { class: string; confidence: number }[];
  aiSummary?: string;
  aiRiskAssessment?: string;
  recommendedAction?: string;
  voiceRecordingUrl?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  points: number;
  issuesReported: number;
  issuesResolved: number;
  joinedAt: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

export const CURRENT_USER: User = {
  id: "u1",
  name: "Alex Rivera",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format",
  rank: "City Champion",
  points: 4850,
  issuesReported: 47,
  issuesResolved: 38,
  joinedAt: "2023-03-15",
  badges: [
    { id: "b1", name: "First Report", description: "Submitted your first civic issue", icon: "🏙️", unlocked: true, progress: 1, total: 1 },
    { id: "b2", name: "Community Voice", description: "Reported 10+ issues", icon: "📢", unlocked: true, progress: 47, total: 10 },
    { id: "b3", name: "Problem Solver", description: "Had 25 issues resolved", icon: "✅", unlocked: true, progress: 38, total: 25 },
    { id: "b4", name: "Neighborhood Hero", description: "Earned 5000 civic points", icon: "🦸", unlocked: false, progress: 4850, total: 5000 },
    { id: "b5", name: "Trend Setter", description: "Get 100 upvotes on a single issue", icon: "🔥", unlocked: false, progress: 87, total: 100 },
    { id: "b6", name: "City Architect", description: "Report 100 issues", icon: "🏛️", unlocked: false, progress: 47, total: 100 },
  ],
};

export const INITIAL_CITY_ROSTERS = [
  // Mumbai Officers
  { id: "off-m1", name: "Inspector Rajesh Shinde", department: "Public Works", role: "Senior Road Engineer", phone: "+91 98201 12345", city: "Mumbai", status: "on_shift" as const, shiftStart: "08:00", shiftEnd: "16:00", activeAssignments: 1, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
  { id: "off-m2", name: "Officer Priya Kulkarni", department: "Water & Power", role: "Utilities Specialist", phone: "+91 98202 23456", city: "Mumbai", status: "on_shift" as const, shiftStart: "08:00", shiftEnd: "16:00", activeAssignments: 2, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: "off-m3", name: "Captain Vikram Patil", department: "Traffic & Safety", role: "Safety Supervisor", phone: "+91 98203 34567", city: "Mumbai", status: "on_shift" as const, shiftStart: "09:00", shiftEnd: "17:00", activeAssignments: 0, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: "off-m4", name: "Officer Sunita Deshmukh", department: "Sanitation & Bio-Hazard", role: "Environmental Officer", phone: "+91 98204 45678", city: "Mumbai", status: "on_leave" as const, shiftStart: "08:00", shiftEnd: "16:00", activeAssignments: 0, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: "off-m5", name: "Engineer Amit Shah", department: "Parks & Amenities", role: "Civic Maintenance", phone: "+91 98205 56789", city: "Mumbai", status: "off_duty" as const, shiftStart: "16:00", shiftEnd: "24:00", activeAssignments: 0, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },

  // Pune Officers
  { id: "off-p1", name: "Officer Anand Joshi", department: "Public Works", role: "Ward Supervisor", phone: "+91 98901 11223", city: "Pune", status: "on_shift" as const, shiftStart: "08:00", shiftEnd: "16:00", activeAssignments: 0, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
  { id: "off-p2", name: "Inspector Sneha More", department: "Water & Power", role: "Hydraulic Engineer", phone: "+91 98902 22334", city: "Pune", status: "on_shift" as const, shiftStart: "08:00", shiftEnd: "16:00", activeAssignments: 1, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: "off-p3", name: "Officer Rahul Pawar", department: "Traffic & Safety", role: "Safety Lead", phone: "+91 98903 33445", city: "Pune", status: "off_duty" as const, shiftStart: "16:00", shiftEnd: "24:00", activeAssignments: 0, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
];

export const ISSUES: Issue[] = [];

export const WEEKLY_DATA = [
  { day: "Mon", reported: 12, resolved: 8, active: 45 },
  { day: "Tue", reported: 19, resolved: 14, active: 50 },
  { day: "Wed", reported: 8, resolved: 11, active: 47 },
  { day: "Thu", reported: 24, resolved: 9, active: 62 },
  { day: "Fri", reported: 17, resolved: 20, active: 59 },
  { day: "Sat", reported: 9, resolved: 13, active: 55 },
  { day: "Sun", reported: 6, resolved: 7, active: 54 },
];

export const MONTHLY_DATA = [
  { month: "Jul", reported: 89, resolved: 71 },
  { month: "Aug", reported: 104, resolved: 88 },
  { month: "Sep", reported: 97, resolved: 92 },
  { month: "Oct", reported: 118, resolved: 101 },
  { month: "Nov", reported: 88, resolved: 95 },
  { month: "Dec", reported: 76, resolved: 80 },
  { month: "Jan", reported: 95, resolved: 73 },
];

export const CATEGORY_DATA = [
  { name: "Infrastructure", value: 34, color: "#3b82f6" },
  { name: "Safety", value: 22, color: "#ef4444" },
  { name: "Environment", value: 18, color: "#10b981" },
  { name: "Utilities", value: 12, color: "#f59e0b" },
  { name: "Traffic", value: 9, color: "#8b5cf6" },
  { name: "Public Spaces", value: 5, color: "#06b6d4" },
];

export const LEADERBOARD = [
  { rank: 1, name: "Sophia Martinez", points: 7820, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format", badge: "City Guardian" },
  { rank: 2, name: "Noah Thompson", points: 6540, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&auto=format", badge: "Civic Pioneer" },
  { rank: 3, name: "Alex Rivera", points: 4850, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format", badge: "City Champion" },
  { rank: 4, name: "Emma Davis", points: 3920, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format", badge: "Community Star" },
  { rank: 5, name: "James Wilson", points: 3240, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&auto=format", badge: "Issue Tracker" },
];

export const ACTIVITY_LOG = [
  { id: "a1", type: "reported", title: "Reported: Pothole on Maple Ave", points: 50, date: "2024-01-21", icon: "📍" },
  { id: "a2", type: "upvoted", title: "Issue resolved: Broken streetlight", points: 100, date: "2024-01-20", icon: "✅" },
  { id: "a3", type: "badge", title: "Badge unlocked: Problem Solver", points: 200, date: "2024-01-19", icon: "🏆" },
  { id: "a4", type: "commented", title: "Commented on: Water main leak", points: 10, date: "2024-01-18", icon: "💬" },
  { id: "a5", type: "reported", title: "Reported: Traffic signal malfunction", points: 50, date: "2024-01-17", icon: "📍" },
  { id: "a6", type: "upvoted", title: "Upvoted: Graffiti on library wall", points: 5, date: "2024-01-16", icon: "⬆️" },
];

export const CATEGORY_COLOR: Record<IssueCategory, string> = {
  Infrastructure: "#3b82f6",
  Safety: "#ef4444",
  Environment: "#10b981",
  Utilities: "#f59e0b",
  Traffic: "#8b5cf6",
  "Public Spaces": "#06b6d4",
};

export const PRIORITY_COLOR: Record<IssuePriority, string> = {
  low: "#64748b",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};
