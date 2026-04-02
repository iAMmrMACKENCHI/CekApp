// ============================================================
// script.js — Physics with Vikas (Cek: Sabka Saath Sabka Vikas)
// Frontend Utility Library v2.0
// ============================================================
// ⚠️  After deploying Code.gs, paste your Web App URL below
//     OR set it once in the Admin Panel → Setup tab.
// ============================================================

// ── Configuration ─────────────────────────────────────────────
var CONFIG = {
  APPS_SCRIPT_URL : 'https://script.google.com/macros/s/AKfycbzxOEeNH_Q0ix-zTxh9AGmOLvfVdZ0WI-wh82PP-Sfs4D49axytA6Hw9iqWRgcjTtT1/exec',
  UPI_ID          : 'jhakassvikash1112@upi',
  DRIVE_FOLDER  = : 'httphttps://drive.google.com/drive/u/0/folders/1Z_jJbShQ0povcJNdSyAm05UocDx6sg_7',
  ADMIN_SECRET    : 'vikas2024admin', 
};

// ── Course Data ───────────────────────────────────────────────
var COURSES = [
  {
    id           : 'c1',
    title        : 'JEE Physics Foundation',
    subtitle     : 'Class 11 · Complete Physics',
    level        : 'Class 11',
    lectures     : '62',
    chapters     : '14',
    duration     : '120 hrs',
    price        : 2499,
    originalPrice: 4999,
    description  : 'A complete Class 11 Physics course designed for JEE and Board students. Covers all 14 NCERT chapters with extra JEE-level problems, PDF notes, and DPP sheets.',
    highlights   : [
      '62 HD video lectures (recorded)',
      'Chapter-wise PDF notes (handwritten + typed)',
      'Daily Practice Problems (DPP) for every chapter',
      'DPP solutions with step-by-step explanations',
      'WhatsApp doubt support with Vikas Sir',
      'Valid for 1 year from purchase date',
    ],
    tags: ["Kinematics","Newton's Laws","Thermodynamics","Waves","Optics","SHM"],
  },
  {
    id           : 'c2',
    title        : 'JEE Physics Advanced',
    subtitle     : 'Class 12 · Complete Physics',
    level        : 'Class 12',
    lectures     : '74',
    chapters     : '16',
    duration     : '140 hrs',
    price        : 2499,
    originalPrice: 4999,
    description  : 'A complete Class 12 Physics course for JEE and Board students. Covers all 16 NCERT chapters with JEE-level problems, PDF notes, and DPP sheets.',
    highlights   : [
      '74 HD video lectures (recorded)',
      'Chapter-wise PDF notes (handwritten + typed)',
      'Daily Practice Problems (DPP) for every chapter',
      'DPP solutions with step-by-step explanations',
      'WhatsApp doubt support with Vikas Sir',
      'Valid for 1 year from purchase date',
    ],
    tags: ['Electrostatics','Magnetism','EMI','Optics','Dual Nature','Semiconductors'],
  },
];

// ── Mock Reels (fallback when Sheet has no data) ──────────────
var MOCK_REELS = [
  { id:'r1', topic:"Newton's First Law",     class:'11', tags:'Mechanics,Laws',   difficulty:'Easy',   videoUrl:'https://www.youtube.com/watch?v=kKKM8Y-u7ds' },
  { id:'r2', topic:'Projectile Motion',      class:'11', tags:'Kinematics',       difficulty:'Medium', videoUrl:'https://www.youtube.com/watch?v=aY8tZB4efXI' },
  { id:'r3', topic:'Work Energy Theorem',    class:'11', tags:'Work,Energy',      difficulty:'Medium', videoUrl:'https://www.youtube.com/watch?v=SpM2KH0aSNY' },
  { id:'r4', topic:'Electric Field Lines',   class:'12', tags:'Electrostatics',   difficulty:'Easy',   videoUrl:'https://www.youtube.com/watch?v=mdulzEfQXDE' },
  { id:'r5', topic:'Capacitors in Circuits', class:'12', tags:'Electrostatics',   difficulty:'Hard',   videoUrl:'https://www.youtube.com/watch?v=f_MZNsEqLs4' },
  { id:'r6', topic:'Simple Harmonic Motion', class:'11', tags:'Waves,SHM',        difficulty:'Hard',   videoUrl:'https://www.youtube.com/watch?v=9ggJpBj2HW0' },
  { id:'r7', topic:'Magnetic Force on Wire', class:'12', tags:'Magnetism',        difficulty:'Medium', videoUrl:'https://www.youtube.com/watch?v=GG_x-aNixTU' },
  { id:'r8', topic:'Photoelectric Effect',   class:'12', tags:'Modern Physics',   difficulty:'Easy',   videoUrl:'https://www.youtube.com/watch?v=qLe5VHhkKDM' },
];

