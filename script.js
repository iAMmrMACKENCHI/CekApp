/* ============================================================
   Physics with Vikas — Core Script
   All logic: auth, API, reels, navigation, UX controls
   ============================================================ */

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwvsSYomfz25kcNJKTTZxtSstqa71Aqj5NCGGlrjVYf08V4Ifyu3PYlQzSD2C9cFzvQ/exec",
  DRIVE_FOLDER:    "https://drive.google.com/drive/u/0/folders/1Z_jJbShQ0povcJNdSyAm05UocDx6sg_7",
  UPI_ID:          "physicswithvikas@upi",
  COURSE_PRICE:    2499,
  APP_NAME:        "Physics with Vikas",
};

// ─── MOCK REELS DATA (replace with live Sheets fetch) ───────
const MOCK_REELS = [
  { id:"r1", topic:"Newton's First Law", class:"11", tags:"mechanics,laws", difficulty:"Easy",    videoUrl:"https://www.youtube.com/embed/CQYELiTtUs8" },
  { id:"r2", topic:"Electric Field Lines",class:"12", tags:"electrostatics",  difficulty:"Medium", videoUrl:"https://www.youtube.com/embed/haJnCBCnHqA" },
  { id:"r3", topic:"Work Energy Theorem", class:"11", tags:"mechanics,work",   difficulty:"Medium", videoUrl:"https://www.youtube.com/embed/w4QFJb9a8vo" },
  { id:"r4", topic:"Gauss's Law",          class:"12", tags:"electrostatics",  difficulty:"Hard",   videoUrl:"https://www.youtube.com/embed/rg9eSV62bHs" },
  { id:"r5", topic:"Simple Harmonic Motion",class:"11",tags:"oscillations",   difficulty:"Medium", videoUrl:"https://www.youtube.com/embed/k2FvSzWeVxQ" },
  { id:"r6", topic:"Capacitors",           class:"12", tags:"capacitance",     difficulty:"Medium", videoUrl:"https://www.youtube.com/embed/f_MZNsEqpQk" },
  { id:"r7", topic:"Projectile Motion",    class:"11", tags:"kinematics",      difficulty:"Easy",   videoUrl:"https://www.youtube.com/embed/aY8tZh0iUBs" },
  { id:"r8", topic:"Magnetic Force",       class:"12", tags:"magnetism",       difficulty:"Hard",   videoUrl:"https://www.youtube.com/embed/J0cXrFY0IPo" },
];

// ─── MOCK COURSES DATA ───────────────────────────────────────
const COURSES = [
  {
    id: "c1",
    title: "JEE Physics Foundation",
    subtitle: "Class 11 Complete",
    description: "Master all Class 11 Physics concepts with 60+ video lectures, notes, and daily practice problems. Covers Mechanics, Thermodynamics, Waves, and more.",
    price: 2499,
    originalPrice: 4999,
    chapters: 14,
    lectures: 62,
    duration: "120 hrs",
    level: "Class 11",
    tags: ["Mechanics", "Thermodynamics", "Waves", "Optics"],
    thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
    highlights: ["60+ HD Video Lectures", "Chapter-wise Notes PDF", "Daily Practice Problems", "Doubt Support via WhatsApp", "Progress Tracking"],
  },
  {
    id: "c2",
    title: "JEE Physics Advanced",
    subtitle: "Class 12 Complete",
    description: "Deep dive into Class 12 Physics — Electrostatics, Magnetism, Modern Physics, and Semiconductors. JEE-level problem solving included.",
    price: 2499,
    originalPrice: 4999,
    chapters: 16,
    lectures: 74,
    duration: "140 hrs",
    level: "Class 12",
    tags: ["Electrostatics", "Magnetism", "Modern Physics", "Optics"],
    thumbnail: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
    highlights: ["74+ HD Video Lectures", "Formula Sheets", "PYQ Analysis", "Mock Tests", "WhatsApp Doubt Support"],
  },
];

