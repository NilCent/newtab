// 历史记录：支持 Chrome 扩展的真实历史记录，文件模式下使用本地假数据

const list = document.getElementById('list');
const q = document.getElementById('q');
const openSettings = document.getElementById('open-settings');
const closePanelBtn = document.getElementById('close-panel');

const WEEK_CN = ["周日","周一","周二","周三","周四","周五","周六"];
const oneDay = 86400000;
function pad(n) { return String(n).padStart(2, '0'); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfWeekMonday(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const dt = new Date(d);
  dt.setDate(d.getDate() + diff);
  return startOfDay(dt);
}
function formatCN(ts) {
  const d = new Date(ts);
  const nowD = new Date();
  const today0 = startOfDay(nowD);
  const d0 = startOfDay(d);
  const dayDiff = Math.floor((today0 - d0) / oneDay);
  const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (dayDiff === 0) return `今天 ${hhmm}`;
  if (dayDiff === 1) return `昨天 ${hhmm}`;
  if (dayDiff === 2) return `前天 ${hhmm}`;
  const thisWeekStart = startOfWeekMonday(nowD);
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  if (d0 >= thisWeekStart) return `这${WEEK_CN[d.getDay()]} ${hhmm}`;
  if (d0 >= lastWeekStart && d0 < thisWeekStart) return `上${WEEK_CN[d.getDay()]} ${hhmm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hhmm}`;
}

function renderList(items) {
  if (!items || items.length === 0) {
    list.innerHTML = '<div class="empty">没有匹配的历史记录</div>';
    return;
  }
  // 仅使用可在扩展环境加载的网络源（避免 chrome:// 资源限制），增强回退链
  const faviconSources = (url) => {
    try {
      const u = new URL(url);
      const host = u.hostname;
      const domainSpecific = [];
      if (host.endsWith('deepseek.com')) {
        domainSpecific.push('https://fe-static.deepseek.com/chat/favicon.svg');
      }
      return [
        ...domainSpecific,
        `${u.protocol}//${host}/apple-touch-icon.png`,
        `${u.protocol}//${host}/favicon.svg`,
        `${u.protocol}//${host}/favicon.ico`,
        `https://icon.horse/icon/${host}`,
        `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
        `https://icons.duckduckgo.com/ip3/${host}.ico`
      ];
    } catch {
      return [];
    }
  };
  list.innerHTML = items.map(item => {
    const timeText = formatCN(item.ts);
    const safeTitle = (item.title || item.url || '（无标题）').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const srcs = faviconSources(item.url);
    const first = srcs[0] || '';
    const rest = srcs.slice(1).join('|');
    return `
      <div class="item">
        <img class="fav" src="${first}" data-fallbacks="${rest}" alt="" />
        <a class="title" href="${item.url}" target="_blank" rel="noopener">${safeTitle}</a>
        <div class="time">${timeText}</div>
      </div>
    `;
  }).join("");
  // favicon 失败时依次回退，再隐藏
  list.querySelectorAll('img.fav').forEach(img => {
    img.addEventListener('error', () => {
      const fbStr = img.getAttribute('data-fallbacks') || '';
      const arr = fbStr.split('|').filter(Boolean);
      if (arr.length === 0) { img.style.display = 'none'; return; }
      const next = arr.shift();
      img.setAttribute('data-fallbacks', arr.join('|'));
      img.src = next;
    });
  });
}

// Chrome 扩展可用性检测
const canUseChromeHistory = typeof chrome !== 'undefined' && chrome?.history?.search;

// 数据获取（扩展：真实历史；文件：本地假数据）
function fetchHistoryFromChrome(text = "", { days = 30, maxResults = 500 } = {}) {
  return new Promise(resolve => {
    const params = {
      text: text || "",
      startTime: Date.now() - days * oneDay,
      maxResults
    };
    chrome.history.search(params, results => {
      const items = (results || []).map(r => ({
        title: r.title || r.url || '',
        url: r.url,
        ts: r.lastVisitTime || Date.now()
      })).filter(x => !!x.url);
      // 去重（同 URL 仅保留最新一次）
      const seen = new Map();
      for (const it of items) {
        const prev = seen.get(it.url);
        if (!prev || it.ts > prev.ts) seen.set(it.url, it);
      }
      const arr = Array.from(seen.values()).sort((a,b) => b.ts - a.ts);
      resolve(arr);
    });
  });
}

function fetchHistoryMock(text = "") {
  const now = Date.now();
  const mock = [
    { title: "MDN Web 文档", url: "https://developer.mozilla.org/zh-CN/", ts: now - 2 * 3600000 },
    { title: "稀土掘金", url: "https://juejin.cn", ts: now - 6 * 3600000 },
    { title: "知乎", url: "https://zhihu.com", ts: now - 1 * oneDay - 3 * 3600000 },
    { title: "哔哩哔哩", url: "https://www.bilibili.com/", ts: now - 1 * oneDay - 10 * 3600000 },
    { title: "Notion", url: "https://www.notion.so/", ts: now - 3 * oneDay - 5 * 3600000 },
    { title: "OpenAI", url: "https://openai.com/", ts: now - 4 * oneDay - 2 * 3600000 },
    { title: "Google Developers", url: "https://developers.google.com/", ts: now - 8 * oneDay - 2 * 3600000 },
    { title: "Vite", url: "https://vitejs.dev/", ts: now - 9 * oneDay },
    { title: "React", url: "https://react.dev/", ts: now - 10 * oneDay - 2 * 3600000 },
    { title: "Babel", url: "https://babeljs.io/", ts: now - 30 * oneDay - 1 * 3600000 }
  ];
  let data = mock.slice();
  if (text && text.trim()) {
    const k = text.toLowerCase();
    data = data.filter(it => (it.title || '').toLowerCase().includes(k) || it.url.toLowerCase().includes(k));
  }
  return Promise.resolve(data.sort((a,b) => b.ts - a.ts));
}

let latestCache = [];
async function loadDefault() {
  const data = canUseChromeHistory
    ? await fetchHistoryFromChrome("", { days: 30, maxResults: 500 })
    : await fetchHistoryMock("");
  latestCache = await applyBlacklist(data);
  renderList(latestCache.slice(0, 50));
}

let searchTimer = null;
let searchSeq = 0;
function handleSearch(text) {
  const query = (text || "").trim();
  const mySeq = ++searchSeq;
  const run = async () => {
    // 如果在等待期间有更新输入，这次结果将被丢弃
    if (mySeq !== searchSeq) return;
    if (!query) {
      // 空查询时重新获取默认结果，保证数据正确而非使用旧缓存
      const data = canUseChromeHistory
        ? await fetchHistoryFromChrome("", { days: 30, maxResults: 500 })
        : await fetchHistoryMock("");
      if (mySeq !== searchSeq) return;
      latestCache = await applyBlacklist(data);
      renderList(latestCache.slice(0, 50));
      return;
    }
    const data = canUseChromeHistory
      ? await fetchHistoryFromChrome(query, { days: 90, maxResults: 500 })
      : await fetchHistoryMock(query);
    if (mySeq !== searchSeq) return;
    const filtered = await applyBlacklist(data);
    renderList(filtered.slice(0, 100));
  };
  clearTimeout(searchTimer);
  searchTimer = setTimeout(run, 300);
}

// 简化为普通输入监听（已改用 type="text" 兼容输入法）
q.addEventListener('input', () => handleSearch(q.value));

// 打开配置页
openSettings?.addEventListener('click', () => {
  window.location.href = 'history_settings.html';
});

closePanelBtn?.addEventListener('click', () => {
  try {
    window.parent?.postMessage({ type: 'closePanel' }, '*');
  } catch {}
});

loadDefault();
const storage = {
  async get(key, defaultValue) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.get([key], (res) => resolve(res?.[key] ?? defaultValue));
      });
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch { return defaultValue; }
  }
};
const BL_KEY = 'historyBlacklist';
async function getBlacklist() {
  const cfg = await storage.get(BL_KEY, { enabled: false, rules: [] });
  const rules = (cfg.rules || []).map(s => s.toLowerCase()).filter(Boolean);
  return { enabled: !!cfg.enabled, rules };
}
async function applyBlacklist(items) {
  const { enabled, rules } = await getBlacklist();
  if (!enabled || rules.length === 0) return items;
  return items.filter(it => {
    const t = (it.title || '').toLowerCase();
    const u = (it.url || '').toLowerCase();
    return !rules.some(r => t.includes(r) || u.includes(r));
  });
}

loadDefault();
