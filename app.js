// Giao lưu cầu lông cuối tuần — Tên miền nội bộ chuẩn Việt Nam: giaoluucaulong.vn
// Real-time Cross-Browser Synchronization Engine (Chrome, Edge, Firefox, Safari, Brave, Cốc Cốc, Mobile)

const STORAGE_KEY = 'giaoluucaulong_vn_state_v5';
const SYNC_CHANNEL_NAME = 'giaoluucaulong_vn_sync_v5';
const CLOUD_DB_TOPIC = 'https://ntfy.sh/giaoluucaulongcuoituan_db_v1';

// Always connect to the central local sync server even if opened via file:// or custom domain
const API_BASE = window.location.protocol.startsWith('http')
  ? window.location.origin
  : 'http://127.0.0.1:8686';

const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;

// Safe cross-browser native date picker opener
function openNativeDatePicker(inputEl) {
  if (!inputEl) return;
  try {
    if (typeof inputEl.showPicker === 'function') {
      inputEl.showPicker();
    }
  } catch (err) {
    // Ignore NotAllowedError on browsers that auto-open on click
  }
}

// Format YYYY-MM-DD from <input type="date"> into Vietnamese label (e.g. "Thứ 7 · 14/11/2026")
function formatISOToVietnameseDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return 'Thứ 7 · 14/11/2026';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return isoStr;

  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayLabel = dayNames[dateObj.getDay()];
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dayLabel} · ${dd}/${mm}/${year}`;
}

// Compute upcoming Saturday (6) or Sunday (0) in YYYY-MM-DD
function getUpcomingDayISO(targetDayOfWeek) {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = (targetDayOfWeek - currentDay + 7) % 7;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Default initial state (_rev: 0 so server state with _rev >= 1 always wins)
function getDefaultState() {
  const defaultISO = '2026-11-14';
  return {
    _rev: 0,
    _updatedAt: 0,
    settings: {
      clubName: 'Giao lưu cầu lông cuối tuần',
      domainName: 'giaoluucaulong.vn',
      sessionDateISO: defaultISO,
      sessionDate: formatISOToVietnameseDate(defaultISO),
      sessionTime: '19:00 - 21:00',
      courtLocation: 'Sân Cầu Lông Phú Thọ (Sân 1, 2, 3)',
      maxPlayers: 16
    },
    members: [
      { id: 'm1', name: 'Minh Tuấn', gender: 'M', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: 'Đánh chính Đôi Nam & Nam Nữ' },
      { id: 'm2', name: 'Hoàng Long', gender: 'M', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: 'Chủ lực Sân 1' },
      { id: 'm3', name: 'Đức Anh', gender: 'M', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: 'Đúng giờ 19:00' },
      { id: 'm4', name: 'Quốc Bảo', gender: 'M', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm5', name: 'Văn Hùng', gender: 'M', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 50000, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: 'Mới chuyển 50k, còn nợ 30k' },
      { id: 'm6', name: 'Thanh Tùng', gender: 'M', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm7', name: 'Gia Huy', gender: 'M', skill: 'C', type: 'guest', extraFee: 10000, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: 'Thuê 1 quấn cán (+10k)' },
      { id: 'm8', name: 'Hải Nam', gender: 'M', skill: 'A', type: 'guest', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: 'Khách mời giao lưu' },
      { id: 'm9', name: 'Thu Trang', gender: 'F', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: 'Đôi Nữ & Đôi Nam Nữ' },
      { id: 'm10', name: 'Ngọc Lan', gender: 'F', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 80000, paid: true, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm11', name: 'Bảo Ngọc', gender: 'F', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 40000, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: 'Đã trả 40k tiền mặt' },
      { id: 'm12', name: 'Khánh Linh', gender: 'F', skill: 'C', type: 'guest', extraFee: 0, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: 'Vãng lai tuần này' }
    ],
    costs: {
      courtsCount: 3,
      courtHours: 2,
      courtRate: 90000,
      shuttleCount: 12,
      shuttlePrice: 25000,
      extraExpenses: [
        { id: 'ex1', name: 'Trà đá & Nước suối cả đội', amount: 80000 },
        { id: 'ex2', name: 'Phí gửi xe & vệ sinh sân', amount: 40000 }
      ],
      splitMode: 'equal',
      roundThousand: true
    },
    matches: [
      { id: 'T1', round: 'Vòng 1', court: 'Sân 1', category: 'MD', teamA: ['m1', 'm3'], teamB: ['m2', 'm4'], scoreA: 21, scoreB: 17, status: 'done' },
      { id: 'T2', round: 'Vòng 1', court: 'Sân 2', category: 'WD', teamA: ['m9', 'm12'], teamB: ['m10', 'm11'], scoreA: 21, scoreB: 19, status: 'done' },
      { id: 'T3', round: 'Vòng 1', court: 'Sân 3', category: 'MD', teamA: ['m8', 'm7'], teamB: ['m5', 'm6'], scoreA: 22, scoreB: 20, status: 'done' },
      { id: 'T4', round: 'Vòng 2', court: 'Sân 1', category: 'XD', teamA: ['m1', 'm10'], teamB: ['m2', 'm9'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T5', round: 'Vòng 2', court: 'Sân 2', category: 'XD', teamA: ['m3', 'm11'], teamB: ['m4', 'm12'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T6', round: 'Vòng 2', court: 'Sân 3', category: 'MD', teamA: ['m1', 'm5'], teamB: ['m8', 'm6'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T7', round: 'Vòng 3', court: 'Sân 1', category: 'MD', teamA: ['m2', 'm7'], teamB: ['m3', 'm5'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T8', round: 'Vòng 3', court: 'Sân 2', category: 'XD', teamA: ['m8', 'm11'], teamB: ['m6', 'm9'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T9', round: 'Vòng 3', court: 'Sân 3', category: 'WD', teamA: ['m9', 'm10'], teamB: ['m11', 'm12'], scoreA: null, scoreB: null, status: 'upcoming' }
    ]
  };
}

let state = loadState();
let currentTab = 'overview';
let currentMatchFilter = 'ALL';
let currentHeroSlide = 0;
let heroAutoplayInterval = null;
let isHeroPlaying = true;
let isSyncingServer = false;

function isAdmin() {
  return window.PAGE_ROLE === 'admin';
}

function syncMemberToSavedRoster(member, savedList) {
  if (!member || !member.name) return;
  const cleanName = member.name.trim();
  if (!cleanName) return;
  const idx = savedList.findIndex(
    s => s && s.name && s.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  const entry = {
    name: cleanName,
    gender: member.gender || 'M',
    skill: member.skill || 'B',
    type: member.type || 'fixed',
    note: member.note || ''
  };
  if (idx >= 0) {
    savedList[idx] = entry;
  } else {
    savedList.push(entry);
  }
}

function normalizeStateObject(parsed) {
  if (!parsed || !parsed.members || !parsed.costs || !parsed.matches) return null;
  if (!parsed.settings) parsed.settings = {};
  if (!parsed.settings.clubName || parsed.settings.clubName === 'MCGAAW') {
    parsed.settings.clubName = 'Giao lưu cầu lông cuối tuần';
  }
  if (!parsed.settings.domainName) {
    parsed.settings.domainName = 'giaoluucaulong.vn';
  }
  if (!parsed.settings.sessionDateISO) {
    parsed.settings.sessionDateISO = '2026-11-14';
    parsed.settings.sessionDate = formatISOToVietnameseDate('2026-11-14');
  }
  if (!Array.isArray(parsed.savedMembers)) {
    parsed.savedMembers = [];
  }
  parsed.members.forEach(m => {
    if (typeof m.amountPaid !== 'number') {
      m.amountPaid = m.paid ? 80000 : 0;
    }
    if (!m.playDate) {
      m.playDate = parsed.settings.sessionDate;
    }
    syncMemberToSavedRoster(m, parsed.savedMembers);
  });
  if (typeof parsed._rev !== 'number') parsed._rev = 0;
  if (typeof parsed._updatedAt !== 'number') parsed._updatedAt = 0;
  return parsed;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = normalizeStateObject(JSON.parse(raw));
      if (normalized) return normalized;
    }
  } catch (e) {
    console.warn('Could not load saved state from localStorage:', e);
  }
  return normalizeStateObject(getDefaultState());
}

function updateSyncBadgeUI(mode) {
  const badge = document.getElementById('syncStatusBadge');
  if (!badge) return;
  if (mode === 'server') {
    badge.textContent = `● Đã đồng bộ (v${state._rev || 1})`;
    badge.className = 'text-emerald-400 font-semibold truncate';
  } else if (mode === 'saving') {
    badge.textContent = '↻ Đang lưu...';
    badge.className = 'text-amber-300 font-semibold truncate';
  } else {
    badge.textContent = '● Ngoại tuyến';
    badge.className = 'text-rose-400 font-semibold truncate';
  }
}

// Save to Server API (/api/state) + Cloud Relay + localStorage + BroadcastChannel
function saveState() {
  state._updatedAt = Date.now();
  state._rev = (Number(state._rev) || 0) + 1;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}

  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'STATE_UPDATED', state });
    } catch (e) {}
  }

  updateSyncBadgeUI('saving');
  const bodyStr = JSON.stringify(state);

  fetch(`${API_BASE}/api/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
    body: bodyStr
  })
    .then(res => res.json())
    .then(data => {
      if (data && data.ok) {
        if (typeof data._rev === 'number') state._rev = data._rev;
        if (typeof data._updatedAt === 'number') state._updatedAt = data._updatedAt;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
        updateSyncBadgeUI('server');
      }
    })
    .catch(() => {
      // Fallback: push directly to Cloud Relay so external networks (4G/5G/other Wi-Fi) always sync
      fetch(CLOUD_DB_TOPIC, {
        method: 'POST',
        body: bodyStr
      })
        .then(r => {
          if (r && r.ok) updateSyncBadgeUI('server');
          else updateSyncBadgeUI('offline');
        })
        .catch(() => updateSyncBadgeUI('offline'));
    });
}

