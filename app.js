// Giao lưu cầu lông cuối tuần — Tên miền nội bộ chuẩn Việt Nam: giaoluucaulong.vn
// Real-time Cross-Browser Synchronization Engine (Chrome, Edge, Firefox, Safari, Brave, Cốc Cốc, Mobile)

const STORAGE_KEY = 'giaoluucaulongcuoituan_state_v6';
const SYNC_CHANNEL_NAME = 'giaoluucaulongcuoituan_sync_v6';
const MQTT_TOPIC = 'giaoluucaulongcuoituan/state/v2';
const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt'
];
const IS_STATIC_CLOUD_HOST =
  window.location.hostname.indexOf('github.io') !== -1 ||
  window.location.hostname.indexOf('pages.dev') !== -1 ||
  window.location.hostname.indexOf('netlify.app') !== -1 ||
  window.location.hostname.indexOf('vercel.app') !== -1;

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

// Default initial state matching live club_data.json
function getDefaultState() {
  const defaultISO = '2026-11-14';
  return {
    _rev: 53,
    _updatedAt: 1794144377966,
    savedMembers: [
      { name: 'Thiên Minh', gender: 'M', skill: 'A', type: 'fixed', note: '' },
      { name: 'Vịt', gender: 'M', skill: 'A', type: 'fixed', note: '' },
      { name: 'tuyền', gender: 'F', skill: 'B', type: 'fixed', note: '' },
      { name: 'Hiếu', gender: 'M', skill: 'A', type: 'fixed', note: '' }
    ],
    settings: {
      clubName: 'Giao lưu cầu lông cuối tuần',
      domainName: 'giaoluucaulongcuoituan',
      sessionDateISO: defaultISO,
      sessionDate: formatISOToVietnameseDate(defaultISO),
      sessionTime: '18:00 - 20:00',
      courtLocation: 'Sân Cầu Lông Thanh Yến',
      maxPlayers: 14
    },
    members: [
      { id: 'm1794139132378', name: 'Thiên Minh', gender: 'M', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm1794139135711', name: 'Vịt', gender: 'M', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm1794141493235', name: 'tuyền', gender: 'F', skill: 'B', type: 'fixed', extraFee: 0, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: '' },
      { id: 'm1794141555013', name: 'Hiếu', gender: 'M', skill: 'A', type: 'fixed', extraFee: 0, amountPaid: 0, paid: false, playDate: 'Thứ 7 · 14/11/2026', note: '' }
    ],
    costs: {
      courtsCount: 1,
      courtHours: 5,
      courtRate: 130000,
      shuttleCount: 8,
      shuttlePrice: 26000,
      extraExpenses: [],
      splitMode: 'equal',
      roundThousand: true
    },
    debtLogs: [],
    matches: [
      { id: 'T1', round: 'Vòng 1', court: 'Sân 1', category: 'FREE', teamA: ['m1794139135711', 'm1794141493235'], teamB: ['m1794139132378', 'm1794141555013'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T2', round: 'Vòng 1', court: 'Sân 2', category: 'FREE', teamA: ['m1794141555013', 'm1794141493235'], teamB: ['m1794139132378', 'm1794139135711'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T3', round: 'Vòng 1', court: 'Sân 3', category: 'FREE', teamA: ['m1794141555013', 'm1794141493235'], teamB: ['m1794139132378', 'm1794139135711'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T4', round: 'Vòng 2', court: 'Sân 1', category: 'FREE', teamA: ['m1794141555013', 'm1794141493235'], teamB: ['m1794139132378', 'm1794139135711'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T5', round: 'Vòng 2', court: 'Sân 2', category: 'FREE', teamA: ['m1794139135711', 'm1794141493235'], teamB: ['m1794139132378', 'm1794141555013'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T6', round: 'Vòng 2', court: 'Sân 3', category: 'FREE', teamA: ['m1794139132378', 'm1794141493235'], teamB: ['m1794141555013', 'm1794139135711'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T7', round: 'Vòng 3', court: 'Sân 1', category: 'FREE', teamA: ['m1794141555013', 'm1794141493235'], teamB: ['m1794139135711', 'm1794139132378'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T8', round: 'Vòng 3', court: 'Sân 2', category: 'FREE', teamA: ['m1794139135711', 'm1794141493235'], teamB: ['m1794139132378', 'm1794141555013'], scoreA: null, scoreB: null, status: 'upcoming' },
      { id: 'T9', round: 'Vòng 3', court: 'Sân 3', category: 'FREE', teamA: ['m1794141555013', 'm1794141493235'], teamB: ['m1794139132378', 'm1794139135711'], scoreA: null, scoreB: null, status: 'upcoming' }
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
  if (!Array.isArray(parsed.debtLogs)) {
    parsed.debtLogs = [];
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

// ============================================================================
// REAL-TIME CLOUD WEBSOCKET ENGINE (MQTT Retained State over WSS)
// Syncs instantly (<100ms) across GitHub Pages, 4G/5G, Wi-Fi, Safari & Chrome
// ============================================================================
const activeMqttSockets = [];
let hasReceivedInitialCloudState = false;
let lastLocalSaveTimestamp = 0;

function mqttEncodeLength(len) {
  const out = [];
  do {
    let digit = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) digit |= 0x80;
    out.push(digit);
  } while (len > 0);
  return out;
}

function mqttEncodeString(str) {
  const bytes = new TextEncoder().encode(str);
  return [(bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
}

function buildMqttConnectPacket(clientId) {
  const body = [
    ...mqttEncodeString('MQTT'),
    0x04, // MQTT v3.1.1
    0x02, // Clean session
    0x00, 0x3c, // Keep-alive 60s
    ...mqttEncodeString(clientId)
  ];
  return new Uint8Array([0x10, ...mqttEncodeLength(body.length), ...body]);
}

function buildMqttSubscribePacket(topic, packetId) {
  const body = [
    (packetId >> 8) & 0xff,
    packetId & 0xff,
    ...mqttEncodeString(topic),
    0x00 // QoS 0
  ];
  return new Uint8Array([0x82, ...mqttEncodeLength(body.length), ...body]);
}

function buildMqttPublishRetainedPacket(topic, jsonStr) {
  const topicBytes = mqttEncodeString(topic);
  const payloadBytes = new TextEncoder().encode(jsonStr);
  const remLen = topicBytes.length + payloadBytes.length;
  const header = [0x31, ...mqttEncodeLength(remLen)]; // 0x31 = PUBLISH, Retain=1
  const packet = new Uint8Array(header.length + remLen);
  packet.set(header, 0);
  packet.set(topicBytes, header.length);
  packet.set(payloadBytes, header.length + topicBytes.length);
  return packet;
}

function handleIncomingCloudState(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    const remoteState = normalizeStateObject(parsed);
    if (!remoteState) return;

    const activeEl = document.activeElement;
    const isEditingTableInput =
      hasReceivedInitialCloudState &&
      activeEl &&
      activeEl.tagName === 'INPUT' &&
      ((activeEl.type === 'number' &&
        activeEl.id !== 'regExtraFee' &&
        activeEl.id !== 'newExpenseAmount' &&
        activeEl.id !== 'debtLogAmountInput') ||
        activeEl.id === 'costCourtHours');

    if (isEditingTableInput) return;

    const isDifferent =
      remoteState._updatedAt !== state._updatedAt ||
      remoteState._rev !== state._rev;

    const isAcceptable =
      !hasReceivedInitialCloudState ||
      remoteState._updatedAt >= lastLocalSaveTimestamp ||
      remoteState._rev > (state._rev || 0);

    hasReceivedInitialCloudState = true;
    if (isDifferent && isAcceptable) {
      state = remoteState;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
      renderAll();
    }
    updateSyncBadgeUI('server');
  } catch (e) {}
}

function connectMqttBroker(brokerUrl, index) {
  let ws = null;
  let pingTimer = null;
  let rxBuffer = new Uint8Array(0);
  const clientId = `glcl_${index}_${Math.random().toString(36).substring(2, 10)}`;

  try {
    ws = new WebSocket(brokerUrl, 'mqtt');
    ws.binaryType = 'arraybuffer';
  } catch (e) {
    setTimeout(() => connectMqttBroker(brokerUrl, index), 4000);
    return;
  }

  const entry = { ws, ready: false, url: brokerUrl };
  activeMqttSockets[index] = entry;

  ws.onopen = () => {
    try {
      ws.send(buildMqttConnectPacket(clientId));
    } catch (e) {}
  };

  ws.onmessage = (event) => {
    const incoming = new Uint8Array(event.data);
    const combined = new Uint8Array(rxBuffer.length + incoming.length);
    combined.set(rxBuffer, 0);
    combined.set(incoming, rxBuffer.length);
    rxBuffer = combined;

    let offset = 0;
    while (offset < rxBuffer.length) {
      if (rxBuffer.length - offset < 2) break;
      const cmd = rxBuffer[offset];
      let multiplier = 1;
      let remLen = 0;
      let lenBytes = 0;
      let idx = offset + 1;
      let completeLen = false;

      while (idx < rxBuffer.length && lenBytes < 4) {
        const b = rxBuffer[idx++];
        remLen += (b & 127) * multiplier;
        multiplier *= 128;
        lenBytes++;
        if ((b & 128) === 0) {
          completeLen = true;
          break;
        }
      }
      if (!completeLen) break;
      const packetEnd = idx + remLen;
      if (rxBuffer.length < packetEnd) break;

      const packetType = cmd & 0xf0;
      if (packetType === 0x20) {
        // CONNACK -> Subscribe immediately to retained state topic
        entry.ready = true;
        updateSyncBadgeUI('server');
        try {
          ws.send(buildMqttSubscribePacket(MQTT_TOPIC, 1));
        } catch (e) {}
      } else if (packetType === 0x30) {
        // PUBLISH -> Extract UTF-8 JSON state
        const qos = (cmd >> 1) & 0x03;
        const topicLen = (rxBuffer[idx] << 8) | rxBuffer[idx + 1];
        let payloadStart = idx + 2 + topicLen;
        if (qos > 0) payloadStart += 2;
        if (payloadStart <= packetEnd) {
          const payloadBytes = rxBuffer.subarray(payloadStart, packetEnd);
          const jsonText = new TextDecoder('utf-8').decode(payloadBytes);
          handleIncomingCloudState(jsonText);
        }
      }
      offset = packetEnd;
    }
    if (offset > 0) {
      rxBuffer = rxBuffer.slice(offset);
    }
  };

  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN && entry.ready) {
      try {
        ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
      } catch (e) {}
    }
  }, 25000);

  ws.onclose = () => {
    entry.ready = false;
    clearInterval(pingTimer);
    setTimeout(() => connectMqttBroker(brokerUrl, index), 3500);
  };

  ws.onerror = () => {
    try {
      ws.close();
    } catch (e) {}
  };
}

function initCloudRealtimeSync() {
  MQTT_BROKERS.forEach((url, idx) => connectMqttBroker(url, idx));
}

function publishStateToCloudBrokers(stateObj) {
  const bodyStr = JSON.stringify(stateObj);
  const packet = buildMqttPublishRetainedPacket(MQTT_TOPIC, bodyStr);
  let sentCount = 0;
  activeMqttSockets.forEach(entry => {
    if (entry && entry.ready && entry.ws && entry.ws.readyState === WebSocket.OPEN) {
      try {
        entry.ws.send(packet);
        sentCount++;
      } catch (e) {}
    }
  });
  return sentCount > 0;
}

// Save to Cloud Retained Brokers + Server API (/api/state) + localStorage + BroadcastChannel
function saveState() {
  state._updatedAt = Date.now();
  state._rev = (Number(state._rev) || 0) + 1;
  lastLocalSaveTimestamp = state._updatedAt;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}

  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'STATE_UPDATED', state });
    } catch (e) {}
  }

  updateSyncBadgeUI('saving');
  const publishedToCloud = publishStateToCloudBrokers(state);

  if (IS_STATIC_CLOUD_HOST) {
    if (publishedToCloud) {
      updateSyncBadgeUI('server');
    } else {
      setTimeout(() => {
        if (publishStateToCloudBrokers(state)) updateSyncBadgeUI('server');
      }, 800);
    }
    return;
  }

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
        publishStateToCloudBrokers(state);
        updateSyncBadgeUI('server');
      }
    })
    .catch(() => {
      if (publishedToCloud) updateSyncBadgeUI('server');
      else updateSyncBadgeUI('offline');
    });
}

