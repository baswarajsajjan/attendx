// ===========================
//  AttendX – App Logic
// ===========================

// ---- STATE ----
let currentUser = null;
let clockedIn = false;
let clockInTime = null;
let clockTimerInterval = null;
let faceVerified = false;
let userLocation = null;
let clockLocation = null;

// ---- SAMPLE DATA ----
const employees = [
  { id: 'EMP001', name: 'John Doe', dept: 'Engineering', shift: '9AM-6PM', status: 'Present', pass: '1234', ctc: 60000 },
  { id: 'EMP002', name: 'Priya Sharma', dept: 'HR', shift: '9AM-6PM', status: 'Present', pass: '1234', ctc: 50000 },
  { id: 'EMP003', name: 'Rahul Mehta', dept: 'Finance', shift: '9AM-6PM', status: 'Absent', pass: '1234', ctc: 55000 },
  { id: 'EMP004', name: 'Anita Singh', dept: 'Sales', shift: '8AM-5PM', status: 'On Leave', pass: '1234', ctc: 45000 },
  { id: 'EMP005', name: 'Vikram Nair', dept: 'Engineering', shift: '2PM-11PM', status: 'Present', pass: '1234', ctc: 70000 },
];

const attendanceData = [
  { date: '2025-05-01', day: 'Thu', in: '09:02', out: '18:15', hours: '9h 13m', status: 'Present', loc: 'Office' },
  { date: '2025-05-02', day: 'Fri', in: '09:30', out: '18:00', hours: '8h 30m', status: 'Late', loc: 'Office' },
  { date: '2025-05-03', day: 'Sat', in: '--', out: '--', hours: '--', status: 'Weekend', loc: '--' },
  { date: '2025-05-04', day: 'Sun', in: '--', out: '--', hours: '--', status: 'Weekend', loc: '--' },
  { date: '2025-05-05', day: 'Mon', in: '08:55', out: '20:30', hours: '11h 35m', status: 'Overtime', loc: 'Office' },
  { date: '2025-05-06', day: 'Tue', in: '--', out: '--', hours: '--', status: 'Absent', loc: '--' },
  { date: '2025-05-07', day: 'Wed', in: '09:00', out: '18:00', hours: '9h 00m', status: 'Present', loc: 'WFH' },
  { date: '2025-05-08', day: 'Thu', in: '09:05', out: '18:10', hours: '9h 05m', status: 'Present', loc: 'Office' },
  { date: '2025-05-09', day: 'Fri', in: '09:10', out: '18:05', hours: '8h 55m', status: 'Present', loc: 'Office' },
  { date: '2025-05-12', day: 'Mon', in: '--', out: '--', hours: '--', status: 'Leave', loc: '--' },
];

const leaveHistory = [
  { type: 'Casual Leave', from: '2025-05-12', to: '2025-05-12', days: 1, status: 'Approved', reason: 'Personal work' },
  { type: 'Sick Leave', from: '2025-04-10', to: '2025-04-11', days: 2, status: 'Approved', reason: 'Fever' },
  { type: 'Earned Leave', from: '2025-03-20', to: '2025-03-22', days: 3, status: 'Rejected', reason: 'Vacation' },
];

const overtimeData = [
  { date: '2025-05-05', checkout: '20:30', hours: 2.5, status: 'Approved', earn: '₹ 500' },
  { date: '2025-04-28', checkout: '21:00', hours: 2.0, status: 'Approved', earn: '₹ 400' },
];

const lopData = [
  { month: 'May 2025', days: 1, reason: 'Absent without leave', deduct: '₹ 2,308' },
  { month: 'March 2025', days: 1, reason: 'Unauthorized absence', deduct: '₹ 2,308' },
];

const leaveRequests = [
  { emp: 'Priya Sharma', id: 'EMP002', type: 'Sick Leave', from: '2025-05-20', to: '2025-05-21', reason: 'Not feeling well', status: 'Pending' },
  { emp: 'Rahul Mehta', id: 'EMP003', type: 'Earned Leave', from: '2025-05-25', to: '2025-05-27', reason: 'Family function', status: 'Pending' },
  { emp: 'Anita Singh', id: 'EMP004', type: 'Casual Leave', from: '2025-05-30', to: '2025-05-30', reason: 'Personal work', status: 'Approved' },
];