// ─── AUTH ────────────────────────────────────────────────────
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem("pwv_user")); } catch { return null; }
  },
  setUser(user) {
    localStorage.setItem("pwv_user", JSON.stringify({ ...user, loggedIn: true, createdAt: new Date().toISOString() }));
  },
  logout() {
    localStorage.removeItem("pwv_user");
    window.location.href = "login.html";
  },
  isLoggedIn() {
    const u = this.getUser();
    return u && u.loggedIn === true;
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },
  requireGuest() {
    if (this.isLoggedIn()) {
      window.location.href = "dashboard.html";
    }
  },
  hasPurchased(courseId) {
    const purchases = JSON.parse(localStorage.getItem("pwv_purchases") || "[]");
    return purchases.includes(courseId);
  },
  addPurchase(courseId) {
    const purchases = JSON.parse(localStorage.getItem("pwv_purchases") || "[]");
    if (!purchases.includes(courseId)) purchases.push(courseId);
    localStorage.setItem("pwv_purchases", JSON.stringify(purchases));
  },
};

// ─── PREFERENCES ─────────────────────────────────────────────
const Prefs = {
  get() {
    try { return JSON.parse(localStorage.getItem("pwv_prefs")) || {}; } catch { return {}; }
  },
  set(data) {
    localStorage.setItem("pwv_prefs", JSON.stringify({ ...this.get(), ...data }));
  },
};

// ─── API: GOOGLE APPS SCRIPT ──────────────────────────────────
const API = {
  async post(action, payload) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("YOUR_")) {
      console.warn("Apps Script URL not configured. Running in offline mode.");
      return { status: "ok", offline: true };
    }

    try {
      // Send as GET with URL params — avoids CORS preflight entirely
      const params = new URLSearchParams({
        action,
        data: JSON.stringify(payload)
      });
      
      const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
      });
      
      return res.json();
    } catch (err) {
      console.error("API error:", err);
      return { status: "error", message: err.toString() };
    }
  },

  async signupUser(name, phone, email) {
    return this.post("signup", { name, phone, email });
  },
  async submitPayment(data) {
    return this.post("payment", data);
  },
  async fetchReels() {
    try {
      const res = await this.post("getReels", {});
      return res.reels || MOCK_REELS;
    } catch {
      return MOCK_REELS;
    }
  },
};
// ─── REELS ENGINE ─────────────────────────────────────────────
const ReelsEngine = {
  data: [],
  currentIndex: 0,

  async init() {
    const prefs = Prefs.get();
    let reels = await API.fetchReels();

    // Filter by class if preference set
    if (prefs.class) {
      reels = reels.filter(r => r.class === prefs.class || !r.class);
    }

    // Shuffle
    this.data = reels.sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
  },

  getNext() {
    if (this.currentIndex >= this.data.length) this.currentIndex = 0;
    return this.data[this.currentIndex++];
  },

  shouldShowCTA(index) {
    return (index + 1) % 3 === 0;
  },
};

// ─── UX CONTROLS ─────────────────────────────────────────────
const UXControls = {
  init() {
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("selectstart", e => e.preventDefault());
    document.addEventListener("dragstart",   e => e.preventDefault());
    document.addEventListener("keydown", e => {
      // Block F12, Ctrl+U, Ctrl+Shift+I
      if (e.key === "F12") { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === "u") { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && ["i","I","j","J"].includes(e.key)) { e.preventDefault(); return false; }
    });
  },
};

// ─── BOTTOM NAV ACTIVE STATE ──────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split("/").pop();
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.classList.remove("text-sky-400");
    el.classList.add("text-slate-500");
    if (el.dataset.nav === path) {
      el.classList.add("text-sky-400");
      el.classList.remove("text-slate-500");
    }
  });
}

