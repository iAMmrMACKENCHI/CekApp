// ── CONFIG ──────────────────────────────────────────────────────
const SHEET_ID       = "1pn5whB6n41UW2WWdISLsTxBiTyDwFg6hh4eYgQx2dug";
const SHEET_USERS    = "Users";
const SHEET_PAYMENTS = "Payments";
const SHEET_REELS    = "Reels_Data";
const ADMIN_SECRET   = "YOUR_SECRET_HERE";

// ── RESPOND HELPER  ← THIS IS WHAT YOU ARE MISSING ──────────────
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET SPREADSHEET ──────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = {
      [SHEET_USERS]:    ["Name", "Phone", "Email", "Class", "Created_at"],
      [SHEET_PAYMENTS]: ["Timestamp", "Name", "Phone", "Email", "UPI_Remark", "Course_ID", "Course_Name", "Amount", "Verified", "Access_Given"],
      [SHEET_REELS]:    ["ID", "Topic", "Class", "Tags", "Difficulty", "Video_URL"],
    };
    if (headers[name]) {
      sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    }
  }
  return sheet;
}

// ── MAIN ROUTER ──────────────────────────────────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    switch (action) {
      case "signup":   return respond(handleSignup(body));
      case "payment":  return respond(handlePayment(body));
      case "getReels": return respond(handleGetReels());
      default:         return respond({ status: "error", message: "Unknown action" });
    }
  } catch (err) {
    return respond({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const secret = e.parameter.secret;
    const data   = e.parameter.data ? JSON.parse(e.parameter.data) : {};

    switch (action) {
      case "signup":   return respond(handleSignup(data));
      case "payment":  return respond(handlePayment(data));
      case "getReels": return respond(handleGetReels());
      case "getPayments":
        if (secret !== ADMIN_SECRET) return respond({ status: "error", message: "Unauthorized" });
        return respond(handleGetPayments());
      default:
        return respond({ status: "ok", message: "API running" });
    }
  } catch (err) {
    return respond({ status: "error", message: err.toString() });
  }
}

// ── SIGNUP HANDLER ───────────────────────────────────────────────
function handleSignup(body) {
  const { name, phone, email, class: cls } = body;
  if (!name || !phone || !email) return { status: "error", message: "Missing fields" };
  if (!/^\d{10}$/.test(phone))   return { status: "error", message: "Invalid phone" };

  const sheet = getSheet(SHEET_USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === phone) return { status: "exists", message: "Already registered" };
  }
  sheet.appendRow([sanitize(name), sanitize(phone), sanitize(email), sanitize(cls||""), new Date().toISOString()]);
  return { status: "ok", message: "Registered successfully" };
}

// ── PAYMENT HANDLER ──────────────────────────────────────────────
function handlePayment(body) {
  const { name, phone, email, remark, courseId, courseName, amount, timestamp } = body;
  if (!name || !phone || !email || !remark) return { status: "error", message: "Missing fields" };

  const sheet = getSheet(SHEET_PAYMENTS);
  sheet.appendRow([
    timestamp || new Date().toISOString(),
    sanitize(name), sanitize(phone), sanitize(email), sanitize(remark),
    sanitize(courseId||""), sanitize(courseName||""), amount||0, "NO", "NO"
  ]);
  return { status: "ok", message: "Payment recorded" };
}

// ── REELS HANDLER ────────────────────────────────────────────────
function handleGetReels() {
  const sheet = getSheet(SHEET_REELS);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: "ok", reels: [] };

  const headers = data[0].map(h => h.toString().toLowerCase().replace(/\s+/g,"_"));
  const reels = data.slice(1).filter(row => row[0]).map(row => {
    const obj = {};
    headers.forEach((h,i) => { obj[h] = row[i] || ""; });
    return { id:String(obj.id||""), topic:String(obj.topic||""), class:String(obj.class||""), tags:String(obj.tags||""), difficulty:String(obj.difficulty||"Medium"), videoUrl:String(obj.video_url||"") };
  });
  return { status: "ok", reels };
}

// ── GET PAYMENTS HANDLER ─────────────────────────────────────────
function handleGetPayments() {
  const sheet = getSheet(SHEET_PAYMENTS);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: "ok", payments: [] };
  const headers  = data[0];
  const payments = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h,i) => { obj[h] = row[i]; });
    return obj;
  });
  return { status: "ok", payments };
}

// ── SANITIZE ─────────────────────────────────────────────────────
function sanitize(input) {
  if (typeof input !== "string") return String(input||"");
  return input.replace(/^[=+\-@]/,"'").trim().substring(0,500);
}