const otRequests = [
  { emp: 'Vikram Nair', id: 'EMP005', date: '2025-05-15', hours: 3, reason: 'Project deadline', status: 'Pending' },
  { emp: 'John Doe', id: 'EMP001', date: '2025-05-20', hours: 2, reason: 'Client demo prep', status: 'Approved' },
];

// ===========================
//  LOGIN
// ===========================
function switchLoginTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('employeeLoginTab').style.display = tab === 'employee' ? 'block' : 'none';
  document.getElementById('adminLoginTab').style.display = tab === 'admin' ? 'block' : 'none';
}

function employeeLogin() {
  const id = document.getElementById('empId').value.trim();
  const pass = document.getElementById('empPass').value.trim();
  const emp = employees.find(e => e.id === id && e.pass === pass);
  if (!emp) return showToast('Invalid Employee ID or Password', 'error');
  currentUser = emp;
  showPage('employeePage');
  initEmployeeDashboard();
  showToast('Welcome back, ' + emp.name.split(' ')[0] + '! 👋', 'success');
}

function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if (email === 'admin@company.com' && pass === 'admin123') {
    currentUser = { name: 'Admin', role: 'admin' };
    showPage('adminPage');
    initAdminDashboard();
    showToast('Welcome, Admin! 🛡️', 'success');
  } else {
    showToast('Invalid admin credentials', 'error');
  }
}

function logout() {
  currentUser = null; clockedIn = false; faceVerified = false;
  if (clockTimerInterval) clearInterval(clockTimerInterval);
  showPage('loginPage');
  showToast('Logged out successfully', 'info');
}

// ===========================
//  CAMERA / FACE
// ===========================
async function startFaceScan() {
  const circle = document.getElementById('faceCircle');
  const video = document.getElementById('videoFeed');
  circle.classList.add('scanning');
  circle.querySelector('.face-label').textContent = 'Scanning...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream; video.style.display = 'block';
    setTimeout(() => {
      stream.getTracks().forEach(t => t.stop());
      video.style.display = 'none';
      circle.querySelector('.face-icon').textContent = '✅';
      circle.querySelector('.face-label').textContent = 'Face Verified!';
      circle.style.borderColor = 'var(--green)';
      faceVerified = true;
      showToast('Face verified successfully!', 'success');
    }, 3000);
  } catch (e) {
    circle.classList.remove('scanning');
    circle.querySelector('.face-label').textContent = 'Camera unavailable — use ID login';
    faceVerified = true; // fallback for demo
  }
}

async function startVerifyFace() {
  const circle = document.getElementById('faceVerifyCircle');
  const video = document.getElementById('verifyVideo');
  circle.querySelector('.fv-label').textContent = 'Scanning face...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream; video.style.display = 'block';
    circle.style.display = 'none';
    setTimeout(() => {
      stream.getTracks().forEach(t => t.stop());
      video.style.display = 'none';
      circle.style.display = 'flex';
      circle.classList.add('verified');
      circle.querySelector('.fv-icon').textContent = '✅';
      circle.querySelector('.fv-label').textContent = 'Face Verified!';
      faceVerified = true;
      showToast('Face verified! You can now clock in.', 'success');
    }, 3000);
  } catch (e) {
    faceVerified = true;
    circle.classList.add('verified');
    circle.querySelector('.fv-icon').textContent = '✅';
    circle.querySelector('.fv-label').textContent = 'Verified (Demo Mode)';
    showToast('Face verified (demo mode)', 'info');
  }
}

// ===========================
//  LOCATION
// ===========================
function getLocation() {
  const dot = document.querySelector('#locationStatus .loc-dot');
  const text = document.getElementById('locText');
  text.textContent = 'Getting location...';
  if (!navigator.geolocation) {
    text.textContent = 'Geolocation not supported'; return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    dot.classList.add('active');
    text.textContent = `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)} — Verified`;
    showToast('Location captured!', 'success');
  }, () => {
    // Demo fallback
    userLocation = { lat: 17.3850, lng: 78.4867 };
    dot.classList.add('active');
    text.textContent = '📍 17.3850, 78.4867 — Demo Location';
    showToast('Using demo location (Hyderabad)', 'info');
  });
}