// Pull shared state from central server when running on local/tunnel server
async function pullStateFromServer(isInitial) {
  if (IS_STATIC_CLOUD_HOST) {
    if (isInitial && !hasReceivedInitialCloudState) {
      try {
        const jsonRes = await fetch(`./club_data.json?t=${Date.now()}`, { cache: 'no-store' });
        if (jsonRes.ok && !hasReceivedInitialCloudState) {
          const fileState = normalizeStateObject(await jsonRes.json());
          if (fileState && fileState._rev >= (state._rev || 0)) {
            state = fileState;
            renderAll();
          }
        }
      } catch (e) {}
    }
    return;
  }

  if (isSyncingServer) return;

  const activeEl = document.activeElement;
  const isEditingTableInput =
    !isInitial &&
    activeEl &&
    activeEl.tagName === 'INPUT' &&
    ((activeEl.type === 'number' &&
      activeEl.id !== 'regExtraFee' &&
      activeEl.id !== 'newExpenseAmount' &&
      activeEl.id !== 'debtLogAmountInput') ||
      activeEl.id === 'costCourtHours');

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
  } catch (e) {
    if (!activeMqttSockets.some(s => s && s.ready)) {
      updateSyncBadgeUI('offline');
    }
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
// CALENDAR DATE PICKER & NEW WEEK TRANSITION (AUTO-PRESERVES OLD WEEK DEBT)
// ============================================================================
function addDaysToISO(isoStr, daysToAdd) {
  const parts = (isoStr || '2026-11-14').split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = (parseInt(parts[1], 10) || 11) - 1;
  const day = parseInt(parts[2], 10) || 14;
  const d = new Date(year, month, day + daysToAdd);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Chốt và lưu toàn bộ khoản nợ chưa thanh toán của buổi hiện tại vào Sổ nợ theo ngày đánh (tuần cũ)
function archiveCurrentSessionUnpaidDebts(oldDateLabelOverride, oldDateISOOverride) {
  if (!Array.isArray(state.debtLogs)) state.debtLogs = [];
  const calc = calculateSessionCosts();
  let archivedCount = 0;

  state.members.forEach(m => {
    const share = calc.memberShares[m.id];
    if (!share) return;

    const cleanName = m.name.trim().toLowerCase();
    const memberPlayDate = m.playDate || oldDateLabelOverride || state.settings.sessionDate;
    const memberPlayDateISO = oldDateISOOverride || state.settings.sessionDateISO || '2026-11-14';

    // 1. Nếu thành viên có đóng tiền (amountPaid > 0), ưu tiên khấu trừ vào các khoản nợ tuần cũ trước (FIFO)
    let paymentLeft = Math.max(0, Number(share.amountPaid) || 0);
    if (paymentLeft > 0) {
      state.debtLogs.forEach(d => {
        if (
          d &&
          d.status !== 'paid' &&
          (d.isArchivedOldWeek === true || d.playDate !== memberPlayDate) &&
          d.memberName.trim().toLowerCase() === cleanName
        ) {
          const logAmt = Math.max(0, Number(d.amount) || 0);
          if (paymentLeft >= logAmt) {
            paymentLeft -= logAmt;
            d.status = 'paid';
            d.paidAt = Date.now();
          } else if (paymentLeft > 0) {
            d.amount = logAmt - paymentLeft;
            paymentLeft = 0;
          }
        }
      });
    }

    // 2. Tính số tiền còn nợ của riêng buổi đánh hiện tại sau khi trừ phần tiền còn lại
    const sessionFee = Math.max(0, Number(share.sessionFee) || 0);
    const unpaidForThisSession = Math.max(0, sessionFee - paymentLeft);

    if (unpaidForThisSession > 0) {
      // Lưu hoặc cập nhật khoản nợ của buổi đánh này thành nợ tuần cũ (isArchivedOldWeek = true)
      const existingIdx = state.debtLogs.findIndex(
        d =>
          d &&
          d.memberName.trim().toLowerCase() === cleanName &&
          d.playDate === memberPlayDate &&
          d.status !== 'paid'
      );
      if (existingIdx >= 0) {
        state.debtLogs[existingIdx].amount = unpaidForThisSession;
        state.debtLogs[existingIdx].status = 'unpaid';
        state.debtLogs[existingIdx].isArchivedOldWeek = true;
        state.debtLogs[existingIdx].note = `Nợ tuần cũ (${memberPlayDate})`;
        state.debtLogs[existingIdx].updatedAt = Date.now();
      } else {
        state.debtLogs.push({
          id: 'debt_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          memberName: m.name.trim(),
          gender: m.gender || 'M',
          playDateISO: memberPlayDateISO,
          playDate: memberPlayDate,
          amount: unpaidForThisSession,
          note: `Nợ tuần cũ (${memberPlayDate})`,
          status: 'unpaid',
          isArchivedOldWeek: true,
          createdAt: Date.now()
        });
      }
      archivedCount++;
    } else {
      // Nếu đã đóng đủ cho buổi này, đánh dấu bản ghi trùng ngày (nếu có) là paid
      state.debtLogs.forEach(d => {
        if (
          d &&
          d.status !== 'paid' &&
          d.memberName.trim().toLowerCase() === cleanName &&
          d.playDate === memberPlayDate &&
          !d.isArchivedOldWeek
        ) {
          d.status = 'paid';
          d.paidAt = Date.now();
        }
      });
    }
  });

  // Đánh dấu mọi khoản nợ chưa trả còn lại trong sổ đều là nợ tuần cũ để cộng dồn sang tuần mới
  state.debtLogs.forEach(d => {
    if (d && d.status !== 'paid') {
      d.isArchivedOldWeek = true;
    }
  });

  return archivedCount;
}

function transitionToNewSessionDate(newISO) {
  if (!newISO) return 0;
  const oldDateLabel = state.settings.sessionDate;
  const oldDateISO = state.settings.sessionDateISO;
  const newDateLabel = formatISOToVietnameseDate(newISO);

  let archivedCount = 0;
  if (newDateLabel !== oldDateLabel) {
    // Tự động lưu toàn bộ tiền nợ chưa đóng của ngày cũ sang Sổ nợ tuần cũ
    archivedCount = archiveCurrentSessionUnpaidDebts(oldDateLabel, oldDateISO);

    // Cập nhật sang ngày đánh mới và đặt lại trạng thái đóng tiền của buổi mới (nợ cũ vẫn được cộng dồn tự động)
    state.settings.sessionDateISO = newISO;
    state.settings.sessionDate = newDateLabel;
    state.members.forEach(m => {
      m.playDate = newDateLabel;
      m.amountPaid = 0;
      m.paid = false;
      m.extraFee = 0;
    });
    sortMembersByPaymentStatusInPlace();
  } else {
    state.settings.sessionDateISO = newISO;
    state.settings.sessionDate = newDateLabel;
  }
  return archivedCount;
}

function handleAdminDatePickerChange(isoValue) {
  if (!isoValue) return;
  const oldDate = state.settings.sessionDate;
  const archivedCount = transitionToNewSessionDate(isoValue);
  saveState();
  renderAll();
  if (archivedCount > 0) {
    showToast(
      `📅 Đã chuyển sang ${state.settings.sessionDate} & tự động bảo lưu nợ của ${archivedCount} thành viên từ ngày ${oldDate}!`
    );
  } else {
    showToast(`📅 Đã chọn ngày đánh từ lịch: ${state.settings.sessionDate}`);
  }
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
// COST & DEBT CALCULATION ENGINE (INCLUDES CARRY-OVER OLD DEBT BY PLAY DATE)
// ============================================================================
function getMemberOldDebtFromLogs(memberName, currentPlayDate) {
  if (!memberName || !Array.isArray(state.debtLogs)) {
    return { totalOldDebt: 0, logs: [] };
  }
  const clean = memberName.trim().toLowerCase();
  const logs = state.debtLogs.filter(
    d =>
      d &&
      d.status !== 'paid' &&
      d.memberName &&
      d.memberName.trim().toLowerCase() === clean &&
      (d.isArchivedOldWeek === true || d.playDate !== currentPlayDate)
  );
  const totalOldDebt = logs.reduce((sum, d) => sum + (Math.round(Number(d.amount)) || 0), 0);
  return { totalOldDebt, logs };
}

function calculateSessionCosts() {
  const c = state.costs;
  const courtSubtotal = (Number(c.courtsCount) || 0) * (Number(c.courtHours) || 0) * (Number(c.courtRate) || 0);
  const shuttleSubtotal = (Number(c.shuttleCount) || 0) * (Number(c.shuttlePrice) || 0);
  const extraSubtotal = (c.extraExpenses || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const sharedTotal = courtSubtotal + shuttleSubtotal + extraSubtotal;

  const memberCount = state.members.length;
  const memberShares = {};

  function buildMemberShare(m, rawBaseShare) {
    let baseShare = rawBaseShare;
    if (c.roundThousand) baseShare = Math.ceil(baseShare / 1000) * 1000;
    const roundedBase = Math.round(baseShare);
    const extra = Number(m.extraFee) || 0;
    const sessionFee = roundedBase + extra;

    const currentPlayDate = m.playDate || state.settings.sessionDate;
    const { totalOldDebt, logs: oldDebtLogs } = getMemberOldDebtFromLogs(m.name, currentPlayDate);

    const totalDue = sessionFee + totalOldDebt;
    const amountPaid = Math.max(0, Number(m.amountPaid) || 0);
    const debtAmount = Math.max(0, totalDue - amountPaid);

    const remainingOldDebt = Math.max(0, totalOldDebt - amountPaid);
    const paidTowardSession = Math.max(0, amountPaid - totalOldDebt);
    const currentSessionDebt = Math.max(0, sessionFee - paidTowardSession);

    return {
      baseShare: roundedBase,
      extraFee: extra,
      sessionFee,
      oldDebt: totalOldDebt,
      remainingOldDebt,
      currentSessionDebt,
      oldDebtLogs,
      totalDue,
      amountPaid,
      debtAmount,
      isFullyPaid: debtAmount === 0 && totalDue > 0
    };
  }

  if (memberCount > 0) {
    if (c.splitMode === 'gender_discount') {
      const totalUnits = state.members.reduce((sum, m) => sum + (m.gender === 'F' ? 0.8 : 1.0), 0);
      const unitCost = totalUnits > 0 ? sharedTotal / totalUnits : 0;
      state.members.forEach(m => {
        memberShares[m.id] = buildMemberShare(m, unitCost * (m.gender === 'F' ? 0.8 : 1.0));
      });
    } else if (c.splitMode === 'guest_surcharge') {
      const surcharge = 15000;
      const guestCount = state.members.filter(m => m.type === 'guest').length;
      const basePool = Math.max(0, sharedTotal - guestCount * surcharge);
      const basePerPerson = basePool / memberCount;
      state.members.forEach(m => {
        memberShares[m.id] = buildMemberShare(m, basePerPerson + (m.type === 'guest' ? surcharge : 0));
      });
    } else {
      const basePerPerson = sharedTotal / memberCount;
      state.members.forEach(m => {
        memberShares[m.id] = buildMemberShare(m, basePerPerson);
      });
    }
  }

  let totalPayableAllMembers = 0;
  let totalCollected = 0;
  let totalDebt = 0;

  const activeNamesSet = new Set();
  state.members.forEach(m => {
    activeNamesSet.add(m.name.trim().toLowerCase());
    const info = memberShares[m.id];
    if (info) {
      totalPayableAllMembers += info.totalDue;
      totalCollected += info.amountPaid;
      totalDebt += info.debtAmount;
      m.paid = info.debtAmount === 0;
    }
  });

  // Cộng cả tiền nợ tuần cũ của những thành viên chưa đăng ký trong danh sách tuần mới (để không bao giờ mất nợ cũ)
  const debtOnlyMap = {};
  if (Array.isArray(state.debtLogs)) {
    state.debtLogs.forEach(d => {
      if (!d || d.status === 'paid' || !d.memberName) return;
      const clean = d.memberName.trim().toLowerCase();
      if (!activeNamesSet.has(clean)) {
        if (!debtOnlyMap[clean]) {
          debtOnlyMap[clean] = {
            name: d.memberName.trim(),
            gender: d.gender || 'M',
            totalOldDebt: 0,
            logs: []
          };
        }
        const amt = Math.round(Number(d.amount)) || 0;
        debtOnlyMap[clean].totalOldDebt += amt;
        debtOnlyMap[clean].logs.push(d);
        totalPayableAllMembers += amt;
        totalDebt += amt;
      }
    });
  }

  const debtOnlyMembers = Object.values(debtOnlyMap).sort((a, b) => b.totalOldDebt - a.totalOldDebt);
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
    memberShares,
    debtOnlyMembers
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
  const sortedOverviewMembers = getSortedMembersForFinance(costData);
  memberListEl.innerHTML = sortedOverviewMembers.map(m => {
    const info = costData.memberShares[m.id] || { totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const genderBadge = m.gender === 'M'
      ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0">Nam</span>'
      : '<span class="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold shrink-0">Nữ</span>';

    const statusPill = info.debtAmount === 0
      ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold whitespace-nowrap">✓ Đã trả đủ</span>`
      : `<span class="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-extrabold whitespace-nowrap">Nợ ${formatVND(info.debtAmount)}</span>`;

    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0f162e] border ${info.debtAmount > 0 ? 'border-rose-500/30' : 'border-[#1c2952]'}">
        <div class="flex items-center gap-1.5 min-w-0">
          ${genderBadge}
          <span class="text-xs font-bold text-white truncate">${m.name}</span>
          <span class="text-[10px] text-slate-400 font-semibold shrink-0">(${m.skill})</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[11px] font-bold text-slate-200 whitespace-nowrap">Đóng: ${formatVND(info.totalDue)}</span>
          ${statusPill}
        </div>
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
    const unpaidLogs = getMemberUnpaidDebtLogs(s.name);
    const unpaidTotal = unpaidLogs.reduce((sum, d) => sum + (Math.round(Number(d.amount)) || 0), 0);
    const debtTagHtml =
      unpaidTotal > 0
        ? `<span class="px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-500/40 text-[10px] text-rose-300 font-extrabold">Nợ cũ: ${formatVND(unpaidTotal)}</span>`
        : '';

    if (isAlreadyRegistered) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap opacity-80">
          <span>✓ ${s.name}</span>
          <span class="text-[10px] opacity-80">(${genderLabel} · ${s.skill})</span>
          ${debtTagHtml}
        </span>
      `;
    }

    return `
      <div class="inline-flex items-center rounded-xl bg-[#142044] hover:bg-blue-600/30 border ${unpaidTotal > 0 ? 'border-rose-500/50' : 'border-blue-500/40'} transition-colors whitespace-nowrap">
        <button
          type="button"
          onclick="quickRegisterSavedMember(${idx})"
          class="px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1 whitespace-nowrap"
          title="Chạm để đăng ký nhanh ${s.name}"
        >
          <span class="text-blue-400 font-black">+</span>
          <span>${s.name}</span>
          <span class="text-[10px] ${genderColor} font-semibold">(${genderLabel} · ${s.skill})</span>
          ${debtTagHtml}
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
  const sortedAllMembers = getSortedMembersForFinance(costData);
  const filteredMembers = sortedAllMembers.filter(m => genderFilter === 'ALL' || m.gender === genderFilter);

  const mobileListEl = document.getElementById('registeredMembersMobileList');
  const tbody = document.getElementById('registeredMembersTableBody');
  if (filteredMembers.length === 0) {
    const emptyMsg = `Chưa có thành viên nào đăng ký trong tuần này. Hãy chạm vào tên đã lưu từ tuần trước để đăng ký nhanh!`;
    if (mobileListEl) {
      mobileListEl.innerHTML = `<div class="text-center py-6 px-3 rounded-2xl bg-[#0f1730] border border-[#1d2b56] text-xs text-slate-400">${emptyMsg}</div>`;
    }
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">${emptyMsg}</td></tr>`;
    return;
  }

  if (mobileListEl) {
    mobileListEl.innerHTML = filteredMembers.map((m, i) => {
      const shareInfo = costData.memberShares[m.id] || { baseShare: 0, extraFee: 0, oldDebt: 0, totalDue: 0, amountPaid: 0, debtAmount: 0 };
      const genderText = m.gender === 'M' ? 'Nam' : 'Nữ';
      const genderClass = m.gender === 'M'
        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        : 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      const debtPill = shareInfo.debtAmount === 0
        ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold whitespace-nowrap">✓ Đã trả ${formatVND(shareInfo.amountPaid)}</span>`
        : `<span class="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold whitespace-nowrap">Nợ ${formatVND(shareInfo.debtAmount)}</span>`;

      const oldDebtLine = shareInfo.oldDebt > 0
        ? `<div class="text-[10px] text-rose-300 font-bold">📌 Gồm nợ tuần cũ: +${formatVND(shareInfo.oldDebt)}</div>`
        : '';

      return `
        <div class="p-3 rounded-xl bg-[#0f1730] border ${shareInfo.debtAmount > 0 ? 'border-[#1f2e5c]' : 'border-emerald-500/30 opacity-85'} space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-xs font-bold text-slate-400">${i + 1}.</span>
              <span class="font-extrabold text-white text-sm truncate">${m.name}</span>
              <span class="px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${genderClass}">${genderText} · Hạng ${m.skill}</span>
              <span class="text-[10px] font-bold text-indigo-300 whitespace-nowrap">${matchCounts[m.id] || 0} trận</span>
            </div>
            ${admin ? `<button onclick="removeMember('${m.id}')" class="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300 shrink-0">Xóa</button>` : ''}
          </div>
          ${oldDebtLine}
          <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-[#1b2852] text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Phải trả: <strong class="text-white font-black">${formatVND(shareInfo.totalDue)}</strong></span>
              ${shareInfo.amountPaid > 0 && shareInfo.debtAmount > 0 ? `<span class="text-emerald-400 font-semibold">(Đã trả ${formatVND(shareInfo.amountPaid)})</span>` : ''}
            </div>
            ${debtPill}
          </div>
        </div>
      `;
    }).join('');
  }

  tbody.innerHTML = filteredMembers.map((m, i) => {
    const shareInfo = costData.memberShares[m.id] || { baseShare: 0, extraFee: 0, oldDebt: 0, totalDue: 0, amountPaid: 0, debtAmount: 0 };
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
      <tr class="hover:bg-[#0f1730]/60 transition-colors ${shareInfo.debtAmount === 0 ? 'opacity-80' : ''}">
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
          ${shareInfo.oldDebt > 0 ? `<div class="text-[10px] text-rose-300 font-bold whitespace-nowrap">Gồm +${formatVND(shareInfo.oldDebt)} nợ tuần cũ</div>` : ''}
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

function generateWeeklyMatches(advanceNewWeek = true) {
  if (!isAdmin()) return;
  const mode = document.getElementById('autoMatchMode')?.value || 'ALL';
  const targetCount = parseInt(document.getElementById('autoMatchCount')?.value || '9', 10);

  if (state.members.length < 4) {
    showToast('Cần tối thiểu 4 thành viên đăng ký để xếp cặp thi đấu!');
    return;
  }

  let archivedOldDebtCount = 0;
  const oldSessionDateLabel = state.settings.sessionDate;

  // Khi bấm "Tự động xếp lịch tuần mới", tự động chốt và bảo lưu tiền nợ từ tuần cũ sang tuần mới
  if (advanceNewWeek) {
    archivedOldDebtCount = archiveCurrentSessionUnpaidDebts(
      state.settings.sessionDate,
      state.settings.sessionDateISO
    );
    const nextWeekISO = addDaysToISO(state.settings.sessionDateISO || '2026-11-14', 7);
    state.settings.sessionDateISO = nextWeekISO;
    state.settings.sessionDate = formatISOToVietnameseDate(nextWeekISO);

    state.members.forEach(m => {
      m.playDate = state.settings.sessionDate;
      m.amountPaid = 0;
      m.paid = false;
      m.extraFee = 0;
    });
    sortMembersByPaymentStatusInPlace();
  }

  const males = state.members.filter(m => m.gender === 'M');
  const females = state.members.filter(m => m.gender === 'F');

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
  if (advanceNewWeek && archivedOldDebtCount > 0) {
    showToast(
      `✓ Đã tạo lịch tuần mới (${state.settings.sessionDate}) & cộng dồn tiền nợ tuần cũ (${oldSessionDateLabel}) của ${archivedOldDebtCount} thành viên!`
    );
  } else {
    showToast(`Đã tạo ${newMatches.length} trận đấu mới cho buổi ${state.settings.sessionDate}!`);
  }
}

function autoGenerateMatchesAndSwitch() {
  if (!isAdmin()) return;
  generateWeeklyMatches(false);
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
// TAB 4: COST CALCULATOR (FLOAT COURT HOURS & MOBILE-FIRST DEBT MANAGEMENT)
// ============================================================================
function parseFloatValue(raw) {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : Math.max(0, raw);
  if (raw === null || raw === undefined) return 0;
  const cleaned = String(raw).trim().replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function setInputValueIfNotFocused(id, val) {
  const el = document.getElementById(id);
  if (el && document.activeElement !== el) {
    el.value = val;
  }
}

// Sắp xếp thành viên trong Quản lý Tài chính: Chưa trả tiền (debtAmount > 0) lên đầu, Đã trả đủ (debtAmount === 0) xuống cuối
function getSortedMembersForFinance(calc) {
  const costCalc = calc || calculateSessionCosts();
  return state.members
    .map((m, originalIndex) => ({ m, originalIndex }))
    .sort((a, b) => {
      const shareA = costCalc.memberShares[a.m.id] || { debtAmount: 0, amountPaid: 0 };
      const shareB = costCalc.memberShares[b.m.id] || { debtAmount: 0, amountPaid: 0 };
      const aUnpaid = shareA.debtAmount > 0 ? 1 : 0;
      const bUnpaid = shareB.debtAmount > 0 ? 1 : 0;
      if (aUnpaid !== bUnpaid) {
        return bUnpaid - aUnpaid; // Chưa trả (1) lên đầu, Đã trả (0) xuống cuối
      }
      // Nếu cùng nhóm chưa trả: người chưa đóng đồng nào (amountPaid === 0) lên trước, sau đó nợ nhiều hơn lên trước
      if (aUnpaid === 1 && bUnpaid === 1) {
        const aZeroPaid = (shareA.amountPaid || 0) === 0 ? 1 : 0;
        const bZeroPaid = (shareB.amountPaid || 0) === 0 ? 1 : 0;
        if (aZeroPaid !== bZeroPaid) return bZeroPaid - aZeroPaid;
        if (shareB.debtAmount !== shareA.debtAmount) return shareB.debtAmount - shareA.debtAmount;
      }
      return a.originalIndex - b.originalIndex;
    })
    .map(item => item.m);
}

// Sắp xếp trực tiếp mảng state.members để thứ tự mới được lưu cố định trên mọi thiết bị & mọi tab
function sortMembersByPaymentStatusInPlace() {
  const calc = calculateSessionCosts();
  state.members = getSortedMembersForFinance(calc);
}

function settleOldDebtForMemberName(memberName) {
  if (!isAdmin() || !memberName || !Array.isArray(state.debtLogs)) return;
  const clean = memberName.trim().toLowerCase();
  let settledTotal = 0;
  state.debtLogs.forEach(d => {
    if (d && d.status !== 'paid' && d.memberName && d.memberName.trim().toLowerCase() === clean) {
      settledTotal += Number(d.amount) || 0;
      d.status = 'paid';
      d.paidAt = Date.now();
    }
  });
  saveState();
  renderAll();
  showToast(`✓ Đã xác nhận ${memberName} thanh toán hết nợ tuần cũ (${formatVND(settledTotal)})!`);
}

function getMemberUnpaidDebtLogs(memberName) {
  if (!memberName || !Array.isArray(state.debtLogs)) return [];
  const clean = memberName.trim().toLowerCase();
  return state.debtLogs.filter(
    d => d && d.status !== 'paid' && d.memberName && d.memberName.trim().toLowerCase() === clean
  );
}

function renderCostsTab() {
  const admin = isAdmin();
  const c = state.costs;
  const calc = calculateSessionCosts();

  if (admin) {
    setInputValueIfNotFocused('costCourtsCount', c.courtsCount);
    setInputValueIfNotFocused('costCourtHours', c.courtHours);
    setInputValueIfNotFocused('costCourtRate', c.courtRate);
    setInputValueIfNotFocused('costShuttleCount', c.shuttleCount);
    setInputValueIfNotFocused('costShuttlePrice', c.shuttlePrice);

    const splitEl = document.getElementById('costSplitMode');
    if (splitEl && document.activeElement !== splitEl) splitEl.value = c.splitMode;
    const roundEl = document.getElementById('costRoundThousand');
    if (roundEl) roundEl.checked = c.roundThousand;

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
      mini.textContent = `Sân (${c.courtsCount} sân × ${c.courtHours}h): ${formatVND(calc.courtSubtotal)} · Cầu: ${formatVND(calc.shuttleSubtotal)} · Phụ phí: ${formatVND(calc.extraSubtotal)}`;
    }
  }

  document.getElementById('billTotalCost').textContent = formatVND(calc.sharedTotal);
  document.getElementById('billAvgPerPerson').textContent = formatVND(calc.avgPerPerson);
  document.getElementById('billCollectedAmount').textContent = formatVND(calc.totalCollected);
  document.getElementById('billRemainingAmount').textContent = formatVND(calc.totalRemaining);

  // Sắp xếp: Thành viên chưa trả tiền lên đầu, đã trả tiền xuống cuối
  const sortedMembers = getSortedMembersForFinance(calc);
  const debtOnlyMembers = calc.debtOnlyMembers || [];
  const unpaidActiveCount = sortedMembers.filter(m => (calc.memberShares[m.id]?.debtAmount || 0) > 0).length;
  const unpaidCount = unpaidActiveCount + debtOnlyMembers.length;
  const paidCount = sortedMembers.length - unpaidActiveCount;

  const sortBanner = document.getElementById('costSortStatusBanner');
  if (sortBanner) {
    sortBanner.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold">
          ⏳ Chưa trả tiền: ${unpaidCount} người (Xếp đầu bảng)
        </span>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
          ✓ Đã trả đủ: ${paidCount} người (Xếp cuối bảng)
        </span>
      </div>
      <span class="text-slate-400 font-medium">📅 Ngày đánh: <strong class="text-amber-300">${state.settings.sessionDate}</strong></span>
    `;
  }

  // Render các thành viên còn nợ từ tuần cũ nhưng chưa đăng ký vào tuần mới (để không bao giờ mất nợ tuần cũ)
  const mobileDebtOnlyHtml = debtOnlyMembers.map((dm, dIdx) => {
    const genderText = dm.gender === 'M' ? 'Nam' : 'Nữ';
    const genderClass = dm.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300';
    const datesStr = dm.logs.map(l => l.playDate).join(', ');
    return `
      <div class="p-3 rounded-xl bg-[#180d1e] border border-rose-500/50 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] font-black">NỢ CŨ</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${genderClass}">${genderText}</span>
            <span class="font-extrabold text-white text-sm truncate">${dm.name}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/50 text-rose-300 text-xs font-extrabold whitespace-nowrap">
            Nợ tuần cũ: ${formatVND(dm.totalOldDebt)}
          </span>
        </div>
        <div class="flex items-center justify-between gap-2 text-[11px] text-rose-200/90 pt-1 border-t border-rose-500/20">
          <span>📅 Ngày nợ: <strong>${datesStr}</strong></span>
          ${admin ? `<button onclick="settleOldDebtForMemberName('${dm.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold whitespace-nowrap">✓ Đã thu nợ cũ</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const desktopDebtOnlyHtml = debtOnlyMembers.map((dm, dIdx) => {
    const datesStr = dm.logs.map(l => l.playDate).join(', ');
    const actionCol = admin
      ? `<td class="py-3 px-2.5 text-right whitespace-nowrap">
           <button onclick="settleOldDebtForMemberName('${dm.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold whitespace-nowrap">
             ✓ Thu nợ cũ
           </button>
         </td>`
      : '';
    return `
      <tr class="bg-rose-950/20 hover:bg-rose-950/30 transition-colors">
        <td class="py-3 px-2.5 text-xs font-black text-rose-400 whitespace-nowrap">Nợ cũ</td>
        <td class="py-3 px-2.5 whitespace-nowrap">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${dm.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}">${dm.gender === 'M' ? 'Nam' : 'Nữ'}</span>
            <span>${dm.name}</span>
            <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-extrabold">Chưa ĐK tuần mới</span>
          </div>
          <div class="text-[10px] text-rose-300 font-semibold mt-0.5">📅 Ngày nợ: ${datesStr}</div>
        </td>
        <td class="py-3 px-2.5 text-xs text-slate-400 whitespace-nowrap">0đ (Tuần mới)</td>
        <td class="py-3 px-2.5 text-xs text-rose-300 font-bold whitespace-nowrap">+${formatVND(dm.totalOldDebt)} nợ cũ</td>
        <td class="py-3 px-2.5 font-black text-white text-sm whitespace-nowrap">${formatVND(dm.totalOldDebt)}</td>
        <td class="py-3 px-2.5 text-xs text-slate-400 whitespace-nowrap">0đ</td>
        <td class="py-3 px-2.5 whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold whitespace-nowrap">
            Nợ ${formatVND(dm.totalOldDebt)}
          </span>
        </td>
        ${actionCol}
      </tr>
    `;
  }).join('');

  // 1. Render Mobile Compact Debt & Payment Cards (Zero Horizontal Scroll, Unpaid First)
  const mobileCostList = document.getElementById('costMemberMobileList');
  if (mobileCostList) {
    if (sortedMembers.length === 0 && debtOnlyMembers.length === 0) {
      mobileCostList.innerHTML = `<div class="text-center py-6 px-3 rounded-xl bg-[#0f1730] border border-[#1f2e5c] text-xs text-slate-400">Chưa có thành viên đăng ký trong tuần này.</div>`;
    } else {
      let hasRenderedPaidDivider = false;
      const activeCardsHtml = sortedMembers.map((m, idx) => {
        const share = calc.memberShares[m.id] || { baseShare: 0, extraFee: 0, sessionFee: 0, oldDebt: 0, oldDebtLogs: [], totalDue: 0, amountPaid: 0, debtAmount: 0 };
        const genderText = m.gender === 'M' ? 'Nam' : 'Nữ';
        const genderClass = m.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300';
        const memberPlayDate = m.playDate || state.settings.sessionDate;

        let groupHeaderHtml = '';
        if (share.debtAmount === 0 && !hasRenderedPaidDivider) {
          hasRenderedPaidDivider = true;
          groupHeaderHtml = `
            <div class="pt-2 pb-1 flex items-center gap-2">
              <div class="h-px flex-1 bg-emerald-500/30"></div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">✓ Đã thanh toán đủ (${paidCount} người — Xếp cuối)</span>
              <div class="h-px flex-1 bg-emerald-500/30"></div>
            </div>
          `;
        }

        const debtBadge = share.debtAmount > 0
          ? `<span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold whitespace-nowrap">
               Nợ ${formatVND(share.debtAmount)}
             </span>`
          : `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap">
               ✓ Đã trả đủ
             </span>`;

        const dateDebtInfoHtml = share.oldDebt > 0
          ? `<div class="text-[10px] text-rose-300 bg-rose-500/15 border border-rose-500/35 rounded-lg px-2 py-1 flex items-center justify-between gap-1">
               <span>📌 Nợ tuần cũ (${share.oldDebtLogs.map(d => d.playDate.split('·')[1]?.trim() || d.playDate).join(', ')}): <strong>+${formatVND(share.oldDebt)}</strong></span>
               <span class="text-slate-300 whitespace-nowrap">Buổi mới: ${formatVND(share.sessionFee)}</span>
             </div>`
          : '';

        if (admin) {
          return `
            ${groupHeaderHtml}
            <div class="p-3 rounded-xl bg-[#0f1730] border ${share.debtAmount > 0 ? 'border-rose-500/40' : 'border-emerald-500/30 opacity-85'} space-y-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs font-bold text-slate-400">${idx + 1}.</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${genderClass}">${genderText}</span>
                  <span class="font-extrabold text-white text-sm truncate">${m.name}</span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-xs text-slate-300 font-semibold whitespace-nowrap">Tổng đóng: <strong class="text-white font-black text-sm">${formatVND(share.totalDue)}</strong></span>
                  ${debtBadge}
                </div>
              </div>

              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>📅 Ngày đánh: <strong class="text-blue-300">${memberPlayDate}</strong></span>
                <span>${m.type === 'fixed' ? 'Cố định' : 'Vãng lai'}</span>
              </div>

              ${dateDebtInfoHtml}

              <div class="flex items-center justify-between gap-1.5 pt-2 border-t border-[#1b2852]">
                <div class="flex items-center gap-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-emerald-300 font-bold whitespace-nowrap">Đã trả:</span>
                    <input
                      type="number"
                      inputmode="numeric"
                      step="5000"
                      min="0"
                      value="${share.amountPaid}"
                      onchange="updateMemberAmountPaid('${m.id}', this.value)"
                      class="w-20 px-2 py-1 rounded-lg bg-[#090e1f] border border-emerald-500/40 text-xs font-extrabold text-emerald-300 focus:outline-none"
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-amber-300 font-semibold whitespace-nowrap">+Phụ:</span>
                    <input
                      type="number"
                      inputmode="numeric"
                      step="5000"
                      min="0"
                      value="${m.extraFee || 0}"
                      onchange="updateMemberExtraFee('${m.id}', this.value)"
                      class="w-14 px-1.5 py-1 rounded-lg bg-[#090e1f] border border-[#243569] text-xs font-bold text-amber-300 focus:outline-none"
                    />
                  </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button onclick="setMemberFullPaid('${m.id}')" class="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold whitespace-nowrap">
                    ✓ Đủ
                  </button>
                  <button onclick="recordMemberDebtByDate('${m.id}')" class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold whitespace-nowrap" title="Ghi nợ theo ngày đánh">
                    📅 Ghi nợ
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        // User Read-Only Mobile Card
        return `
          ${groupHeaderHtml}
          <div class="p-3 rounded-xl bg-[#0f1730] border ${share.debtAmount > 0 ? 'border-rose-500/35' : 'border-emerald-500/30 opacity-85'} space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-xs font-bold text-slate-400">${idx + 1}.</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${genderClass}">${genderText}</span>
                <span class="font-extrabold text-white text-sm truncate">${m.name}</span>
              </div>
              ${debtBadge}
            </div>
            <div class="text-[10px] text-slate-400">📅 Ngày đánh: <strong class="text-blue-300">${memberPlayDate}</strong></div>
            ${dateDebtInfoHtml}
            <div class="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[#1b2852] text-[11px]">
              <div class="bg-[#090e1f] rounded-lg px-2 py-1">
                <span class="text-slate-400 block text-[10px]">Phải trả</span>
                <strong class="text-white font-black text-xs">${formatVND(share.totalDue)}</strong>
              </div>
              <div class="bg-[#090e1f] rounded-lg px-2 py-1">
                <span class="text-slate-400 block text-[10px]">Đã trả</span>
                <strong class="text-emerald-400 font-extrabold text-xs">${formatVND(share.amountPaid)}</strong>
              </div>
              <div class="bg-[#090e1f] rounded-lg px-2 py-1">
                <span class="text-slate-400 block text-[10px]">Tiền nợ</span>
                <strong class="${share.debtAmount > 0 ? 'text-rose-400' : 'text-emerald-400'} font-extrabold text-xs">${formatVND(share.debtAmount)}</strong>
              </div>
            </div>
          </div>
        `;
      }).join('');

      mobileCostList.innerHTML = mobileDebtOnlyHtml + activeCardsHtml;
    }
  }

  // 2. Render Desktop Full Table (Unpaid First, Paid Last)
  const tbody = document.getElementById('costMemberBreakdownBody');
  let hasRenderedDesktopPaidDivider = false;
  const activeRowsHtml = sortedMembers.map((m, idx) => {
    const share = calc.memberShares[m.id] || { baseShare: 0, extraFee: 0, sessionFee: 0, oldDebt: 0, oldDebtLogs: [], totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const memberPlayDate = m.playDate || state.settings.sessionDate;

    let dividerRowHtml = '';
    if (share.debtAmount === 0 && !hasRenderedDesktopPaidDivider) {
      hasRenderedDesktopPaidDivider = true;
      dividerRowHtml = `
        <tr class="bg-emerald-950/25">
          <td colspan="${admin ? 8 : 7}" class="py-1.5 px-3 text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
            ✓ Thành viên đã thanh toán đủ (${paidCount} người — Đã xếp xuống cuối bảng)
          </td>
        </tr>
      `;
    }

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
           <button onclick="recordMemberDebtByDate('${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold whitespace-nowrap" title="Ghi nợ thành viên này theo ngày đánh (${memberPlayDate})">
             📅 Ghi nợ ngày
           </button>
         </td>`
      : '';

    const oldDebtSubText = share.oldDebt > 0
      ? `<div class="mt-0.5 text-[10px] font-extrabold text-rose-300">📌 +${formatVND(share.oldDebt)} nợ tuần cũ (${share.oldDebtLogs.map(d => d.playDate.split('·')[1]?.trim() || d.playDate).join(', ')})</div>`
      : '';

    return `
      ${dividerRowHtml}
      <tr class="hover:bg-[#0f1730]/60 transition-colors ${share.debtAmount === 0 ? 'opacity-80' : ''}">
        <td class="py-3 px-2.5 text-xs font-bold text-slate-400 whitespace-nowrap">${idx + 1}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${m.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}">${m.gender === 'M' ? 'Nam' : 'Nữ'}</span>
            <span>${m.name}</span>
          </div>
          <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>${m.type === 'fixed' ? 'Cố định' : 'Vãng lai'}</span>
            <span>·</span>
            <span class="text-blue-300 font-semibold">📅 ${memberPlayDate}</span>
          </div>
          ${oldDebtSubText}
        </td>
        <td class="py-3 px-2.5 font-semibold text-slate-200 whitespace-nowrap">${formatVND(share.baseShare)}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">${extraFeeCell}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">
          <div class="font-black text-white text-sm">${formatVND(share.totalDue)}</div>
          ${share.oldDebt > 0 ? `<div class="text-[10px] text-rose-300 font-bold">Gồm ${formatVND(share.oldDebt)} nợ cũ</div>` : ''}
        </td>
        <td class="py-3 px-2.5 whitespace-nowrap">${amountPaidCell}</td>
        <td class="py-3 px-2.5 whitespace-nowrap">${debtCell}</td>
        ${adminActionCell}
      </tr>
    `;
  }).join('');

  tbody.innerHTML = desktopDebtOnlyHtml + activeRowsHtml;

  // 3. Render Sổ Ghi Nợ Theo Ngày Đánh
  renderDebtByDateSection();
}

// ============================================================================
// SỔ GHI NỢ THEO NGÀY ĐÁNH (RECORD & TRACK DEBT BY PLAY DATE)
// ============================================================================
function upsertDebtLogEntry(memberName, gender, playDateISO, playDateLabel, amount, note, isArchivedOldWeek = false) {
  if (!Array.isArray(state.debtLogs)) state.debtLogs = [];
  const cleanName = memberName.trim();
  const existingIdx = state.debtLogs.findIndex(
    d =>
      d &&
      d.memberName.trim().toLowerCase() === cleanName.toLowerCase() &&
      d.playDate === playDateLabel
  );
  if (existingIdx >= 0) {
    state.debtLogs[existingIdx].amount = Math.max(0, Math.round(Number(amount) || 0));
    state.debtLogs[existingIdx].status = 'unpaid';
    if (isArchivedOldWeek) state.debtLogs[existingIdx].isArchivedOldWeek = true;
    if (note) state.debtLogs[existingIdx].note = note;
    state.debtLogs[existingIdx].updatedAt = Date.now();
  } else {
    state.debtLogs.push({
      id: 'debt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      memberName: cleanName,
      gender: gender || 'M',
      playDateISO: playDateISO || state.settings.sessionDateISO || '2026-11-14',
      playDate: playDateLabel || state.settings.sessionDate,
      amount: Math.max(0, Math.round(Number(amount) || 0)),
      note: note || 'Nợ tiền sân + cầu buổi đánh',
      status: 'unpaid',
      isArchivedOldWeek: Boolean(isArchivedOldWeek || playDateLabel !== state.settings.sessionDate),
      createdAt: Date.now()
    });
  }
}

function recordMemberDebtByDate(memberId) {
  if (!isAdmin()) return;
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;

  member.amountPaid = 0;
  member.paid = false;
  const calc = calculateSessionCosts();
  const share = calc.memberShares[memberId];

  const sessionDebt = share ? share.currentSessionDebt : 0;
  const totalDebt = share ? share.debtAmount : 0;
  const playDateLabel = member.playDate || state.settings.sessionDate;
  upsertDebtLogEntry(
    member.name,
    member.gender,
    state.settings.sessionDateISO,
    playDateLabel,
    sessionDebt,
    'Nợ tiền sân + cầu buổi đánh',
    false
  );

  sortMembersByPaymentStatusInPlace();
  saveState();
  renderAll();
  showToast(`📅 Đã ghi nợ cho ${member.name}: ${formatVND(totalDebt)} (Đã chuyển lên đầu danh sách Chưa trả)`);
}

function recordAllUnpaidToDebtLog() {
  if (!isAdmin()) return;
  const calc = calculateSessionCosts();
  let count = 0;
  state.members.forEach(m => {
    const share = calc.memberShares[m.id];
    if (share && share.currentSessionDebt > 0) {
      const playDateLabel = m.playDate || state.settings.sessionDate;
      upsertDebtLogEntry(
        m.name,
        m.gender,
        state.settings.sessionDateISO,
        playDateLabel,
        share.currentSessionDebt,
        'Nợ tiền sân + cầu buổi đánh',
        false
      );
      count++;
    }
  });

  if (count === 0) {
    showToast('Tất cả thành viên buổi hiện tại đều đã trả đủ tiền (không có khoản nợ mới)!');
    return;
  }

  sortMembersByPaymentStatusInPlace();
  saveState();
  renderAll();
  showToast(`📅 Đã lưu ${count} thành viên chưa đóng tiền vào Sổ nợ ngày ${state.settings.sessionDate}!`);
}

function fillAvgCostToDebtForm() {
  const calc = calculateSessionCosts();
  const amountEl = document.getElementById('debtLogAmountInput');
  if (amountEl) {
    amountEl.value = calc.avgPerPerson || 80000;
  }
}

function handleAddDebtByDateSubmit(e) {
  e.preventDefault();
  if (!isAdmin()) return;
  const dateEl = document.getElementById('debtLogDateInput');
  const nameEl = document.getElementById('debtLogMemberName');
  const amountEl = document.getElementById('debtLogAmountInput');
  const noteEl = document.getElementById('debtLogNoteInput');

  const name = nameEl?.value.trim();
  const amount = Number(amountEl?.value) || 0;
  if (!name || amount <= 0) {
    showToast('Vui lòng nhập tên thành viên và số tiền nợ hợp lệ!');
    return;
  }

  const chosenISO = dateEl?.value || state.settings.sessionDateISO || '2026-11-14';
  const playDateLabel = formatISOToVietnameseDate(chosenISO);
  const note = noteEl?.value.trim() || 'Ghi nợ theo ngày đánh';

  // Tìm giới tính từ danh sách hiện tại hoặc đã lưu
  const matchedMember =
    state.members.find(m => m.name.trim().toLowerCase() === name.toLowerCase()) ||
    (state.savedMembers || []).find(s => s.name.trim().toLowerCase() === name.toLowerCase());
  const gender = matchedMember?.gender || 'M';

  upsertDebtLogEntry(
    name,
    gender,
    chosenISO,
    playDateLabel,
    amount,
    note,
    playDateLabel !== state.settings.sessionDate
  );

  if (nameEl) nameEl.value = '';
  if (amountEl) amountEl.value = '';
  if (noteEl) noteEl.value = '';

  sortMembersByPaymentStatusInPlace();
  saveState();
  renderAll();
  showToast(`📅 Đã ghi nợ ${name}: ${formatVND(amount)} vào ngày đánh ${playDateLabel}!`);
}

function toggleDebtLogPaidStatus(logId) {
  if (!isAdmin() || !Array.isArray(state.debtLogs)) return;
  const item = state.debtLogs.find(d => d.id === logId);
  if (!item) return;

  item.status = item.status === 'paid' ? 'unpaid' : 'paid';
  item.paidAt = item.status === 'paid' ? Date.now() : null;

  // Đồng bộ nếu thành viên đang ở buổi đánh trùng ngày
  const matchingMember = state.members.find(
    m =>
      m.name.trim().toLowerCase() === item.memberName.trim().toLowerCase() &&
      (m.playDate || state.settings.sessionDate) === item.playDate &&
      !item.isArchivedOldWeek
  );
  if (matchingMember) {
    const calc = calculateSessionCosts();
    const share = calc.memberShares[matchingMember.id];
    if (item.status === 'paid' && share) {
      matchingMember.amountPaid = share.totalDue;
      matchingMember.paid = true;
    } else if (item.status === 'unpaid') {
      matchingMember.amountPaid = 0;
      matchingMember.paid = false;
    }
  }

  sortMembersByPaymentStatusInPlace();
  saveState();
  renderAll();
  showToast(
    item.status === 'paid'
      ? `✓ Đã xác nhận ${item.memberName} thanh toán nợ ngày ${item.playDate} (${formatVND(item.amount)})`
      : `⏳ Đã chuyển khoản nợ ngày ${item.playDate} của ${item.memberName} về trạng thái Chưa trả`
  );
}

function deleteDebtLogItem(logId) {
  if (!isAdmin() || !Array.isArray(state.debtLogs)) return;
  state.debtLogs = state.debtLogs.filter(d => d.id !== logId);
  saveState();
  renderAll();
  showToast('Đã xóa bản ghi khỏi Sổ nợ theo ngày đánh.');
}

function renderDebtByDateSection() {
  if (!Array.isArray(state.debtLogs)) state.debtLogs = [];
  const admin = isAdmin();
  const calc = calculateSessionCosts();

  const dateInputEl = document.getElementById('debtLogDateInput');
  if (dateInputEl && !dateInputEl.value) {
    dateInputEl.value = state.settings.sessionDateISO || '2026-11-14';
  }

  // Kết hợp cả các khoản nợ đã lưu trong state.debtLogs (tuần cũ / ghi sổ) VÀ trạng thái buổi đánh hiện tại
  const combinedEntries = state.debtLogs.map(d => ({
    ...d,
    isLiveSessionEntry: false
  }));

  state.members.forEach((m, idx) => {
    const playDateLabel = m.playDate || state.settings.sessionDate;
    const share = calc.memberShares[m.id] || { sessionFee: 0, currentSessionDebt: 0, debtAmount: 0 };
    const alreadyInLogs = combinedEntries.some(
      d =>
        d.memberName.trim().toLowerCase() === m.name.trim().toLowerCase() &&
        d.playDate === playDateLabel &&
        !d.isArchivedOldWeek
    );
    if (!alreadyInLogs) {
      combinedEntries.push({
        id: 'live_' + m.id,
        memberId: m.id,
        memberName: m.name,
        gender: m.gender || 'M',
        playDateISO: state.settings.sessionDateISO || '2026-11-14',
        playDate: playDateLabel,
        amount: share.currentSessionDebt > 0 ? share.currentSessionDebt : share.sessionFee,
        note: 'Tiền sân + cầu buổi đánh hiện tại',
        status: share.currentSessionDebt === 0 ? 'paid' : 'unpaid',
        isLiveSessionEntry: true,
        createdAt: Date.now() - idx
      });
    }
  });

  // Cập nhật bộ lọc ngày đánh
  const filterEl = document.getElementById('debtLogDateFilter');
  const currentFilter = filterEl ? filterEl.value : 'ALL';
  const uniqueDates = [];
  combinedEntries.forEach(d => {
    if (d && d.playDate && !uniqueDates.includes(d.playDate)) {
      uniqueDates.push(d.playDate);
    }
  });
  if (filterEl) {
    filterEl.innerHTML =
      `<option value="ALL">Tất cả ngày đánh (${uniqueDates.length} ngày)</option>` +
      uniqueDates.map(dt => `<option value="${dt}">${dt}</option>`).join('');
    if (uniqueDates.includes(currentFilter)) {
      filterEl.value = currentFilter;
    } else {
      filterEl.value = 'ALL';
    }
  }

  const activeDateFilter = filterEl ? filterEl.value : 'ALL';

  // Tính tổng nợ chưa trả trên toàn bộ các ngày đánh
  const totalUnpaidAllDates = combinedEntries
    .filter(d => d && d.status !== 'paid')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const totalBadge = document.getElementById('debtLogTotalUnpaidBadge');
  if (totalBadge) {
    totalBadge.textContent = `Tổng nợ các ngày: ${formatVND(totalUnpaidAllDates)}`;
    totalBadge.className =
      totalUnpaidAllDates > 0
        ? 'px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold'
        : 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold';
  }

  // Tổng hợp nợ chưa trả theo từng thành viên qua các ngày đánh
  const summaryPillsEl = document.getElementById('debtLogMemberSummaryPills');
  if (summaryPillsEl) {
    const byMember = {};
    combinedEntries
      .filter(d => d && d.status !== 'paid')
      .forEach(d => {
        const key = d.memberName.trim();
        if (!byMember[key]) {
          byMember[key] = { name: key, total: 0, dates: [] };
        }
        byMember[key].total += Number(d.amount) || 0;
        const shortDate = d.playDate.split('·')[1]?.trim() || d.playDate;
        if (!byMember[key].dates.includes(shortDate)) {
          byMember[key].dates.push(shortDate);
        }
      });

    const summaryArr = Object.values(byMember).sort((a, b) => b.total - a.total);
    if (summaryArr.length === 0) {
      summaryPillsEl.innerHTML = '';
    } else {
      summaryPillsEl.innerHTML = summaryArr
        .map(
          item => `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs">
            <span class="font-extrabold text-white">${item.name}:</span>
            <span class="font-black text-rose-300">${formatVND(item.total)}</span>
            <span class="text-[10px] text-slate-300">(${item.dates.length} ngày: ${item.dates.join(', ')})</span>
          </div>
        `
        )
        .join('');
    }
  }

  // Lọc và sắp xếp danh sách: Chưa trả (unpaid) xếp đầu, Đã trả (paid) xếp cuối
  const listEl = document.getElementById('debtLogListContainer');
  if (!listEl) return;

  const filteredLogs = combinedEntries
    .filter(d => activeDateFilter === 'ALL' || d.playDate === activeDateFilter)
    .slice()
    .sort((a, b) => {
      const aUnpaid = a.status !== 'paid' ? 1 : 0;
      const bUnpaid = b.status !== 'paid' ? 1 : 0;
      if (aUnpaid !== bUnpaid) return bUnpaid - aUnpaid; // Chưa trả lên đầu, Đã trả xuống cuối
      if (a.isArchivedOldWeek !== b.isArchivedOldWeek) return (b.isArchivedOldWeek ? 1 : 0) - (a.isArchivedOldWeek ? 1 : 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  if (filteredLogs.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-5 px-3 rounded-xl bg-[#0f1730] border border-[#1f2e5c] text-xs text-slate-400">
        Chưa có khoản ghi nợ nào theo ngày đánh.
      </div>
    `;
    return;
  }

  listEl.innerHTML = filteredLogs
    .map((item, idx) => {
      const isPaid = item.status === 'paid';
      const genderLabel = item.gender === 'F' ? 'Nữ' : 'Nam';
      const genderClass = item.gender === 'F' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300';
      const oldWeekBadge = item.isArchivedOldWeek
        ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold">Tuần cũ</span>`
        : `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">Tuần này</span>`;

      let actionButtonsHtml = '';
      if (admin) {
        if (item.isLiveSessionEntry) {
          actionButtonsHtml = isPaid
            ? `<button onclick="recordMemberDebtByDate('${item.memberId}')" class="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold whitespace-nowrap">Ghi nợ lại</button>`
            : `<button onclick="setMemberFullPaid('${item.memberId}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold whitespace-nowrap">✓ Đã thu</button>`;
        } else {
          actionButtonsHtml = `
            <button onclick="toggleDebtLogPaidStatus('${item.id}')" class="px-2.5 py-1 rounded-lg ${
              isPaid
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
            } text-[11px] font-bold whitespace-nowrap">
              ${isPaid ? 'Hoàn tác' : '✓ Đã thu'}
            </button>
            <button onclick="deleteDebtLogItem('${item.id}')" class="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold" title="Xóa khoản nợ này">
              ✕
            </button>
          `;
        }
      }

      return `
        <div class="p-3 rounded-xl bg-[#0f1730] border ${isPaid ? 'border-emerald-500/30 opacity-75' : 'border-rose-500/40'} flex flex-wrap items-center justify-between gap-2">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold text-slate-400">${idx + 1}.</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${genderClass}">${genderLabel}</span>
              <span class="font-extrabold text-white text-sm">${item.memberName}</span>
              <span class="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold whitespace-nowrap">
                📅 ${item.playDate}
              </span>
              ${oldWeekBadge}
            </div>
            <div class="text-[11px] text-slate-400">${item.note || 'Nợ tiền sân + cầu buổi đánh'}</div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            ${
              isPaid
                ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap">
                     ✓ Đã trả ${formatVND(item.amount)}
                   </span>`
                : `<span class="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold whitespace-nowrap">
                     Nợ ${formatVND(item.amount)}
                   </span>`
            }
            ${actionButtonsHtml}
          </div>
        </div>
      `;
    })
    .join('');
}

function handleCostInputChange(normalizeFloatInput) {
  if (!isAdmin()) return;
  const hoursEl = document.getElementById('costCourtHours');
  const parsedHours = parseFloatValue(hoursEl ? hoursEl.value : state.costs.courtHours);

  state.costs.courtsCount = Math.max(0, parseFloatValue(document.getElementById('costCourtsCount')?.value));
  state.costs.courtHours = parsedHours;
  state.costs.courtRate = Math.max(0, Number(document.getElementById('costCourtRate')?.value) || 0);
  state.costs.shuttleCount = Math.max(0, parseFloatValue(document.getElementById('costShuttleCount')?.value));
  state.costs.shuttlePrice = Math.max(0, Number(document.getElementById('costShuttlePrice')?.value) || 0);
  state.costs.splitMode = document.getElementById('costSplitMode')?.value || 'equal';
  state.costs.roundThousand = Boolean(document.getElementById('costRoundThousand')?.checked);

  if (normalizeFloatInput && hoursEl) {
    hoursEl.value = parsedHours;
  }

  saveState();
  renderAll();
}

function adjustCourtHours(delta) {
  if (!isAdmin()) return;
  const current = parseFloatValue(state.costs.courtHours);
  const next = Math.max(0.25, Math.round((current + delta) * 100) / 100);
  state.costs.courtHours = next;
  const hoursEl = document.getElementById('costCourtHours');
  if (hoursEl) hoursEl.value = next;
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
  sortMembersByPaymentStatusInPlace();
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
  let calc = calculateSessionCosts();
  let share = calc.memberShares[memberId];

  // Nếu thành viên có khoản nợ tuần cũ hoặc trùng ngày đánh hiện tại trong Sổ nợ theo ngày, tự động đánh dấu đã trả
  if (Array.isArray(state.debtLogs)) {
    state.debtLogs.forEach(d => {
      if (
        d &&
        d.status !== 'paid' &&
        d.memberName.trim().toLowerCase() === member.name.trim().toLowerCase()
      ) {
        d.status = 'paid';
        d.paidAt = Date.now();
      }
    });
  }

  calc = calculateSessionCosts();
  share = calc.memberShares[memberId];
  member.amountPaid = share ? share.totalDue : 0;
  member.paid = true;

  sortMembersByPaymentStatusInPlace();
  saveState();
  renderAll();
  showToast(`✓ ${member.name} đã thanh toán đủ — Đã xếp xuống cuối danh sách!`);
}

function setMemberZeroPaid(memberId) {
  recordMemberDebtByDate(memberId);
}

function markAllPaid(status) {
  if (!isAdmin()) return;
  if (status && Array.isArray(state.debtLogs)) {
    state.debtLogs.forEach(d => {
      if (d && d.status !== 'paid') {
        d.status = 'paid';
        d.paidAt = Date.now();
      }
    });
  }
  const calc = calculateSessionCosts();
  state.members.forEach(m => {
    const share = calc.memberShares[m.id];
    m.amountPaid = status && share ? share.totalDue : 0;
    m.paid = Boolean(status);
  });
  sortMembersByPaymentStatusInPlace();
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
  const sortedMembers = getSortedMembersForFinance(calc);
  const lines = [
    `🏸 BÁO CÁO TÀI CHÍNH & TIỀN NỢ — ${state.settings.clubName}`,
    `🌐 Web: https://caulongcuoituan.github.io/giaoluucaulongcuoituan/`,
    `📅 Ngày: ${state.settings.sessionDate} (${state.settings.sessionTime})`,
    `📍 Sân: ${state.settings.courtLocation}`,
    `--------------------------------`,
    `1. Tiền sân (${state.costs.courtsCount} sân × ${state.costs.courtHours}h): ${formatVND(calc.courtSubtotal)}`,
    `2. Tiền cầu (${state.costs.shuttleCount} quả × ${formatVND(state.costs.shuttlePrice)}): ${formatVND(calc.shuttleSubtotal)}`,
    `3. Chi phí phụ: ${formatVND(calc.extraSubtotal)}`,
    `👉 TỔNG CHI PHÍ: ${formatVND(calc.sharedTotal)}`,
    `✅ ĐÃ THU: ${formatVND(calc.totalCollected)} | ❌ CÒN NỢ: ${formatVND(calc.totalRemaining)}`,
    `--------------------------------`,
    `📋 DANH SÁCH CHƯA TRẢ & ĐÃ TRẢ (${sortedMembers.length} thành viên):`
  ];

  sortedMembers.forEach((m, i) => {
    const s = calc.memberShares[m.id] || { totalDue: 0, amountPaid: 0, debtAmount: 0 };
    const statusText = s.debtAmount === 0
      ? `✅ Đã trả đủ (${formatVND(s.amountPaid)})`
      : `⏳ CHƯA TRẢ: Còn nợ ${formatVND(s.debtAmount)} (Đã đóng: ${formatVND(s.amountPaid)})`;
    lines.push(`${i + 1}. ${m.name} (${m.playDate || state.settings.sessionDate}) — Phải đóng: ${formatVND(s.totalDue)} → ${statusText}`);
  });

  const unpaidDebtLogs = (state.debtLogs || []).filter(d => d && d.status !== 'paid');
  if (unpaidDebtLogs.length > 0) {
    lines.push(`--------------------------------`);
    lines.push(`📅 SỔ GHI NỢ THEO NGÀY ĐÁNH (${unpaidDebtLogs.length} khoản chưa trả):`);
    unpaidDebtLogs.forEach((d, idx) => {
      lines.push(`${idx + 1}. ${d.memberName} — Ngày ${d.playDate}: Nợ ${formatVND(d.amount)} (${d.note || 'Tiền sân + cầu'})`);
    });
  }

  copyTextCrossBrowser(lines.join('\n'), () => {
    showToast('Đã copy bảng tổng hợp Đã trả & Sổ nợ theo ngày! Bạn có thể dán ngay vào nhóm Zalo.');
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
  let archivedCount = 0;
  const oldDate = state.settings.sessionDate;
  if (isoVal) {
    archivedCount = transitionToNewSessionDate(isoVal);
  }
  state.settings.sessionTime = document.getElementById('settingSessionTime').value.trim() || '19:00 - 21:00';
  state.settings.courtLocation = document.getElementById('settingCourtLocation').value.trim() || 'Sân Cầu Lông CLB';
  state.settings.maxPlayers = Number(document.getElementById('settingMaxPlayers').value) || 16;

  saveState();
  renderAll();
  if (archivedCount > 0) {
    showToast(`✓ Đã chuyển sang ${state.settings.sessionDate} & tự động lưu nợ của ${archivedCount} thành viên từ ngày ${oldDate}!`);
  } else {
    showToast('✓ Đã lưu ngày đánh & thông tin cấu hình tuần!');
  }
}

function resetNewWeekSession() {
  if (!isAdmin()) return;
  if (!Array.isArray(state.savedMembers)) state.savedMembers = [];
  if (!Array.isArray(state.debtLogs)) state.debtLogs = [];

  const oldDateLabel = state.settings.sessionDate;
  const oldDateISO = state.settings.sessionDateISO || '2026-11-14';

  // Lưu toàn bộ thành viên tuần hiện tại vào danh sách tuần trước để đăng ký nhanh
  state.members.forEach(m => syncMemberToSavedRoster(m, state.savedMembers));

  // Tự động chốt và lưu toàn bộ tiền nợ chưa đóng của tuần cũ vào Sổ nợ theo ngày đánh (isArchivedOldWeek = true)
  const recordedDebtCount = archiveCurrentSessionUnpaidDebts(oldDateLabel, oldDateISO);

  // Tự động tăng ngày đánh sang tuần kế tiếp (+7 ngày)
  const nextWeekISO = addDaysToISO(oldDateISO, 7);
  state.settings.sessionDateISO = nextWeekISO;
  state.settings.sessionDate = formatISOToVietnameseDate(nextWeekISO);

  // Làm mới danh sách tuần mới và tỉ số trận đấu (tiền nợ tuần cũ vẫn được giữ nguyên và hiển thị ở bảng Tài chính!)
  state.members = [];
  state.matches = [];
  saveState();
  renderAll();
  const debtMsg =
    recordedDebtCount > 0
      ? ` Đã bảo lưu nợ tuần cũ (${oldDateLabel}) của ${recordedDebtCount} thành viên sang tuần mới (${state.settings.sessionDate})!`
      : '';
  showToast(`✓ Đã tạo tuần mới (${state.settings.sessionDate})!${debtMsg}`);
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

  // Connect to Real-Time Cloud Retained WebSocket Brokers (<100ms sync across all devices/networks)
  initCloudRealtimeSync();

  // Pull authoritative state from local server if applicable
  pullStateFromServer(true);
  if (!IS_STATIC_CLOUD_HOST) {
    setInterval(() => pullStateFromServer(false), 1500);
  }

  heroAutoplayInterval = setInterval(() => {
    if (isHeroPlaying) nextHeroSlide();
  }, 7000);
});