// ============================================================
// AUTHENTICATION
// ============================================================
var Auth = {
  /** Return current logged-in user object or null */
  getUser: function() {
    try { return JSON.parse(localStorage.getItem('pwv_user') || 'null'); }
    catch(e) { return null; }
  },

  /** Persist user to localStorage and update user list */
  setUser: function(data) {
    var user = Object.assign({}, data, { loggedIn: true });
    localStorage.setItem('pwv_user', JSON.stringify(user));

    // Keep a running list for the admin panel
    if (data.email) {
      var all = JSON.parse(localStorage.getItem('pwv_all_users') || '[]');
      if (!all.find(function(u){ return u.email === data.email; })) {
        all.push(data);
        localStorage.setItem('pwv_all_users', JSON.stringify(all));
      }
    }
  },

  /** Clear session and redirect to login */
  logout: function() {
    localStorage.removeItem('pwv_user');
    window.location.href = 'login.html';
  },

  /**
   * Call on every protected page (dashboard, profile, course access, buy).
   * Redirects to login if not authenticated.
   * Auto-populates [data-user-*] elements.
   */
  requireAuth: function() {
    var u = this.getUser();
    if (!u || !u.loggedIn) {
      window.location.href = 'login.html';
      return;
    }
    var n = u.name || 'Student';
    document.querySelectorAll('[data-user-name]').forEach(function(el){ el.textContent = n; });
    document.querySelectorAll('[data-user-email]').forEach(function(el){ el.textContent = u.email || ''; });
    document.querySelectorAll('[data-user-phone]').forEach(function(el){ el.textContent = u.phone ? '+91 ' + u.phone : ''; });
    document.querySelectorAll('[data-user-initial]').forEach(function(el){ el.textContent = n[0].toUpperCase(); });
  },

  /**
   * Call on login/register pages.
   * Redirects to dashboard if already logged in.
   */
  requireGuest: function() {
    var u = this.getUser();
    if (u && u.loggedIn && !u.guest) window.location.href = 'dashboard.html';
  },

  hasPurchased: function(courseId) {
    var p = JSON.parse(localStorage.getItem('pwv_purchases') || '[]');
    return p.indexOf(courseId) !== -1;
  },

  addPurchase: function(courseId) {
    var p = JSON.parse(localStorage.getItem('pwv_purchases') || '[]');
    if (p.indexOf(courseId) === -1) {
      p.push(courseId);
      localStorage.setItem('pwv_purchases', JSON.stringify(p));
    }
  },
};

// ============================================================
// USER PREFERENCES
// ============================================================
var Prefs = {
  get: function() {
    try { return JSON.parse(localStorage.getItem('pwv_prefs') || '{}'); }
    catch(e) { return {}; }
  },
  set: function(data) {
    var cur = this.get();
    localStorage.setItem('pwv_prefs', JSON.stringify(Object.assign(cur, data)));
  },
};