function getClockLocation() {
  const el = document.getElementById('clockLocation');
  el.textContent = 'Getting location...';
  navigator.geolocation.getCurrentPosition(pos => {
    clockLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    el.textContent = `📍 ${clockLocation.lat.toFixed(4)}, ${clockLocation.lng.toFixed(4)} ✅`;
    showToast('Location captured for clock in!', 'success');
  }, () => {
    clockLocation = { lat: 17.3850, lng: 78.4867 };
    el.textContent = '📍 17.3850, 78.4867 — Demo Location ✅';
    showToast('Using demo location', 'info');
  });
}

// ===========================
//  CLOCK IN / OUT
// ===========================
function clockIn() {
  if (!faceVerified) { showToast('Please verify your face first!', 'error'); return; }
  if (!clockLocation) { showToast('Please capture your location first!', 'error'); return; }
  clockedIn = true; clockInTime = new Date();
  document.getElementById('btnClockIn').disabled = true;
  document.getElementById('btnClockOut').disabled = false;
  const t = clockInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('todayIn').textContent = t;
  // Check late
  const hrs = clockInTime.getHours();
  const badge = document.getElementById('shiftStatus');
  if (hrs >= 9 && clockInTime.getMinutes() <= 15) {
    badge.textContent = 'On Time'; badge.className = 'badge-green';
  } else if (hrs >= 9) {
    badge.textContent = 'Late Arrival'; badge.className = 'badge-orange';
  }
  showToast(`Clocked in at ${t} 🟢`, 'success');
  // Store in localStorage
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('clockIn_' + today, JSON.stringify({ time: t, location: clockLocation }));
}

function clockOut() {
  if (!clockedIn) return;
  const outTime = new Date();
  const diff = outTime - clockInTime;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const t = outTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('todayOut').textContent = t;
  document.getElementById('todayHours').textContent = `${hrs}h ${mins}m`;
  document.getElementById('todayLocation').textContent = clockLocation ? `${clockLocation.lat.toFixed(4)}, ${clockLocation.lng.toFixed(4)}` : 'Recorded';
  document.getElementById('btnClockOut').disabled = true;
  document.getElementById('btnClockIn').disabled = false;
  clockedIn = false;
  // OT check
  if (hrs >= 9) {
    document.getElementById('shiftStatus').textContent = 'Overtime'; 
    document.getElementById('shiftStatus').className = 'badge-blue';
  }
  showToast(`Clocked out at ${t}. Total: ${hrs}h ${mins}m 🔴`, 'success');
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('clockOut_' + today, JSON.stringify({ time: t, hours: `${hrs}h ${mins}m` }));
}

// ===========================
//  BIG CLOCK
// ===========================
function startBigClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById('bigClock').textContent =
      now.toLocaleTimeString('en-IN', { hour12: false });
    document.getElementById('clockDateDisplay').textContent =
      now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, 1000);
}

// ===========================
//  EMPLOYEE DASHBOARD INIT
// ===========================
function initEmployeeDashboard() {
  startBigClock();
  setDates();
  renderMiniCalendar();
  renderActivityList();
  renderAttendanceTable();
  renderLeaveHistory();
  renderOvertimeTable();
  renderLOPTable();

  // Restore today's clock state
  const today = new Date().toISOString().split('T')[0];
  const savedIn = localStorage.getItem('clockIn_' + today);
  const savedOut = localStorage.getItem('clockOut_' + today);
  if (savedIn) {
    const d = JSON.parse(savedIn);
    document.getElementById('todayIn').textContent = d.time;
    document.getElementById('btnClockIn').disabled = true;
    document.getElementById('btnClockOut').disabled = false;
    clockedIn = true;
    faceVerified = true; clockLocation = d.location;
  }
  if (savedOut) {
    const d = JSON.parse(savedOut);
    document.getElementById('todayOut').textContent = d.time;
    document.getElementById('todayHours').textContent = d.hours;
    document.getElementById('btnClockOut').disabled = true;
    document.getElementById('btnClockIn').disabled = false;
    clockedIn = false;
  }
}