// ─── TOAST NOTIFICATION ───────────────────────────────────────
function showToast(message, type = "info") {
  const existing = document.getElementById("pwv-toast");
  if (existing) existing.remove();

  const colors = { info: "bg-slate-700", success: "bg-green-600", error: "bg-red-600", warning: "bg-amber-500" };
  const toast = document.createElement("div");
  toast.id = "pwv-toast";
  toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-white text-sm font-medium shadow-2xl transition-all duration-300 ${colors[type] || colors.info}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── LOADING OVERLAY ─────────────────────────────────────────
function showLoading(msg = "Please wait…") {
  let ov = document.getElementById("pwv-loading");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "pwv-loading";
    ov.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-white text-sm" id="pwv-loading-msg">${msg}</p>
      </div>`;
    ov.className = "fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-center justify-center";
    document.body.appendChild(ov);
  } else {
    document.getElementById("pwv-loading-msg").textContent = msg;
  }
}
function hideLoading() {
  const ov = document.getElementById("pwv-loading");
  if (ov) ov.remove();
}

// ─── POPULATE USER DATA IN UI ─────────────────────────────────
function populateUserUI() {
  const user = Auth.getUser();
  if (!user) return;
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = user.name || "Student");
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = user.email || "");
  document.querySelectorAll("[data-user-phone]").forEach(el => el.textContent = user.phone || "");
  document.querySelectorAll("[data-user-initial]").forEach(el => el.textContent = (user.name || "S")[0].toUpperCase());
}

// ─── DEMO DATA SEEDER ────────────────────────────────────────
// Seeds mock payment/student data so admin & dashboard aren't blank
const DemoSeeder = {
  DEMO_PAYMENTS: [
    { courseId:"c1", name:"Rahul Sharma",   email:"rahul.sharma@gmail.com",  phone:"9876543210", remark:"PhysicsCourse_RahulSharma",   ts: Date.now() - 3600000 * 5  },
    { courseId:"c2", name:"Priya Verma",    email:"priya.v2025@gmail.com",   phone:"9123456789", remark:"PhysicsCourse_PriyaVerma",    ts: Date.now() - 3600000 * 3  },
    { courseId:"c1", name:"Arjun Mehta",    email:"arjunm.jee@gmail.com",    phone:"8765432109", remark:"PhysicsCourse_ArjunMehta",    ts: Date.now() - 3600000 * 1  },
    { courseId:"c1", name:"Sneha Patel",    email:"sneha.patel11@gmail.com", phone:"7654321098", remark:"PhysicsCourse_SnehaPatel",    ts: Date.now() - 3600000 * 0.5},
    { courseId:"c2", name:"Dev Agarwal",    email:"dev.agarwal@gmail.com",   phone:"9988776655", remark:"PhysicsCourse_DevAgarwal",    ts: Date.now() - 3600000 * 2  },
  ],
  DEMO_USERS: [
    { name:"Rahul Sharma",  phone:"9876543210", email:"rahul.sharma@gmail.com",  class:"11", loggedIn:false },
    { name:"Priya Verma",   phone:"9123456789", email:"priya.v2025@gmail.com",   class:"12", loggedIn:false },
    { name:"Arjun Mehta",   phone:"8765432109", email:"arjunm.jee@gmail.com",    class:"11", loggedIn:false },
    { name:"Sneha Patel",   phone:"7654321098", email:"sneha.patel11@gmail.com", class:"12", loggedIn:false },
    { name:"Dev Agarwal",   phone:"9988776655", email:"dev.agarwal@gmail.com",   class:"dropper", loggedIn:false },
  ],
  seed() {
    // Only seed if not already seeded AND no real data present
    if (localStorage.getItem("pwv_demo_seeded")) return;
    // Seed pending payments
    const existingPending = JSON.parse(localStorage.getItem("pwv_pending") || "[]");
    if (existingPending.length === 0) {
      localStorage.setItem("pwv_pending", JSON.stringify(this.DEMO_PAYMENTS));
    }
    // Seed demo users list for admin
    const existingUsers = JSON.parse(localStorage.getItem("pwv_all_users") || "[]");
    if (existingUsers.length === 0) {
      localStorage.setItem("pwv_all_users", JSON.stringify(this.DEMO_USERS));
    }
    localStorage.setItem("pwv_demo_seeded", "true");
  },
  clear() {
    localStorage.removeItem("pwv_pending");
    localStorage.removeItem("pwv_all_users");
    localStorage.removeItem("pwv_demo_seeded");
    showToast("Demo data cleared!", "info");
    setTimeout(() => window.location.reload(), 800);
  },
};

// ─── INIT ON PAGE LOAD ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  UXControls.init();
  setActiveNav();
  populateUserUI();
  DemoSeeder.seed(); // Auto-seed demo data on first load
});