// ============================================================
// API LAYER
// ============================================================
var API = {
  /**
   * Core fetch wrapper for Apps Script.
   * Uses text/plain content-type to avoid CORS preflight issues
   * (Apps Script does not support OPTIONS preflight on POST).
   */
  _call: async function(action, payload) {
    var url = CONFIG.APPS_SCRIPT_URL;
    if (!url || url.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      // Offline / not configured — bubble up for caller to handle
      throw new Error('APPS_SCRIPT_NOT_CONFIGURED');
    }

    var body = Object.assign({ action: action }, payload || {});

    var res = await fetch(url, {
      method  : 'POST',
      // ⚠️ Must use text/plain — Apps Script CORS doesn't allow application/json preflight
      headers : { 'Content-Type': 'text/plain;charset=utf-8' },
      body    : JSON.stringify(body),
      redirect: 'follow',
    });

    var data = await res.json();
    return data; // Always return raw; let callers inspect .success
  },

  /**
   * Register a new student.
   * Returns { success, message, student } or { success:false, error }
   */
  registerStudent: async function(name, phone, email, cls) {
    return this._call('register', { name: name, phone: phone, email: email, class: cls });
  },

  /** Legacy alias (used in older pages as API.signupUser) */
  signupUser: async function(name, phone, email) {
    return this._call('register', { name: name, phone: phone, email: email });
  },

  /**
   * Login with email + password.
   * Returns { success, message, student } or { success:false, error }
   */
  loginStudent: async function(email, password) {
    return this._call('login', { email: email, password: password });
  },

  /**
   * Submit a payment record.
   */
  submitPayment: async function(paymentData) {
    return this._call('submitPayment', paymentData);
  },

  /**
   * Fetch reels from the sheet (falls back to MOCK_REELS if unavailable).
   */
  getReels: async function() {
    try {
      var res = await this._call('getReels', {});
      return (res.success && res.reels && res.reels.length) ? res.reels : MOCK_REELS;
    } catch(e) {
      return MOCK_REELS;
    }
  },
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type) {
  type = type || 'info';
  var bg = { success:'#10B981', error:'#EF4444', warning:'#F59E0B', info:'#0284C7' };

  var t = document.createElement('div');
  t.style.cssText = [
    'position:fixed','top:20px','left:50%','transform:translateX(-50%) translateY(0)',
    'background:' + (bg[type] || bg.info),
    'color:#fff','font-family:DM Sans,sans-serif','font-weight:600','font-size:14px',
    'padding:12px 20px','border-radius:14px','box-shadow:0 8px 32px rgba(0,0,0,.35)',
    'z-index:9999','max-width:320px','text-align:center','pointer-events:none',
    'transition:opacity .3s,transform .3s',
  ].join(';');
  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(function(){ t.remove(); }, 350);
  }, 3000);
}

// ============================================================
// DEMO DATA SEEDER (Admin Panel only)
// ============================================================
var DemoSeeder = {
  seed: function() {
    var existing = JSON.parse(localStorage.getItem('pwv_pending') || '[]');
    if (existing.length > 0) return;

    var demo = [
      { id:'PAY001', name:'Arjun Mehta',  phone:'9876543210', email:'arjun@example.com', courseId:'c1', courseName:'JEE Physics Foundation', remark:'PhysicsCourse_ArjunMehta',  ts:Date.now()-3600000,  verified:false, accessGranted:false, amount:2499 },
      { id:'PAY002', name:'Priya Sharma', phone:'9123456789', email:'priya@example.com', courseId:'c2', courseName:'JEE Physics Advanced',   remark:'PhysicsCourse_PriyaSharma', ts:Date.now()-7200000,  verified:true,  accessGranted:false, amount:2499 },
      { id:'PAY003', name:'Rahul Gupta',  phone:'9988776655', email:'rahul@example.com', courseId:'c1', courseName:'JEE Physics Foundation', remark:'PhysicsCourse_RahulGupta',  ts:Date.now()-86400000, verified:true,  accessGranted:true,  amount:2499 },
    ];
    localStorage.setItem('pwv_pending', JSON.stringify(demo));

    var users = [
      { name:'Arjun Mehta',  phone:'9876543210', email:'arjun@example.com', class:'11' },
      { name:'Priya Sharma', phone:'9123456789', email:'priya@example.com', class:'12' },
      { name:'Rahul Gupta',  phone:'9988776655', email:'rahul@example.com', class:'11' },
    ];
    localStorage.setItem('pwv_all_users', JSON.stringify(users));
  },

  clear: function() {
    ['pwv_pending','pwv_all_users','pwv_user','pwv_purchases','pwv_prefs'].forEach(function(k){
      localStorage.removeItem(k);
    });
    showToast('Demo data cleared', 'info');
    setTimeout(function(){ location.reload(); }, 800);
  },
};

// Auto-seed on load (only populates if empty)
DemoSeeder.seed();