function setDates() {
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('empGreeting').textContent = `${greet}, ${currentUser.name.split(' ')[0]}! 👋`;
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('empDate').textContent = now.toLocaleDateString('en-IN', opts);
}

function renderMiniCalendar() {
  const cal = document.getElementById('miniCalendar');
  const days = ['S','M','T','W','T','F','S'];
  cal.innerHTML = days.map(d => `<div class="cal-day header">${d}</div>`).join('');
  const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const statusMap = {1:'present',2:'present',5:'present',6:'leave',7:'present',8:'present',9:'present',12:'leave',13:'absent',14:'present',15:'present'};
  for (let i = 0; i < first; i++) cal.innerHTML += `<div class="cal-day"></div>`;
  for (let d = 1; d <= total; d++) {
    const dow = (first + d - 1) % 7;
    const isToday = d === now.getDate();
    const isWeekend = dow === 0 || dow === 6;
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    else if (isWeekend) cls += ' weekend';
    else if (statusMap[d]) cls += ' ' + statusMap[d];
    cal.innerHTML += `<div class="${cls}">${d}</div>`;
  }
}

function renderActivityList() {
  const list = document.getElementById('activityList');
  const items = [
    { dot: 'var(--green)', title: 'Clocked In', sub: 'Office — 17.3850, 78.4867', time: '09:02 AM' },
    { dot: 'var(--blue)', title: 'Leave Approved', sub: 'Casual Leave on May 12', time: 'Yesterday' },
    { dot: 'var(--purple)', title: 'Overtime Recorded', sub: '2.5 hours on May 5', time: '3 days ago' },
    { dot: 'var(--orange)', title: 'Late Arrival Flagged', sub: 'Arrived at 09:30 (May 2)', time: '4 days ago' },
  ];
  list.innerHTML = items.map(i => `
    <div class="activity-item">
      <div class="act-dot" style="background:${i.dot}"></div>
      <div class="act-info"><div class="act-title">${i.title}</div><div class="act-sub">${i.sub}</div></div>
      <div class="act-time">${i.time}</div>
    </div>`).join('');
}

function renderAttendanceTable() {
  const body = document.getElementById('attendanceBody');
  body.innerHTML = attendanceData.map(r => `
    <tr>
      <td>${r.date}</td><td>${r.day}</td>
      <td>${r.in}</td><td>${r.out}</td><td>${r.hours}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text2);font-size:0.82rem">${r.loc}</td>
    </tr>`).join('');
}

function renderLeaveHistory() {
  const list = document.getElementById('leaveHistory');
  list.innerHTML = leaveHistory.map(l => `
    <div class="leave-item">
      <div class="leave-item-info">
        <div class="leave-item-title">${l.type}</div>
        <div class="leave-item-sub">${l.from} → ${l.to} · ${l.days} day(s) · ${l.reason}</div>
      </div>
      ${statusBadge(l.status)}
    </div>`).join('');
}

function renderOvertimeTable() {
  const body = document.getElementById('overtimeBody');
  body.innerHTML = overtimeData.map(r => `
    <tr><td>${r.date}</td><td>${r.checkout}</td><td>${r.hours}h</td><td>${statusBadge(r.status)}</td><td style="color:var(--green)">${r.earn}</td></tr>`).join('');
}

function renderLOPTable() {
  const body = document.getElementById('lopBody');
  body.innerHTML = lopData.map(r => `
    <tr><td>${r.month}</td><td style="color:var(--red)">${r.days}</td><td style="color:var(--text2)">${r.reason}</td><td style="color:var(--red)">${r.deduct}</td></tr>`).join('');
}

function applyLeave() {
  const type = document.getElementById('leaveType').value;
  const from = document.getElementById('leaveFrom').value;
  const to = document.getElementById('leaveTo').value;
  const reason = document.getElementById('leaveReason').value;
  if (!from || !to || !reason) { showToast('Please fill all fields!', 'error'); return; }
  leaveHistory.unshift({ type, from, to, days: 1, status: 'Pending', reason });
  renderLeaveHistory();
  document.getElementById('leaveFrom').value = '';
  document.getElementById('leaveTo').value = '';
  document.getElementById('leaveReason').value = '';
  showToast('Leave request submitted! ✅', 'success');
}