async function pullStateFromCloudRelay(isInitial) {
  try {
    const res = await fetch(`${CLOUD_DB_TOPIC}/json?poll=1&since=12h&t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const text = await res.text();
    const lines = text.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      let env = null;
      try {
        env = JSON.parse(line);
      } catch (e) {
        continue;
      }
      if (!env || env.event !== 'message' || !env.message) continue;
      let parsedMsg = null;
      try {
        parsedMsg = JSON.parse(env.message);
      } catch (e) {
        continue;
      }
      const remoteState = normalizeStateObject(parsedMsg);
      if (remoteState) {
        const isNewer =
          (isInitial && remoteState._rev >= (state._rev || 0)) ||
          remoteState._rev > (state._rev || 0);
        if (isNewer) {
          state = remoteState;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          } catch (e) {}
          renderAll();
        }
        updateSyncBadgeUI('server');
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// Pull shared state from central server (or Cloud Relay fallback on external networks)
async function pullStateFromServer(isInitial) {
  if (isSyncingServer) return;

  // Check if user is actively typing inside a table number input (score or finance input)
  const activeEl = document.activeElement;
  const isEditingTableInput =
    !isInitial &&
    activeEl &&
    activeEl.tagName === 'INPUT' &&
    activeEl.type === 'number' &&
    activeEl.id !== 'regExtraFee' &&
    activeEl.id !== 'newExpenseAmount';

  if (isEditingTableInput) return;

  isSyncingServer = true;
  try {
    const revParam = isInitial ? 0 : (state._rev || 0);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;
    const res = await fetch(`${API_BASE}/api/state?rev=${revParam}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.ok) {
        if (payload.unchanged) {
          updateSyncBadgeUI('server');
          return;
        } else if (payload.state) {
          const remoteState = normalizeStateObject(payload.state);
          if (remoteState) {
            const isDifferent =
              isInitial ||
              remoteState._rev !== state._rev ||
              remoteState._updatedAt !== state._updatedAt;

            if (isDifferent) {
              state = remoteState;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
              } catch (e) {}
              renderAll();
            }
            updateSyncBadgeUI('server');
            return;
          }
        }
      }
    }
    const cloudOk = await pullStateFromCloudRelay(isInitial);
    if (!cloudOk) updateSyncBadgeUI('offline');
  } catch (e) {
    const cloudOk = await pullStateFromCloudRelay(isInitial);
    if (!cloudOk) updateSyncBadgeUI('offline');
  } finally {
    isSyncingServer = false;
  }
}

function formatVND(amount) {
  const num = Math.round(Number(amount) || 0);
  return num.toLocaleString('vi-VN') + 'đ';
}

function getMemberById(id) {
  return state.members.find(m => m.id === id) || { id, name: 'VĐV', gender: 'M', skill: 'B' };
}

function getCategoryBadge(cat) {
  if (cat === 'MD') {
    return { label: 'Đôi Nam', short: 'Đôi Nam', classes: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
  if (cat === 'XD') {
    return { label: 'Đôi Nam Nữ', short: 'Đôi Nam Nữ', classes: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  if (cat === 'WD') {
    return { label: 'Đôi Nữ', short: 'Đôi Nữ', classes: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
  }
  return { label: 'Tự do', short: 'Tự do', classes: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
}

// ============================================================================
// CALENDAR DATE PICKER HANDLERS (CHỌN NGÀY BẰNG LỊCH - KHÔNG CẦN NHẬP TEXT)
// ============================================================================
function handleAdminDatePickerChange(isoValue) {
  if (!isoValue) return;
  state.settings.sessionDateISO = isoValue;
  state.settings.sessionDate = formatISOToVietnameseDate(isoValue);
  saveState();
  renderAll();
  showToast(`📅 Đã chọn ngày đánh từ lịch: ${state.settings.sessionDate}`);
}

function selectUpcomingWeekendDay(dayOfWeek) {
  const iso = getUpcomingDayISO(dayOfWeek);
  if (isAdmin()) {
    handleAdminDatePickerChange(iso);
  } else {
    pickUpcomingWeekendForReg(dayOfWeek);
  }
}

function updateRegDatePreview(isoValue) {
  if (!isoValue) return;
  const formatted = formatISOToVietnameseDate(isoValue);
  const labelEl = document.getElementById('regPlayDateFormatted');
  if (labelEl) labelEl.textContent = formatted;
}

function pickUpcomingWeekendForReg(dayOfWeek) {
  const iso = getUpcomingDayISO(dayOfWeek);
  const regDateInput = document.getElementById('regPlayDate');
  if (regDateInput) {
    regDateInput.value = iso;
    updateRegDatePreview(iso);
    showToast(`📅 Đã chọn ngày đăng ký: ${formatISOToVietnameseDate(iso)}`);
  }
}

// ============================================================================
// INTERNATIONAL 21-POINT BADMINTON SCORE VALIDATION (BWF RULE)
// ============================================================================
function validateBadmintonScore(scoreA, scoreB) {
  if (scoreA === null || scoreB === null || isNaN(scoreA) || isNaN(scoreB)) {
    return { valid: false, reason: 'Chưa nhập đủ điểm 2 đội' };
  }
  const a = Number(scoreA);
  const b = Number(scoreB);
  if (a < 0 || b < 0 || a > 30 || b > 30) {
    return { valid: false, reason: 'Điểm số phải từ 0 đến tối đa 30 điểm.' };
  }
  if (a === b) {
    return { valid: false, reason: 'Trận đấu cầu lông không có kết quả hòa.' };
  }

  const high = Math.max(a, b);
  const low = Math.min(a, b);

  if (high === 21 && low <= 19) {
    return { valid: true };
  }
  if (high >= 22 && high <= 29 && high - low === 2) {
    return { valid: true };
  }
  if (high === 30 && (low === 28 || low === 29)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'Theo luật quốc tế 21 điểm: Đội thắng chạm 21 điểm (đối thủ ≤ 19). Nếu hòa 20–20 phải thắng cách biệt 2 điểm (VD: 22–20, 23–21..., tối đa 30–29).'
  };
}

// ============================================================================
// COST & DEBT CALCULATION ENGINE
// ============================================================================
function calculateSessionCosts() {
  const c = state.costs;
  const courtSubtotal = (Number(c.courtsCount) || 0) * (Number(c.courtHours) || 0) * (Number(c.courtRate) || 0);
  const shuttleSubtotal = (Number(c.shuttleCount) || 0) * (Number(c.shuttlePrice) || 0);
  const extraSubtotal = (c.extraExpenses || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const sharedTotal = courtSubtotal + shuttleSubtotal + extraSubtotal;

  const memberCount = state.members.length;
  const memberShares = {};

  if (memberCount > 0) {
    if (c.splitMode === 'gender_discount') {
      const totalUnits = state.members.reduce((sum, m) => sum + (m.gender === 'F' ? 0.8 : 1.0), 0);
      const unitCost = totalUnits > 0 ? sharedTotal / totalUnits : 0;
      state.members.forEach(m => {
        let baseShare = unitCost * (m.gender === 'F' ? 0.8 : 1.0);
        if (c.roundThousand) baseShare = Math.ceil(baseShare / 1000) * 1000;
        const extra = Number(m.extraFee) || 0;
        const totalDue = Math.round(baseShare) + extra;
        const amountPaid = Math.max(0, Number(m.amountPaid) || 0);
        const debtAmount = Math.max(0, totalDue - amountPaid);
        memberShares[m.id] = {
          baseShare: Math.round(baseShare),
          extraFee: extra,
          totalDue,
          amountPaid,
          debtAmount,
          isFullyPaid: debtAmount === 0 && totalDue > 0
        };
      });
    } else if (c.splitMode === 'guest_surcharge') {
      const surcharge = 15000;
      const guestCount = state.members.filter(m => m.type === 'guest').length;
      const basePool = Math.max(0, sharedTotal - guestCount * surcharge);
      const basePerPerson = basePool / memberCount;
      state.members.forEach(m => {
        let baseShare = basePerPerson + (m.type === 'guest' ? surcharge : 0);
        if (c.roundThousand) baseShare = Math.ceil(baseShare / 1000) * 1000;
        const extra = Number(m.extraFee) || 0;
        const totalDue = Math.round(baseShare) + extra;
        const amountPaid = Math.max(0, Number(m.amountPaid) || 0);
        const debtAmount = Math.max(0, totalDue - amountPaid);
        memberShares[m.id] = {
          baseShare: Math.round(baseShare),
          extraFee: extra,
          totalDue,
          amountPaid,
          debtAmount,
          isFullyPaid: debtAmount === 0 && totalDue > 0
        };
      });
    } else {
      let basePerPerson = sharedTotal / memberCount;
      if (c.roundThousand) basePerPerson = Math.ceil(basePerPerson / 1000) * 1000;
      state.members.forEach(m => {
        const extra = Number(m.extraFee) || 0;
        const totalDue = Math.round(basePerPerson) + extra;
        const amountPaid = Math.max(0, Number(m.amountPaid) || 0);
        const debtAmount = Math.max(0, totalDue - amountPaid);
        memberShares[m.id] = {
          baseShare: Math.round(basePerPerson),
          extraFee: extra,
          totalDue,
          amountPaid,
          debtAmount,
          isFullyPaid: debtAmount === 0 && totalDue > 0
        };
      });
    }
  }

  let totalPayableAllMembers = 0;
  let totalCollected = 0;
  let totalDebt = 0;

  state.members.forEach(m => {
    const info = memberShares[m.id];
    if (info) {
      totalPayableAllMembers += info.totalDue;
      totalCollected += info.amountPaid;
      totalDebt += info.debtAmount;
      m.paid = info.debtAmount === 0;
    }
  });

  const avgPerPerson = memberCount > 0 ? Math.round(sharedTotal / memberCount) : 0;

  return {
    courtSubtotal,
    shuttleSubtotal,
    extraSubtotal,
    sharedTotal,
    avgPerPerson,
    totalPayableAllMembers,
    totalCollected,
    totalRemaining: totalDebt,
    memberShares
  };
}

// ============================================================================
// HERO BANNER & CAROUSEL
// ============================================================================
function renderHeroBanner() {
  const costData = calculateSessionCosts();
  const maleCount = state.members.filter(m => m.gender === 'M').length;
  const femaleCount = state.members.filter(m => m.gender === 'F').length;
  const mdCount = state.matches.filter(m => m.category === 'MD').length;
  const xdCount = state.matches.filter(m => m.category === 'XD').length;
  const wdCount = state.matches.filter(m => m.category === 'WD').length;
  const doneMatches = state.matches.filter(m => m.status === 'done');

  const clubDisplay = document.getElementById('clubNameDisplay');
  if (clubDisplay) clubDisplay.textContent = state.settings.clubName;
  const navMemBadge = document.getElementById('navMemberCountBadge');
  if (navMemBadge) navMemBadge.textContent = state.members.length;
  const navMatchBadge = document.getElementById('navMatchCountBadge');
  if (navMatchBadge) navMatchBadge.textContent = state.matches.length;
  const nextPill = document.getElementById('navNextSessionPill');
  if (nextPill) {
    nextPill.textContent =
      state.settings.sessionDate.split('·')[0].trim() + ' · ' + state.members.length + '/' + state.settings.maxPlayers + ' ĐK';
  }

  const adminBarDateText = document.getElementById('adminBarCurrentDateText');
  if (adminBarDateText) adminBarDateText.textContent = state.settings.sessionDate;
  const quickHeaderDatePicker = document.getElementById('quickHeaderDatePicker');
  if (quickHeaderDatePicker && state.settings.sessionDateISO) {
    quickHeaderDatePicker.value = state.settings.sessionDateISO;
  }

  const badgeEl = document.getElementById('heroBadgeText');
  const headlineEl = document.getElementById('heroHeadline');
  const subtextEl = document.getElementById('heroSubtext');

  if (currentHeroSlide === 0) {
    badgeEl.textContent = `Buổi đánh cuối tuần · ${state.settings.sessionDate} (${state.settings.sessionTime})`;
    if (doneMatches.length > 0) {
      const latest = doneMatches[doneMatches.length - 1];
      const catInfo = getCategoryBadge(latest.category);
      headlineEl.innerHTML = `${catInfo.label} kịch tính<br/>tỉ số ${latest.scoreA}–${latest.scoreB}`;
    } else {
      headlineEl.innerHTML = `Giao lưu cầu lông<br/>cuối tuần`;
    }
    subtextEl.textContent = `${state.settings.courtLocation} · Tên miền: giaoluucaulongcuoituan · Thể thức quốc tế 21 điểm.`;
  } else if (currentHeroSlide === 1) {
    badgeEl.textContent = `Quản lý tài chính buổi đánh · Đã trả & Tiền nợ`;
    headlineEl.innerHTML = `Đã thu ${formatVND(costData.totalCollected)}<br/>Còn nợ ${formatVND(costData.totalRemaining)}`;
    subtextEl.textContent = `Tổng chi phí: ${formatVND(costData.sharedTotal)} (Tiền sân: ${formatVND(costData.courtSubtotal)} · Tiền cầu: ${formatVND(costData.shuttleSubtotal)} · Phụ phí: ${formatVND(costData.extraSubtotal)}).`;
  } else {
    badgeEl.textContent = `Sơ đồ ghép cặp tuần · Đôi Nam · Đôi Nam Nữ · Đôi Nữ`;
    headlineEl.innerHTML = `${state.matches.length} trận đấu cân bằng<br/>cho ${state.members.length} thành viên`;
    subtextEl.textContent = `Phân bổ lượt ra sân đồng đều cho ${maleCount} VĐV Nam và ${femaleCount} VĐV Nữ (${mdCount} Đôi Nam, ${xdCount} Đôi Nam Nữ, ${wdCount} Đôi Nữ).`;
  }

  document.getElementById('heroStatMembers').textContent = `${state.members.length} / ${state.settings.maxPlayers}`;
  document.getElementById('heroStatMembersSub').textContent = `${maleCount} Nam · ${femaleCount} Nữ đã ĐK`;

  document.getElementById('heroStatMatches').textContent = `${state.matches.length} trận`;
  document.getElementById('heroStatMatchesSub').textContent = `${mdCount} ĐN · ${xdCount} ĐNN · ${wdCount} ĐNữ`;

  document.getElementById('heroStatTotalCost').textContent = formatVND(costData.sharedTotal);
  document.getElementById('heroStatTotalCostSub').textContent = `Đã trả: ${formatVND(costData.totalCollected)}`;

  document.getElementById('heroStatPerPerson').textContent = formatVND(costData.avgPerPerson);
  document.getElementById('heroStatPerPersonSub').textContent =
    costData.totalRemaining > 0 ? `Còn nợ: ${formatVND(costData.totalRemaining)}` : 'Đã thu đủ 100%';

  [0, 1, 2].forEach(idx => {
    const dot = document.getElementById(`heroDot${idx}`);
    if (!dot) return;
    dot.className =
      idx === currentHeroSlide
        ? 'h-1.5 w-8 rounded-full bg-white transition-all'
        : 'h-1.5 w-2 rounded-full bg-white/30 hover:bg-white/60 transition-all';
  });
}

function setHeroSlide(idx) {
  currentHeroSlide = idx;
  renderHeroBanner();
}

function nextHeroSlide() {
  currentHeroSlide = (currentHeroSlide + 1) % 3;
  renderHeroBanner();
}

function prevHeroSlide() {
  currentHeroSlide = (currentHeroSlide + 2) % 3;
  renderHeroBanner();
}

function toggleHeroAutoplay() {
  isHeroPlaying = !isHeroPlaying;
  const btn = document.getElementById('heroPauseBtn');
  if (btn) btn.textContent = isHeroPlaying ? 'II' : '▶';
}

// ============================================================================
// TAB 1: OVERVIEW (BENTO GRID)
// ============================================================================
function renderOverviewTab() {
  const costData = calculateSessionCosts();

  const nextMatch = state.matches.find(m => m.status !== 'done') || state.matches[state.matches.length - 1];
  const featuredBox = document.getElementById('overviewFeaturedMatchBox');
  const featuredMeta = document.getElementById('overviewFeaturedMeta');

  if (nextMatch) {
    const cat = getCategoryBadge(nextMatch.category);
    const a1 = getMemberById(nextMatch.teamA[0]);
    const a2 = getMemberById(nextMatch.teamA[1]);
    const b1 = getMemberById(nextMatch.teamB[0]);
    const b2 = getMemberById(nextMatch.teamB[1]);

    featuredMeta.textContent = `${nextMatch.court} · ${nextMatch.round} · ${state.settings.sessionDate}`;
    featuredBox.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1">
          <div class="text-lg sm:text-xl font-black text-white leading-snug">${a1.name} & ${a2.name}</div>
          <div class="text-xs text-slate-400 mt-1">Hạng ${a1.skill}+${a2.skill} · Đội 1</div>
        </div>

        <div class="flex flex-col items-center px-3 shrink-0">
          <span class="text-[11px] font-extrabold text-blue-400 mb-1">${nextMatch.id} · ${cat.label}</span>
          <div class="w-11 h-11 rounded-full bg-[#152247] border border-[#294080] flex items-center justify-center text-xs font-black text-white">
            ${nextMatch.status === 'done' ? `${nextMatch.scoreA}-${nextMatch.scoreB}` : 'VS'}
          </div>
          <span class="text-[11px] text-slate-400 mt-1">${nextMatch.round}</span>
        </div>

        <div class="flex-1 text-right">
          <div class="text-lg sm:text-xl font-black text-white leading-snug">${b1.name} & ${b2.name}</div>
          <div class="text-xs text-slate-400 mt-1">Hạng ${b1.skill}+${b2.skill} · Đội 2</div>
        </div>
      </div>
    `;
  } else {
    featuredBox.innerHTML = `<div class="text-center text-slate-400 text-sm py-6">Chưa có trận đấu nào trong danh sách.</div>`;
  }

  const miniList = document.getElementById('overviewMatchListMini');
  miniList.innerHTML = state.matches.slice(0, 4).map(m => {
    const cat = getCategoryBadge(m.category);
    const a1 = getMemberById(m.teamA[0]);
    const a2 = getMemberById(m.teamA[1]);
    const b1 = getMemberById(m.teamB[0]);
    const b2 = getMemberById(m.teamB[1]);
    const scoreDisplay = m.status === 'done'
      ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">${m.scoreA} - ${m.scoreB}</span>`
      : `<span class="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold text-xs">${m.court}</span>`;

    return `
      <div onclick="switchTab('matches')" class="cursor-pointer flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0e152b] hover:bg-[#131e3d] border border-[#1a274d] text-xs transition-colors">
        <div class="flex items-center gap-2">
          <span class="font-bold text-blue-400">${m.id}</span>
          <span class="px-2 py-0.5 rounded border text-[10px] font-bold ${cat.classes}">${cat.short}</span>
          <span class="text-slate-200 font-semibold truncate max-w-[230px] sm:max-w-xs">${a1.name}/${a2.name} <span class="text-slate-500">vs</span> ${b1.name}/${b2.name}</span>
        </div>
        ${scoreDisplay}
      </div>
    `;
  }).join('');

  const totalMatches = state.matches.length;
  const completedMatches = state.matches.filter(m => m.status === 'done').length;
  document.getElementById('overviewProgressFraction').textContent = `${completedMatches}/${totalMatches}`;
  document.getElementById('overviewCompletedCount').textContent = completedMatches;
  document.getElementById('overviewTotalMatchesText').textContent = totalMatches;

  const circumference = 251.2;
  const ratio = totalMatches > 0 ? completedMatches / totalMatches : 0;
  const offset = circumference - ratio * circumference;
  const circle = document.getElementById('overviewProgressCircle');
  if (circle) circle.style.strokeDashoffset = offset;

  document.getElementById('overviewMDCount').textContent = `${state.matches.filter(m => m.category === 'MD').length} trận`;
  document.getElementById('overviewXDCount').textContent = `${state.matches.filter(m => m.category === 'XD').length} trận`;
  document.getElementById('overviewWDCount').textContent = `${state.matches.filter(m => m.category === 'WD').length} trận`;

  document.getElementById('overviewPaidProgress').textContent = `${formatVND(costData.totalCollected)} / ${formatVND(costData.totalPayableAllMembers)}`;
  document.getElementById('overviewDebtTotal').textContent = formatVND(costData.totalRemaining);
  const paidPct = costData.totalPayableAllMembers > 0
    ? Math.min(100, Math.round((costData.totalCollected / costData.totalPayableAllMembers) * 100))
    : 0;
  document.getElementById('overviewPaidBar').style.width = `${paidPct}%`;

  const memberListEl = document.getElementById('overviewMemberList');
  memberListEl.innerHTML = state.members.map(m => {
    const info = costData.memberShares[m.id] || { totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const genderBadge = m.gender === 'M'
      ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0">Nam</span>'
      : '<span class="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold shrink-0">Nữ</span>';

    const statusPill = info.debtAmount === 0
      ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">Đã trả đủ</span>`
      : `<span class="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold">Nợ ${formatVND(info.debtAmount)}</span>`;

    return `
      <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0f162e] border border-[#1c2952]">
        <div class="flex items-center gap-2 min-w-0">
          ${genderBadge}
          <span class="text-xs font-bold text-white truncate">${m.name}</span>
          <span class="text-[10px] text-slate-400 font-semibold">(${m.skill})</span>
        </div>
        ${statusPill}
      </div>
    `;
  }).join('');
}

// ============================================================================
// TAB 2: WEEKLY MEMBER REGISTRATION (WITH CALENDAR DATE PICKER & SAVED ROSTER)
// ============================================================================
function renderSavedMembersQuickBox() {
  if (!Array.isArray(state.savedMembers)) {
    state.savedMembers = [];
  }
  state.members.forEach(m => syncMemberToSavedRoster(m, state.savedMembers));

  const quickListEl = document.getElementById('savedMembersQuickList');
  const countBadgeEl = document.getElementById('savedMembersCountBadge');
  const datalistEl = document.getElementById('savedMembersDatalist');

  if (countBadgeEl) {
    countBadgeEl.textContent = `${state.savedMembers.length} người đã lưu`;
  }

  if (datalistEl) {
    datalistEl.innerHTML = state.savedMembers
      .map(s => `<option value="${s.name}">${s.gender === 'M' ? 'Nam' : 'Nữ'} · Hạng ${s.skill}</option>`)
      .join('');
  }

  if (!quickListEl) return;

  if (state.savedMembers.length === 0) {
    quickListEl.innerHTML = `<span class="text-[11px] text-slate-500 italic">Chưa có tên lưu từ tuần trước. Khi đăng ký tên mới, hệ thống sẽ tự động lưu lại tại đây.</span>`;
    return;
  }

  const admin = isAdmin();
  quickListEl.innerHTML = state.savedMembers.map((s, idx) => {
    const isAlreadyRegistered = state.members.some(
      m => m.name.trim().toLowerCase() === s.name.trim().toLowerCase()
    );
    const genderLabel = s.gender === 'M' ? 'Nam' : 'Nữ';
    const genderColor = s.gender === 'M' ? 'text-blue-300' : 'text-pink-300';

    if (isAlreadyRegistered) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap opacity-80">
          <span>✓ ${s.name}</span>
          <span class="text-[10px] opacity-80">(${genderLabel} · ${s.skill})</span>
        </span>
      `;
    }

    return `
      <div class="inline-flex items-center rounded-xl bg-[#142044] hover:bg-blue-600/30 border border-blue-500/40 transition-colors whitespace-nowrap">
        <button
          type="button"
          onclick="quickRegisterSavedMember(${idx})"
          class="px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1 whitespace-nowrap"
          title="Chạm để đăng ký nhanh ${s.name}"
        >
          <span class="text-blue-400 font-black">+</span>
          <span>${s.name}</span>
          <span class="text-[10px] ${genderColor} font-semibold">(${genderLabel} · ${s.skill})</span>
        </button>
        ${admin ? `<button type="button" onclick="removeSavedMember(${idx})" title="Xóa khỏi danh sách lưu" class="pr-2 pl-0.5 py-1 text-[11px] text-slate-400 hover:text-rose-400 font-bold">×</button>` : ''}
      </div>
    `;
  }).join('');
}

function handleSavedMemberNameInput(inputValue) {
  if (!inputValue || !Array.isArray(state.savedMembers)) return;
  const clean = inputValue.trim().toLowerCase();
  const matched = state.savedMembers.find(s => s.name.trim().toLowerCase() === clean);
  if (matched) {
    const genderEl = document.getElementById('regGender');
    const skillEl = document.getElementById('regSkill');
    const typeEl = document.getElementById('regType');
    if (genderEl && matched.gender) genderEl.value = matched.gender;
    if (skillEl && matched.skill) skillEl.value = matched.skill;
    if (typeEl && matched.type) typeEl.value = matched.type;
  }
}

function quickRegisterSavedMember(savedIdx) {
  if (!Array.isArray(state.savedMembers) || !state.savedMembers[savedIdx]) return;
  const saved = state.savedMembers[savedIdx];
  const exists = state.members.some(
    m => m.name.trim().toLowerCase() === saved.name.trim().toLowerCase()
  );
  if (exists) {
    showToast(`ℹ️ "${saved.name}" đã có trong danh sách đăng ký tuần này!`);
    return;
  }

  const regDateInput = document.getElementById('regPlayDate');
  const chosenISO = regDateInput?.value || state.settings.sessionDateISO;
  const formattedPlayDate = formatISOToVietnameseDate(chosenISO);

  const newMember = {
    id: 'm' + Date.now() + Math.floor(Math.random() * 1000),
    name: saved.name,
    gender: saved.gender || 'M',
    skill: saved.skill || 'B',
    type: saved.type || 'fixed',
    extraFee: 0,
    amountPaid: 0,
    paid: false,
    playDate: formattedPlayDate,
    note: saved.note || ''
  };

  state.members.push(newMember);
  saveState();
  renderAll();
  showToast(`⚡ Đã đăng ký nhanh "${newMember.name}" (Hạng ${newMember.skill}) vào buổi ${formattedPlayDate}!`);
}

function registerAllSavedMembers() {
  if (!Array.isArray(state.savedMembers) || state.savedMembers.length === 0) {
    showToast('Chưa có thành viên nào trong danh sách lưu tuần trước.');
    return;
  }
  const regDateInput = document.getElementById('regPlayDate');
  const chosenISO = regDateInput?.value || state.settings.sessionDateISO;
  const formattedPlayDate = formatISOToVietnameseDate(chosenISO);

  let addedCount = 0;
  state.savedMembers.forEach((saved, idx) => {
    const exists = state.members.some(
      m => m.name.trim().toLowerCase() === saved.name.trim().toLowerCase()
    );
    if (!exists) {
      state.members.push({
        id: 'm' + Date.now() + '_' + idx,
        name: saved.name,
        gender: saved.gender || 'M',
        skill: saved.skill || 'B',
        type: saved.type || 'fixed',
        extraFee: 0,
        amountPaid: 0,
        paid: false,
        playDate: formattedPlayDate,
        note: saved.note || ''
      });
      addedCount++;
    }
  });

  if (addedCount === 0) {
    showToast('Tất cả thành viên đã lưu đều đã có tên trong danh sách tuần này!');
    return;
  }
  saveState();
  renderAll();
  showToast(`⚡ Đã đăng ký nhanh ${addedCount} thành viên từ danh sách tuần trước!`);
}

function removeSavedMember(savedIdx) {
  if (!isAdmin() || !Array.isArray(state.savedMembers)) return;
  const removed = state.savedMembers.splice(savedIdx, 1);
  saveState();
  renderAll();
  if (removed[0]) {
    showToast(`Đã xóa "${removed[0].name}" khỏi danh sách lưu tuần trước.`);
  }
}

function renderRegistrationTab() {
  const admin = isAdmin();
  const costData = calculateSessionCosts();
  const maleCount = state.members.filter(m => m.gender === 'M').length;
  const femaleCount = state.members.filter(m => m.gender === 'F').length;

  renderSavedMembersQuickBox();

  document.getElementById('regSlotCounter').textContent = `${state.members.length}/${state.settings.maxPlayers} chỗ`;
  document.getElementById('regSummarySubtitle').textContent =
    `Ngày đánh: ${state.settings.sessionDate} · Tổng cộng ${state.members.length} thành viên (${maleCount} Nam, ${femaleCount} Nữ)`;

  const regDateInput = document.getElementById('regPlayDate');
  if (regDateInput && !regDateInput.value) {
    regDateInput.value = state.settings.sessionDateISO || '2026-11-14';
    updateRegDatePreview(regDateInput.value);
  } else if (regDateInput && isAdmin()) {
    regDateInput.value = state.settings.sessionDateISO || '2026-11-14';
    updateRegDatePreview(regDateInput.value);
  }

  const matchCounts = {};
  state.members.forEach(m => { matchCounts[m.id] = 0; });
  state.matches.forEach(match => {
    [...match.teamA, ...match.teamB].forEach(pid => {
      if (matchCounts[pid] !== undefined) matchCounts[pid]++;
    });
  });

  const genderFilter = document.getElementById('filterMemberGender')?.value || 'ALL';
  const filteredMembers = state.members.filter(m => genderFilter === 'ALL' || m.gender === genderFilter);

  const tbody = document.getElementById('registeredMembersTableBody');
  if (filteredMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">Chưa có thành viên nào đăng ký trong tuần này. Hãy chạm vào tên đã lưu từ tuần trước để đăng ký nhanh!</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredMembers.map((m, i) => {
    const shareInfo = costData.memberShares[m.id] || { baseShare: 0, extraFee: 0, totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const genderBadge = m.gender === 'M'
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>Nam</span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 text-xs font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>Nữ</span>`;

    const typeLabel = m.type === 'fixed'
      ? `<span class="text-[11px] text-slate-400 whitespace-nowrap">Cố định</span>`
      : `<span class="text-[11px] text-amber-300 whitespace-nowrap">Vãng lai</span>`;

    const dateBadge = m.playDate
      ? `<span class="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 whitespace-nowrap">${m.playDate}</span>`
      : '';

    const paymentStatusHtml = shareInfo.debtAmount === 0
      ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">✓ Đã trả ${formatVND(shareInfo.amountPaid)}</span>`
      : `<div class="space-y-0.5 whitespace-nowrap">
           <div class="text-xs font-bold text-emerald-400">Đã trả: ${formatVND(shareInfo.amountPaid)}</div>
           <div class="text-xs font-extrabold text-rose-400">Còn nợ: ${formatVND(shareInfo.debtAmount)}</div>
         </div>`;

    const adminActionCol = admin
      ? `<td class="py-3.5 px-2.5 sm:px-3 text-right whitespace-nowrap">
           <button onclick="removeMember('${m.id}')" class="text-xs font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 whitespace-nowrap">
             Xóa
           </button>
         </td>`
      : '';

    return `
      <tr class="hover:bg-[#0f1730]/60 transition-colors">
        <td class="py-3.5 px-2.5 sm:px-3 text-xs font-bold text-slate-400 whitespace-nowrap">${i + 1}</td>
        <td class="py-3.5 px-2.5 sm:px-3 min-w-[140px]">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span class="whitespace-nowrap">${m.name}</span>
            ${dateBadge}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">${typeLabel} ${m.note ? `· ${m.note}` : ''}</div>
        </td>
        <td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">${genderBadge}</td>
        <td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#142044] border border-[#293f80] text-xs font-bold text-slate-200 whitespace-nowrap">Hạng ${m.skill}</span>
        </td>
        <td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
          <span class="inline-flex items-center text-xs font-bold text-indigo-300 whitespace-nowrap">${matchCounts[m.id] || 0} trận</span>
        </td>
        <td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
          <div class="font-extrabold text-white whitespace-nowrap">${formatVND(shareInfo.totalDue)}</div>
          ${shareInfo.extraFee > 0 ? `<div class="text-[10px] text-amber-300 whitespace-nowrap">Gồm +${formatVND(shareInfo.extraFee)} phụ phí</div>` : ''}
        </td>
        <td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">${paymentStatusHtml}</td>
        ${adminActionCol}
      </tr>
    `;
  }).join('');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('regName');
  const genderInput = document.getElementById('regGender');
  const skillInput = document.getElementById('regSkill');
  const typeInput = document.getElementById('regType');
  const extraInput = document.getElementById('regExtraFee');
  const noteInput = document.getElementById('regNote');
  const regDateInput = document.getElementById('regPlayDate');

  const name = nameInput.value.trim();
  if (!name) return;

  const extraFee = isAdmin() ? (Number(extraInput?.value) || 0) : 0;
  const chosenISO = regDateInput?.value || state.settings.sessionDateISO;
  const formattedPlayDate = formatISOToVietnameseDate(chosenISO);

  const newMember = {
    id: 'm' + Date.now(),
    name,
    gender: genderInput.value,
    skill: skillInput.value,
    type: typeInput.value,
    extraFee,
    amountPaid: 0,
    paid: false,
    playDate: formattedPlayDate,
    note: noteInput.value.trim()
  };

  state.members.push(newMember);
  if (!Array.isArray(state.savedMembers)) state.savedMembers = [];
  syncMemberToSavedRoster(newMember, state.savedMembers);
  saveState();

  nameInput.value = '';
  if (extraInput) extraInput.value = '0';
  noteInput.value = '';

  renderAll();
  showToast(`✓ Đã đăng ký & lưu tên "${newMember.name}" vào danh sách!`);
}

function removeMember(memberId) {
  if (!isAdmin()) return;
  const target = state.members.find(m => m.id === memberId);
  state.members = state.members.filter(m => m.id !== memberId);
  state.matches = state.matches.filter(
    match => !match.teamA.includes(memberId) && !match.teamB.includes(memberId)
  );
  saveState();
  renderAll();
  if (target) showToast(`Đã xóa ${target.name} khỏi danh sách tuần.`);
}

// ============================================================================
// TAB 3: MATCHMAKING & LIVE SCORE ADJUSTMENT (BOTH USER & ADMIN CAN EDIT SCORES)
// ============================================================================
function skillScore(skill) {
  if (skill === 'A') return 3;
  if (skill === 'B') return 2;
  return 1;
}

function generateWeeklyMatches() {
  if (!isAdmin()) return;
  const mode = document.getElementById('autoMatchMode')?.value || 'ALL';
  const targetCount = parseInt(document.getElementById('autoMatchCount')?.value || '9', 10);

  const males = state.members.filter(m => m.gender === 'M');
  const females = state.members.filter(m => m.gender === 'F');

  if (state.members.length < 4) {
    showToast('Cần tối thiểu 4 thành viên đăng ký để xếp cặp thi đấu!');
    return;
  }

  const playCounts = {};
  state.members.forEach(m => { playCounts[m.id] = 0; });

  function pickLeastPlayed(pool, count) {
    const sorted = [...pool].sort((a, b) => {
      const diff = (playCounts[a.id] || 0) - (playCounts[b.id] || 0);
      if (diff !== 0) return diff;
      return Math.random() - 0.5;
    });
    return sorted.slice(0, count);
  }

  function balanceFourPlayers(four) {
    const sorted = [...four].sort((a, b) => skillScore(b.skill) - skillScore(a.skill));
    return {
      teamA: [sorted[0].id, sorted[3].id],
      teamB: [sorted[1].id, sorted[2].id]
    };
  }

  const newMatches = [];
  const courtsCount = Math.max(1, Number(state.costs.courtsCount) || 3);

  for (let i = 0; i < targetCount; i++) {
    const roundNumber = Math.floor(i / courtsCount) + 1;
    const courtNumber = (i % courtsCount) + 1;

    let chosenCat = 'MD';
    const canMD = males.length >= 4;
    const canWD = females.length >= 4;
    const canXD = males.length >= 2 && females.length >= 2;

    if (mode === 'MD' && canMD) {
      chosenCat = 'MD';
    } else if (mode === 'WD' && canWD) {
      chosenCat = 'WD';
    } else if (mode === 'XD' && canXD) {
      chosenCat = 'XD';
    } else if (mode === 'MD_XD') {
      if (i % 2 === 0 && canMD) chosenCat = 'MD';
      else if (canXD) chosenCat = 'XD';
      else if (canMD) chosenCat = 'MD';
    } else {
      const cycle = i % 3;
      if (cycle === 0 && canMD) chosenCat = 'MD';
      else if (cycle === 1 && canXD) chosenCat = 'XD';
      else if (cycle === 2 && canWD) chosenCat = 'WD';
      else if (canMD) chosenCat = 'MD';
      else if (canXD) chosenCat = 'XD';
      else if (canWD) chosenCat = 'WD';
      else chosenCat = 'FREE';
    }

    let teamA = [];
    let teamB = [];

    if (chosenCat === 'MD' && canMD) {
      const picked = pickLeastPlayed(males, 4);
      const balanced = balanceFourPlayers(picked);
      teamA = balanced.teamA;
      teamB = balanced.teamB;
    } else if (chosenCat === 'WD' && canWD) {
      const picked = pickLeastPlayed(females, 4);
      const balanced = balanceFourPlayers(picked);
      teamA = balanced.teamA;
      teamB = balanced.teamB;
    } else if (chosenCat === 'XD' && canXD) {
      const pickedMales = pickLeastPlayed(males, 2).sort((a, b) => skillScore(b.skill) - skillScore(a.skill));
      const pickedFemales = pickLeastPlayed(females, 2).sort((a, b) => skillScore(a.skill) - skillScore(b.skill));
      teamA = [pickedMales[0].id, pickedFemales[0].id];
      teamB = [pickedMales[1].id, pickedFemales[1].id];
    } else {
      const picked = pickLeastPlayed(state.members, 4);
      const balanced = balanceFourPlayers(picked);
      teamA = balanced.teamA;
      teamB = balanced.teamB;
    }

    [...teamA, ...teamB].forEach(pid => {
      playCounts[pid] = (playCounts[pid] || 0) + 1;
    });

    newMatches.push({
      id: `T${i + 1}`,
      round: `Vòng ${roundNumber}`,
      court: `Sân ${courtNumber}`,
      category: chosenCat,
      teamA,
      teamB,
      scoreA: null,
      scoreB: null,
      status: 'upcoming'
    });
  }

  state.matches = newMatches;
  saveState();
  renderAll();
  showToast(`Đã tạo ${newMatches.length} trận đấu mới theo thể thức 21 điểm quốc tế!`);
}

function autoGenerateMatchesAndSwitch() {
  if (!isAdmin()) return;
  generateWeeklyMatches();
  switchTab('matches');
}

function setMatchCategoryFilter(cat) {
  currentMatchFilter = cat;
  document.querySelectorAll('.match-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-mfilter') === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderMatchesTab();
}

function renderMatchesTab() {
  const admin = isAdmin();
  document.getElementById('matchTabTotalBadge').textContent = `${state.matches.length} trận`;

  const filtered = state.matches.filter(
    m => currentMatchFilter === 'ALL' || m.category === currentMatchFilter
  );

  const grid = document.getElementById('matchesGridContainer');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-[#0b1021] border border-[#192342] rounded-2xl p-8 text-center text-slate-400">
        Không có trận đấu nào thuộc phân loại này.
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(m => {
      const cat = getCategoryBadge(m.category);
      const a1 = getMemberById(m.teamA[0]);
      const a2 = getMemberById(m.teamA[1]);
      const b1 = getMemberById(m.teamB[0]);
      const b2 = getMemberById(m.teamB[1]);

      const isDone = m.status === 'done';
      const aWon = isDone && Number(m.scoreA) > Number(m.scoreB);
      const bWon = isDone && Number(m.scoreB) > Number(m.scoreA);
      const isDeuceGame = isDone && (Number(m.scoreA) >= 22 || Number(m.scoreB) >= 22);

      // Both User & Admin have full permission to enter and adjust match scores!
      const scoreInputA = `<input
        type="number"
        inputmode="numeric"
        min="0"
        max="30"
        placeholder="-"
        title="Nhập điểm Đội 1 (0 - 30)"
        value="${m.scoreA !== null ? m.scoreA : ''}"
        onchange="updateMatchScore('${m.id}', 'A', this.value)"
        class="score-input w-14 h-10 text-center rounded-xl bg-[#080d1c] border border-[#293f7d] hover:border-blue-400/70 text-base font-black text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
      />`;

      const scoreInputB = `<input
        type="number"
        inputmode="numeric"
        min="0"
        max="30"
        placeholder="-"
        title="Nhập điểm Đội 2 (0 - 30)"
        value="${m.scoreB !== null ? m.scoreB : ''}"
        onchange="updateMatchScore('${m.id}', 'B', this.value)"
        class="score-input w-14 h-10 text-center rounded-xl bg-[#080d1c] border border-[#293f7d] hover:border-blue-400/70 text-base font-black text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
      />`;

      return `
        <div class="bg-[#0b1021] hover:bg-[#0e152c] border ${isDone ? 'border-emerald-500/30' : 'border-[#1d2b54]'} rounded-[22px] p-5 flex flex-col justify-between transition-all shadow-lg">
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-black text-xs">${m.id}</span>
                <span class="px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${cat.classes}">${cat.label}</span>
                ${isDeuceGame ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Deuce +2</span>' : ''}
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <span>${m.court} · ${m.round}</span>
                ${admin ? `<button onclick="deleteMatch('${m.id}')" title="Xóa trận này" class="text-slate-500 hover:text-rose-400">✕</button>` : ''}
              </div>
            </div>

            <div class="p-3 rounded-xl ${aWon ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#0f1730] border border-[#1d2c59]'} flex items-center justify-between mb-2">
              <div>
                <div class="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>${a1.name}</span>
                  <span class="text-slate-500">+</span>
                  <span>${a2.name}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  ${a1.gender === 'M' ? 'Nam' : 'Nữ'} (Hạng ${a1.skill}) &amp; ${a2.gender === 'M' ? 'Nam' : 'Nữ'} (Hạng ${a2.skill})
                </div>
              </div>
              ${scoreInputA}
            </div>

            <div class="p-3 rounded-xl ${bWon ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#0f1730] border border-[#1d2c59]'} flex items-center justify-between">
              <div>
                <div class="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>${b1.name}</span>
                  <span class="text-slate-500">+</span>
                  <span>${b2.name}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  ${b1.gender === 'M' ? 'Nam' : 'Nữ'} (Hạng ${b1.skill}) &amp; ${b2.gender === 'M' ? 'Nam' : 'Nữ'} (Hạng ${b2.skill})
                </div>
              </div>
              ${scoreInputB}
            </div>
          </div>

          <div class="flex items-center justify-between mt-3.5 pt-3 border-t border-[#162244] text-xs">
            <span class="${isDone ? 'text-emerald-400 font-bold' : 'text-amber-300 font-semibold'}">
              ${isDone ? `✓ Kết thúc (${m.scoreA} – ${m.scoreB})` : '⏳ Nhập tỉ số (Chạm 21)'}
            </span>
            <div class="flex items-center gap-2">
              ${isDone ? `<button onclick="clearMatchScore('${m.id}')" class="text-slate-500 hover:text-rose-400 font-semibold" title="Đặt lại tỉ số">Đặt lại</button>` : ''}
              <button onclick="quickRandomScore('${m.id}')" class="text-blue-400 hover:text-blue-300 font-semibold">
                ${isDone ? 'Đổi tỉ số' : 'Điền nhanh 21đ'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const freqMap = {};
  state.members.forEach(m => { freqMap[m.id] = 0; });
  state.matches.forEach(m => {
    [...m.teamA, ...m.teamB].forEach(pid => {
      if (freqMap[pid] !== undefined) freqMap[pid]++;
    });
  });

  const freqBar = document.getElementById('playerMatchFrequencyBar');
  freqBar.innerHTML = state.members.map(m => {
    const count = freqMap[m.id] || 0;
    return `
      <div class="px-3 py-1.5 rounded-xl bg-[#0f1730] border border-[#1f2e5c] text-xs flex items-center gap-2 whitespace-nowrap">
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${m.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}">${m.gender === 'M' ? 'Nam' : 'Nữ'}</span>
        <span class="font-semibold text-slate-200">${m.name}</span>
        <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[11px]">${count} trận</span>
      </div>
    `;
  }).join('');
}

function updateMatchScore(matchId, team, val) {
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;
  const num = val === '' ? null : parseInt(val, 10);
  if (team === 'A') match.scoreA = num;
  if (team === 'B') match.scoreB = num;

  if (match.scoreA !== null && match.scoreB !== null && !isNaN(match.scoreA) && !isNaN(match.scoreB)) {
    const check = validateBadmintonScore(match.scoreA, match.scoreB);
    if (!check.valid) {
      match.status = 'upcoming';
      showToast(`⚠️ Tỉ số ${match.scoreA}–${match.scoreB} chưa kết thúc đúng luật: ${check.reason}`);
    } else {
      match.status = 'done';
      showToast(`✓ Đã cập nhật tỉ số trận ${match.id}: ${match.scoreA}–${match.scoreB}`);
    }
  } else {
    match.status = 'upcoming';
  }
  saveState();
  renderAll();
}

function quickRandomScore(matchId) {
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;
  const sampleScores = [
    [21, 17],
    [21, 18],
    [21, 19],
    [22, 20],
    [23, 21],
    [24, 22]
  ];
  const pick = sampleScores[Math.floor(Math.random() * sampleScores.length)];
  if (Math.random() > 0.5) {
    match.scoreA = pick[0];
    match.scoreB = pick[1];
  } else {
    match.scoreA = pick[1];
    match.scoreB = pick[0];
  }
  match.status = 'done';
  saveState();
  renderAll();
  showToast(`✓ Đã cập nhật tỉ số trận ${match.id}: ${match.scoreA}–${match.scoreB}`);
}

function clearMatchScore(matchId) {
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;
  match.scoreA = null;
  match.scoreB = null;
  match.status = 'upcoming';
  saveState();
  renderAll();
  showToast(`Đã đặt lại tỉ số trận ${match.id} về trạng thái chờ thi đấu.`);
}

function deleteMatch(matchId) {
  if (!isAdmin()) return;
  state.matches = state.matches.filter(m => m.id !== matchId);
  saveState();
  renderAll();
  showToast(`Đã xóa trận ${matchId}`);
}

function toggleManualMatchModal() {
  if (!isAdmin()) return;
  const modal = document.getElementById('manualMatchModal');
  if (!modal) return;
  const isHidden = modal.classList.contains('hidden');
  if (isHidden) {
    const opts = state.members.map(
      m => `<option value="${m.id}" class="bg-[#0b1021]">${m.name} (${m.gender === 'M' ? 'Nam' : 'Nữ'} · Hạng ${m.skill})</option>`
    ).join('');
    ['manualTeamA1', 'manualTeamA2', 'manualTeamB1', 'manualTeamB2'].forEach((selId, idx) => {
      const el = document.getElementById(selId);
      if (el) {
        el.innerHTML = opts;
        if (state.members[idx]) el.value = state.members[idx].id;
      }
    });
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

function handleManualMatchSubmit(e) {
  e.preventDefault();
  if (!isAdmin()) return;
  const cat = document.getElementById('manualMatchCategory').value;
  const court = document.getElementById('manualMatchCourt').value;
  const a1 = document.getElementById('manualTeamA1').value;
  const a2 = document.getElementById('manualTeamA2').value;
  const b1 = document.getElementById('manualTeamB1').value;
  const b2 = document.getElementById('manualTeamB2').value;

  const unique = new Set([a1, a2, b1, b2]);
  if (unique.size < 4) {
    showToast('Vui lòng chọn 4 thành viên khác nhau cho 1 trận đấu đôi!');
    return;
  }

  const nextId = `T${state.matches.length + 1}`;
  state.matches.push({
    id: nextId,
    round: `Vòng ${Math.ceil((state.matches.length + 1) / 3)}`,
    court,
    category: cat,
    teamA: [a1, a2],
    teamB: [b1, b2],
    scoreA: null,
    scoreB: null,
    status: 'upcoming'
  });

  saveState();
  toggleManualMatchModal();
  renderAll();
  showToast(`Đã thêm trận ${nextId} thành công!`);
}

// ============================================================================
// TAB 4: COST CALCULATOR (ADMIN PAID AMOUNT & DEBT MANAGEMENT)
// ============================================================================
function renderCostsTab() {
  const admin = isAdmin();
  const c = state.costs;
  const calc = calculateSessionCosts();

  if (admin) {
    document.getElementById('costCourtsCount').value = c.courtsCount;
    document.getElementById('costCourtHours').value = c.courtHours;
    document.getElementById('costCourtRate').value = c.courtRate;
    document.getElementById('costShuttleCount').value = c.shuttleCount;
    document.getElementById('costShuttlePrice').value = c.shuttlePrice;
    document.getElementById('costSplitMode').value = c.splitMode;
    document.getElementById('costRoundThousand').checked = c.roundThousand;

    document.getElementById('costTotalBadge').textContent = formatVND(calc.sharedTotal);
    document.getElementById('courtCostSubtotal').textContent = formatVND(calc.courtSubtotal);
    document.getElementById('shuttleCostSubtotal').textContent = formatVND(calc.shuttleSubtotal);
    document.getElementById('extraCostSubtotal').textContent = formatVND(calc.extraSubtotal);

    const extraList = document.getElementById('extraExpensesList');
    if (extraList) {
      extraList.innerHTML = (c.extraExpenses || []).map(item => `
        <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-[#090e1f] border border-[#1d2b56] text-xs">
          <span class="text-slate-200 font-medium">${item.name}</span>
          <div class="flex items-center gap-2.5">
            <span class="font-bold text-purple-300">${formatVND(item.amount)}</span>
            <button onclick="removeExtraExpenseItem('${item.id}')" class="text-slate-500 hover:text-rose-400 font-bold">✕</button>
          </div>
        </div>
      `).join('');
    }
  } else {
    const mini = document.getElementById('userCostBreakdownMini');
    if (mini) {
      mini.textContent = `Sân: ${formatVND(calc.courtSubtotal)} · Cầu: ${formatVND(calc.shuttleSubtotal)} · Phụ phí: ${formatVND(calc.extraSubtotal)}`;
    }
  }

  document.getElementById('billTotalCost').textContent = formatVND(calc.sharedTotal);
  document.getElementById('billAvgPerPerson').textContent = formatVND(calc.avgPerPerson);
  document.getElementById('billCollectedAmount').textContent = formatVND(calc.totalCollected);
  document.getElementById('billRemainingAmount').textContent = formatVND(calc.totalRemaining);

  const tbody = document.getElementById('costMemberBreakdownBody');
  tbody.innerHTML = state.members.map((m, idx) => {
    const share = calc.memberShares[m.id] || { baseShare: 0, extraFee: 0, totalDue: 0, amountPaid: 0, debtAmount: 0 };

    const extraFeeCell = admin
      ? `<input
          type="number"
          inputmode="numeric"
          step="5000"
          min="0"
          value="${m.extraFee || 0}"
          onchange="updateMemberExtraFee('${m.id}', this.value)"
          class="w-20 px-2 py-1 rounded-lg bg-[#090e1f] border border-[#243569] text-xs font-bold text-amber-300"
        />`
      : `<span class="text-xs font-semibold text-amber-300">${formatVND(share.extraFee)}</span>`;

    const amountPaidCell = admin
      ? `<input
          type="number"
          inputmode="numeric"
          step="5000"
          min="0"
          value="${share.amountPaid}"
          onchange="updateMemberAmountPaid('${m.id}', this.value)"
          class="w-24 px-2.5 py-1.5 rounded-lg bg-[#090e1f] border border-emerald-500/40 text-xs font-extrabold text-emerald-300 focus:outline-none focus:border-emerald-400"
        />`
      : `<span class="font-extrabold text-emerald-400">${formatVND(share.amountPaid)}</span>`;

    const debtCell = share.debtAmount > 0
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold whitespace-nowrap">
           Nợ ${formatVND(share.debtAmount)}
         </span>`
      : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap">
           0đ (Đã đủ)
         </span>`;

    const adminActionCell = admin
      ? `<td class="py-3 px-2.5 text-right whitespace-nowrap">
           <button onclick="setMemberFullPaid('${m.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold mr-1 whitespace-nowrap">
             Trả đủ
           </button>
           <button onclick="setMemberZeroPaid('${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold whitespace-nowrap">
             Ghi nợ
           </button>
         </td>`
      : '';

    return `
      <tr class="hover:bg-[#0f1730]/60 transition-colors">
        <td class="py-3 px-2.5 text-xs font-bold text-slate-400 whitespace-nowrap">${idx + 1}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${m.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}">${m.gender === 'M' ? 'Nam' : 'Nữ'}</span>
            <span>${m.name}</span>
          </div>
          <div class="text-[10px] text-slate-400">${m.type === 'fixed' ? 'Cố định' : 'Vãng lai'}</div>
        </td>
        <td class="py-3 px-2.5 font-semibold text-slate-200 whitespace-nowrap">${formatVND(share.baseShare)}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">${extraFeeCell}</td>
        <td class="py-3 px-2.5 font-black text-white text-sm whitespace-nowrap">${formatVND(share.totalDue)}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">${amountPaidCell}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">${debtCell}</td>
        ${adminActionCell}
      </tr>
    `;
  }).join('');
}

function handleCostInputChange() {
  if (!isAdmin()) return;
  state.costs.courtsCount = Number(document.getElementById('costCourtsCount').value) || 0;
  state.costs.courtHours = Number(document.getElementById('costCourtHours').value) || 0;
  state.costs.courtRate = Number(document.getElementById('costCourtRate').value) || 0;
  state.costs.shuttleCount = Number(document.getElementById('costShuttleCount').value) || 0;
  state.costs.shuttlePrice = Number(document.getElementById('costShuttlePrice').value) || 0;
  state.costs.splitMode = document.getElementById('costSplitMode').value;
  state.costs.roundThousand = document.getElementById('costRoundThousand').checked;

  saveState();
  renderAll();
}

function adjustShuttleCount(delta) {
  if (!isAdmin()) return;
  state.costs.shuttleCount = Math.max(0, (Number(state.costs.shuttleCount) || 0) + delta);
  saveState();
  renderAll();
}

function addExtraExpenseItem() {
  if (!isAdmin()) return;
  const nameEl = document.getElementById('newExpenseName');
  const amountEl = document.getElementById('newExpenseAmount');
  const name = nameEl.value.trim();
  const amount = Number(amountEl.value) || 0;
  if (!name || amount <= 0) {
    showToast('Vui lòng nhập tên khoản chi phụ và số tiền hợp lệ!');
    return;
  }
  state.costs.extraExpenses.push({
    id: 'ex' + Date.now(),
    name,
    amount
  });
  nameEl.value = '';
  amountEl.value = '';
  saveState();
  renderAll();
  showToast(`Đã thêm khoản chi "${name}" (${formatVND(amount)})`);
}

function removeExtraExpenseItem(id) {
  if (!isAdmin()) return;
  state.costs.extraExpenses = state.costs.extraExpenses.filter(item => item.id !== id);
  saveState();
  renderAll();
}

function updateMemberExtraFee(memberId, value) {
  if (!isAdmin()) return;
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;
  member.extraFee = Math.max(0, Number(value) || 0);
  saveState();
  renderAll();
}

function updateMemberAmountPaid(memberId, value) {
  if (!isAdmin()) return;
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;
  member.amountPaid = Math.max(0, Number(value) || 0);
  saveState();
  renderAll();
  const calc = calculateSessionCosts();
  const share = calc.memberShares[memberId];
  showToast(
    `${member.name}: Đã trả ${formatVND(member.amountPaid)} · Tiền nợ: ${formatVND(share ? share.debtAmount : 0)}`
  );
}

function setMemberFullPaid(memberId) {
  if (!isAdmin()) return;
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;
  const calc = calculateSessionCosts();
  const share = calc.memberShares[memberId];
  member.amountPaid = share ? share.totalDue : 0;
  member.paid = true;
  saveState();
  renderAll();
  showToast(`✓ ${member.name} đã thanh toán đủ ${formatVND(member.amountPaid)} (Nợ: 0đ)`);
}

function setMemberZeroPaid(memberId) {
  if (!isAdmin()) return;
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;
  member.amountPaid = 0;
  member.paid = false;
  saveState();
  renderAll();
  const calc = calculateSessionCosts();
  const share = calc.memberShares[memberId];
  showToast(`⏳ Đã ghi nợ cho ${member.name}: Nợ ${formatVND(share ? share.debtAmount : 0)}`);
}

function markAllPaid(status) {
  if (!isAdmin()) return;
  const calc = calculateSessionCosts();
  state.members.forEach(m => {
    const share = calc.memberShares[m.id];
    m.amountPaid = status && share ? share.totalDue : 0;
    m.paid = Boolean(status);
  });
  saveState();
  renderAll();
  showToast('Đã cập nhật tất cả thành viên hoàn tất thanh toán (Tiền nợ = 0đ)!');
}

function copyTextCrossBrowser(text, onSuccess) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopyText(text, onSuccess));
  } else {
    fallbackCopyText(text, onSuccess);
  }
}

function fallbackCopyText(text, onSuccess) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (onSuccess) onSuccess();
  } catch (e) {
    showToast('Không thể copy tự động trên trình duyệt này.');
  }
}

function copyBillSummaryToClipboard() {
  const calc = calculateSessionCosts();
  const lines = [
    `🏸 BÁO CÁO TÀI CHÍNH & TIỀN NỢ — ${state.settings.clubName} (giaoluucaulong.vn)`,
    `📅 Ngày: ${state.settings.sessionDate} (${state.settings.sessionTime})`,
    `📍 Sân: ${state.settings.courtLocation}`,
    `--------------------------------`,
    `1. Tiền sân (${state.costs.courtsCount} sân × ${state.costs.courtHours}h): ${formatVND(calc.courtSubtotal)}`,
    `2. Tiền cầu (${state.costs.shuttleCount} quả × ${formatVND(state.costs.shuttlePrice)}): ${formatVND(calc.shuttleSubtotal)}`,
    `3. Chi phí phụ: ${formatVND(calc.extraSubtotal)}`,
    `👉 TỔNG CHI PHÍ: ${formatVND(calc.sharedTotal)}`,
    `✅ ĐÃ THU: ${formatVND(calc.totalCollected)} | ❌ CÒN NỢ: ${formatVND(calc.totalRemaining)}`,
    `--------------------------------`,
    `📋 CHI TIẾT ĐÃ TRẢ & TIỀN NỢ (${state.members.length} thành viên):`
  ];

  state.members.forEach((m, i) => {
    const s = calc.memberShares[m.id] || { totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const statusText = s.debtAmount === 0
      ? `✅ Đã trả đủ (${formatVND(s.amountPaid)})`
      : `⏳ Đã trả: ${formatVND(s.amountPaid)} | Còn nợ: ${formatVND(s.debtAmount)}`;
    lines.push(`${i + 1}. ${m.name} — Phải đóng: ${formatVND(s.totalDue)} → ${statusText}`);
  });

  copyTextCrossBrowser(lines.join('\n'), () => {
    showToast('Đã copy bảng tổng hợp Đã trả & Tiền nợ! Bạn có thể dán ngay vào nhóm Zalo.');
  });
}

// ============================================================================
// TAB 5: STANDINGS / BXH
// ============================================================================
function renderStandingsTab() {
  const stats = {};
  state.members.forEach(m => {
    stats[m.id] = {
      member: m,
      played: 0,
      wins: 0,
      losses: 0,
      pointsDiff: 0,
      ratingPoints: 0
    };
  });

  state.matches.forEach(match => {
    if (match.status !== 'done' || match.scoreA === null || match.scoreB === null) return;
    const sA = Number(match.scoreA);
    const sB = Number(match.scoreB);
    const diff = sA - sB;

    match.teamA.forEach(pid => {
      if (!stats[pid]) return;
      stats[pid].played++;
      stats[pid].pointsDiff += diff;
      if (sA > sB) {
        stats[pid].wins++;
        stats[pid].ratingPoints += 3;
      } else {
        stats[pid].losses++;
        stats[pid].ratingPoints += 1;
      }
    });

    match.teamB.forEach(pid => {
      if (!stats[pid]) return;
      stats[pid].played++;
      stats[pid].pointsDiff -= diff;
      if (sB > sA) {
        stats[pid].wins++;
        stats[pid].ratingPoints += 3;
      } else {
        stats[pid].losses++;
        stats[pid].ratingPoints += 1;
      }
    });
  });

  const sorted = Object.values(stats).sort((a, b) => {
    if (b.ratingPoints !== a.ratingPoints) return b.ratingPoints - a.ratingPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointsDiff - a.pointsDiff;
  });

  const tbody = document.getElementById('standingsTableBody');
  tbody.innerHTML = sorted.map((row, idx) => {
    const m = row.member;
    const rankBadge = idx === 0
      ? `<span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-xs">1</span>`
      : idx === 1
      ? `<span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-xs">2</span>`
      : idx === 2
      ? `<span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-700 text-white font-black text-xs">3</span>`
      : `<span class="text-slate-400 font-bold pl-2">${idx + 1}</span>`;

    return `
      <tr class="hover:bg-[#0f1730]/60 transition-colors">
        <td class="py-3.5 px-3 sm:px-4 whitespace-nowrap">${rankBadge}</td>
        <td class="py-3.5 px-3 sm:px-4 font-bold text-white whitespace-nowrap">${m.name}</td>
        <td class="py-3.5 px-3 sm:px-4 text-xs whitespace-nowrap">
          <span class="${m.gender === 'M' ? 'text-blue-300' : 'text-pink-300'} font-semibold whitespace-nowrap">
            ${m.gender === 'M' ? 'Nam' : 'Nữ'} · Hạng ${m.skill}
          </span>
        </td>
        <td class="py-3.5 px-3 sm:px-4 font-semibold text-slate-300 whitespace-nowrap">${row.played} trận</td>
        <td class="py-3.5 px-3 sm:px-4 font-bold whitespace-nowrap">
          <span class="text-emerald-400">${row.wins}T</span> - <span class="text-rose-400">${row.losses}B</span>
        </td>
        <td class="py-3.5 px-3 sm:px-4 font-bold whitespace-nowrap ${row.pointsDiff >= 0 ? 'text-blue-300' : 'text-rose-300'}">
          ${row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
        </td>
        <td class="py-3.5 px-3 sm:px-4 text-right font-black text-amber-300 text-base whitespace-nowrap">${row.ratingPoints} đ</td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// TAB 6: SESSION SETTINGS & CALENDAR DATE PICKER (ADMIN)
// ============================================================================
function renderSettingsTab() {
  if (!isAdmin()) return;
  const clubEl = document.getElementById('settingClubName');
  const dateISOEl = document.getElementById('settingSessionDateISO');
  const dateDispEl = document.getElementById('settingSessionDateDisplay');
  const timeEl = document.getElementById('settingSessionTime');
  const locEl = document.getElementById('settingCourtLocation');
  const maxEl = document.getElementById('settingMaxPlayers');

  if (clubEl) clubEl.value = state.settings.clubName;
  if (dateISOEl) dateISOEl.value = state.settings.sessionDateISO || '2026-11-14';
  if (dateDispEl) dateDispEl.textContent = state.settings.sessionDate;
  if (timeEl) timeEl.value = state.settings.sessionTime;
  if (locEl) locEl.value = state.settings.courtLocation;
  if (maxEl) maxEl.value = state.settings.maxPlayers;
}

function saveSessionSettings() {
  if (!isAdmin()) return;
  state.settings.clubName = document.getElementById('settingClubName').value.trim() || 'Giao lưu cầu lông cuối tuần';
  const isoVal = document.getElementById('settingSessionDateISO')?.value;
  if (isoVal) {
    state.settings.sessionDateISO = isoVal;
    state.settings.sessionDate = formatISOToVietnameseDate(isoVal);
  }
  state.settings.sessionTime = document.getElementById('settingSessionTime').value.trim() || '19:00 - 21:00';
  state.settings.courtLocation = document.getElementById('settingCourtLocation').value.trim() || 'Sân Cầu Lông CLB';
  state.settings.maxPlayers = Number(document.getElementById('settingMaxPlayers').value) || 16;

  saveState();
  renderAll();
  showToast('✓ Đã lưu ngày đánh & thông tin cấu hình tuần!');
}

function resetNewWeekSession() {
  if (!isAdmin()) return;
  if (!Array.isArray(state.savedMembers)) state.savedMembers = [];
  // Lưu toàn bộ thành viên tuần hiện tại vào danh sách tuần trước để đăng ký nhanh
  state.members.forEach(m => syncMemberToSavedRoster(m, state.savedMembers));
  // Làm mới danh sách tuần mới và tỉ số trận đấu
  state.members = [];
  state.matches = [];
  saveState();
  renderAll();
  showToast(`✓ Đã lưu ${state.savedMembers.length} thành viên tuần trước & làm mới danh sách cho tuần tiếp theo!`);
}

function openQuickRegisterModal() {
  switchTab('register');
  setTimeout(() => {
    const input = document.getElementById('regName');
    if (input) input.focus();
  }, 100);
}

// ============================================================================
// NAVIGATION, LIVE CLOCK & TOAST
// ============================================================================
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) activePanel.classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderAll();
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const text = document.getElementById('toastMessage');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3800);
}

function updateLiveClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');

  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');
  if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
  if (dateEl) dateEl.textContent = `${dayName}, ${dd}/${mo}`;
}

function renderAll() {
  renderHeroBanner();
  renderOverviewTab();
  renderRegistrationTab();
  renderMatchesTab();
  renderCostsTab();
  renderStandingsTab();
  renderSettingsTab();
}

// 1. Same-browser storage event listener
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    state = loadState();
    renderAll();
  }
});

// 2. BroadcastChannel instant listener
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'STATE_UPDATED' && event.data.state) {
      const incoming = normalizeStateObject(event.data.state);
      if (incoming) {
        state = incoming;
        renderAll();
      }
    }
  };
}

// 3. Visibility & focus listeners (immediately sync when switching browser windows)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    pullStateFromServer(false);
  }
});
window.addEventListener('focus', () => {
  pullStateFromServer(false);
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Pull authoritative state from central server immediately & poll every 1s
  pullStateFromServer(true);
  setInterval(() => pullStateFromServer(false), 1000);

  heroAutoplayInterval = setInterval(() => {
    if (isHeroPlaying) nextHeroSlide();
  }, 7000);
});