function requestOT() {
  const date = document.getElementById('otDate').value;
  const hours = document.getElementById('otHours').value;
  const reason = document.getElementById('otReason').value;
  if (!date || !hours || !reason) { showToast('Please fill all fields!', 'error'); return; }
  showToast('Overtime request submitted for approval! ⚡', 'success');
  document.getElementById('otDate').value = '';
  document.getElementById('otHours').value = '';
  document.getElementById('otReason').value = '';
}

// ===========================
//  TAB NAVIGATION
// ===========================
function showEmpTab(tab) {
  document.querySelectorAll('#employeePage .tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#employeePage .nav-item').forEach(i => i.classList.remove('active'));
  const tabMap = { dashboard: 'empDashboard', clockin: 'empClockin', attendance: 'empAttendance', leaves: 'empLeaves', overtime: 'empOvertime', lop: 'empLop', profile: 'empProfile' };
  document.getElementById(tabMap[tab]).classList.add('active');
  event.currentTarget.classList.add('active');
}

function showAdminTab(tab) {
  document.querySelectorAll('#adminPage .tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#adminPage .nav-item').forEach(i => i.classList.remove('active'));
  const tabMap = { overview: 'adminOverview', employees: 'adminEmployees', attendance: 'adminAttendance', leaves: 'adminLeaves', overtime: 'adminOvertime', lop: 'adminLop', reports: 'adminReports', settings: 'adminSettings' };
  document.getElementById(tabMap[tab]).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ===========================
//  ADMIN DASHBOARD INIT
// ===========================
function initAdminDashboard() {
  const now = new Date();
  document.getElementById('adminDate').textContent = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  renderLiveFeed();
  renderPendingApprovals();
  renderDeptBars();
  renderEmployeeTable();
  renderAdminAttendance();
  renderAdminLeaves();
  renderAdminOT();
  renderAdminLOP();
}

function renderLiveFeed() {
  const feed = document.getElementById('liveFeed');
  const items = [
    { init: 'JD', name: 'John Doe', action: 'Clocked In', time: '09:02 AM', color: '#10b981' },
    { init: 'PS', name: 'Priya Sharma', action: 'Clocked In', time: '09:05 AM', color: '#3b82f6' },
    { init: 'VN', name: 'Vikram Nair', action: 'Clocked In', time: '09:10 AM', color: '#8b5cf6' },
    { init: 'AS', name: 'Anita Singh', action: 'On Leave', time: 'All Day', color: '#f59e0b' },
    { init: 'RM', name: 'Rahul Mehta', action: 'Absent', time: 'Not Clocked', color: '#ef4444' },
  ];
  feed.innerHTML = items.map(i => `
    <div class="feed-item">
      <div class="feed-avatar" style="background:${i.color}">${i.init}</div>
      <div class="feed-info"><div>${i.name}</div><div style="color:var(--text2);font-size:0.78rem">${i.action}</div></div>
      <div class="feed-time">${i.time}</div>
    </div>`).join('');
}

function renderPendingApprovals() {
  const list = document.getElementById('pendingApprovals');
  const pending = leaveRequests.filter(l => l.status === 'Pending');
  list.innerHTML = pending.map((l, i) => `
    <div class="approval-item">
      <h4>${l.emp} — ${l.type}</h4>
      <p>${l.from} → ${l.to} · "${l.reason}"</p>
      <div class="lr-actions">
        <button class="btn-approve" onclick="quickApprove(${i},'leave')">✓ Approve</button>
        <button class="btn-reject" onclick="quickReject(${i},'leave')">✗ Reject</button>
      </div>
    </div>`).join('') || '<p style="color:var(--text2);font-size:0.85rem">No pending approvals 🎉</p>';
}

function quickApprove(i, type) {
  if (type === 'leave') { leaveRequests[i].status = 'Approved'; renderAdminLeaves(); renderPendingApprovals(); }
  showToast('Request approved ✅', 'success');
}
function quickReject(i, type) {
  if (type === 'leave') { leaveRequests[i].status = 'Rejected'; renderAdminLeaves(); renderPendingApprovals(); }
  showToast('Request rejected ❌', 'info');
}

function renderDeptBars() {
  const depts = [
    { name: 'Engineering', pct: 92 }, { name: 'HR', pct: 80 }, { name: 'Finance', pct: 75 }, { name: 'Sales', pct: 88 }
  ];
  document.getElementById('deptBars').innerHTML = depts.map(d => `
    <div class="dept-bar-row">
      <div class="dept-name">${d.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${d.pct}%"></div></div>
      <div class="dept-pct">${d.pct}%</div>
    </div>`).join('');
}

function renderEmployeeTable() {
  document.getElementById('employeeTableBody').innerHTML = employees.map(e => `
    <tr>
      <td style="font-family:monospace;color:var(--accent2)">${e.id}</td>
      <td><b>${e.name}</b></td>
      <td style="color:var(--text2)">${e.dept}</td>
      <td style="color:var(--text2)">${e.shift}</td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <button class="btn-outline" style="padding:0.3rem 0.75rem;font-size:0.8rem" onclick="alert('Edit ${e.name}')">Edit</button>
        <button class="btn-reject" style="margin-left:0.4rem;border-radius:6px" onclick="alert('Remove ${e.name}?')">Remove</button>
      </td>
    </tr>`).join('');
}

function filterEmployees() {
  const search = document.getElementById('empSearch').value.toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  const filtered = employees.filter(e =>
    (e.name.toLowerCase().includes(search) || e.id.toLowerCase().includes(search)) &&
    (!dept || e.dept === dept)
  );
  document.getElementById('employeeTableBody').innerHTML = filtered.map(e => `
    <tr>
      <td style="font-family:monospace;color:var(--accent2)">${e.id}</td>
      <td><b>${e.name}</b></td>
      <td style="color:var(--text2)">${e.dept}</td>
      <td style="color:var(--text2)">${e.shift}</td>
      <td>${statusBadge(e.status)}</td>
      <td><button class="btn-outline" style="padding:0.3rem 0.75rem;font-size:0.8rem">Edit</button></td>
    </tr>`).join('');
}

function renderAdminAttendance() {
  const all = [];
  employees.forEach(e => {
    attendanceData.slice(0, 5).forEach(r => {
      all.push({ empId: e.id, name: e.name, ...r });
    });
  });
  document.getElementById('adminAttBody').innerHTML = all.slice(0, 15).map(r => `
    <tr>
      <td style="font-family:monospace;color:var(--accent2);font-size:0.82rem">${r.empId}</td>
      <td><b style="font-size:0.88rem">${r.name}</b></td>
      <td style="color:var(--text2)">${r.date}</td>
      <td style="color:var(--green)">${r.in}</td>
      <td style="color:var(--red)">${r.out}</td>
      <td>${r.hours}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text2);font-size:0.8rem">${r.loc}</td>
      <td><button class="btn-outline" style="padding:0.25rem 0.6rem;font-size:0.78rem" onclick="alert('Edit record')">Edit</button></td>
    </tr>`).join('');
}

function renderAdminLeaves() {
  const filter = document.getElementById('leaveStatusFilter') ? document.getElementById('leaveStatusFilter').value : 'All';
  const filtered = filter === 'All' ? leaveRequests : leaveRequests.filter(l => l.status === filter);
  document.getElementById('leaveRequestsList').innerHTML = filtered.map((l, i) => `
    <div class="leave-req-card">
      <div class="lr-info">
        <h4>${l.emp} <span style="color:var(--text2);font-size:0.82rem">(${l.id})</span></h4>
        <p><b>${l.type}</b> · ${l.from} → ${l.to} · Reason: ${l.reason}</p>
      </div>
      <div class="lr-actions">
        ${l.status === 'Pending' ? `
          <button class="btn-approve" onclick="quickApprove(${i},'leave')">✓ Approve</button>
          <button class="btn-reject" onclick="quickReject(${i},'leave')">✗ Reject</button>
        ` : statusBadge(l.status)}
      </div>
    </div>`).join('');
}

function filterLeaves() { renderAdminLeaves(); }

function renderAdminOT() {
  document.getElementById('otRequestsList').innerHTML = otRequests.map((o, i) => `
    <div class="leave-req-card">
      <div class="lr-info">
        <h4>${o.emp} <span style="color:var(--text2);font-size:0.82rem">(${o.id})</span></h4>
        <p><b>${o.date}</b> · ${o.hours}h OT · Reason: ${o.reason}</p>
      </div>
      <div class="lr-actions">
        ${o.status === 'Pending' ? `
          <button class="btn-approve" onclick="approveOT(${i})">✓ Approve</button>
          <button class="btn-reject" onclick="rejectOT(${i})">✗ Reject</button>
        ` : statusBadge(o.status)}
      </div>
    </div>`).join('');
}

function approveOT(i) { otRequests[i].status = 'Approved'; renderAdminOT(); showToast('OT approved ✅', 'success'); }
function rejectOT(i) { otRequests[i].status = 'Rejected'; renderAdminOT(); showToast('OT rejected', 'info'); }

function renderAdminLOP() {
  const rows = [];
  employees.forEach(e => {
    lopData.forEach(l => rows.push({ ...l, empId: e.id, name: e.name }));
  });
  document.getElementById('adminLopBody').innerHTML = rows.slice(0, 8).map(r => `
    <tr>
      <td style="font-family:monospace;color:var(--accent2)">${r.empId}</td>
      <td>${r.name}</td>
      <td>${r.month}</td>
      <td style="color:var(--red)">${r.days}</td>
      <td style="color:var(--red)">${r.deduct}</td>
      <td><button class="btn-outline" style="padding:0.25rem 0.6rem;font-size:0.78rem" onclick="alert('Waive LOP?')">Waive</button></td>
    </tr>`).join('');
}

// ===========================
//  ADD EMPLOYEE
// ===========================
function openAddEmployee() { document.getElementById('addEmpModal').style.display = 'flex'; }
function closeModal() { document.getElementById('addEmpModal').style.display = 'none'; }

function addEmployee() {
  const name = document.getElementById('newEmpName').value.trim();
  const id = document.getElementById('newEmpID').value.trim();
  const dept = document.getElementById('newEmpDept').value;
  const shift = document.getElementById('newEmpShift').value;
  if (!name || !id) { showToast('Please fill Name and ID!', 'error'); return; }
  employees.push({ id, name, dept, shift, status: 'Present', pass: '1234', ctc: parseInt(document.getElementById('newEmpCTC').value) || 50000 });
  renderEmployeeTable();
  closeModal();
  showToast(`Employee ${name} added successfully! ✅`, 'success');
}

// ===========================
//  EXPORT CSV
// ===========================
function exportCSV() {
  const rows = [['EmpID','Name','Date','CheckIn','CheckOut','Hours','Status']];
  employees.forEach(e => {
    attendanceData.forEach(r => rows.push([e.id, e.name, r.date, r.in, r.out, r.hours, r.status]));
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  showToast('CSV exported successfully! ⬇️', 'success');
}

// ===========================
//  HELPERS
// ===========================
function statusBadge(status) {
  const map = {
    'Present': 'badge-green', 'On Time': 'badge-green', 'Approved': 'badge-green',
    'Absent': 'badge-red', 'Rejected': 'badge-red',
    'Late': 'badge-orange', 'Pending': 'badge-orange', 'On Leave': 'badge-orange',
    'Overtime': 'badge-blue', 'WFH': 'badge-blue',
    'Weekend': '', 'Leave': 'badge-blue'
  };
  const cls = map[status] || '';
  return `<span class="${cls}" style="${!cls ? 'color:var(--text2);font-size:0.82rem' : ''}">${status}</span>`;
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===========================
//  INIT
// ===========================
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // Set today's date defaults for leave/OT inputs
  const todayISO = new Date().toISOString().split('T')[0];
  if (document.getElementById('leaveFrom')) document.getElementById('leaveFrom').value = todayISO;
  if (document.getElementById('leaveTo')) document.getElementById('leaveTo').value = todayISO;
  if (document.getElementById('otDate')) document.getElementById('otDate').value = todayISO;
});
