// 历史记录配置：黑名单设置（扩展优先 chrome.storage.local，回退 localStorage）

const enabledEl = document.getElementById('enabled');
const rulesEl = document.getElementById('rules');
const saveBtn = document.getElementById('save');
const closeBtn = document.getElementById('close-panel');

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
  },
  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise(resolve => chrome.storage.local.set({ [key]: value }, resolve));
    }
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const KEY = 'historyBlacklist';
const DEFAULT = { enabled: false, rules: [] };

async function load() {
  const cfg = await storage.get(KEY, DEFAULT);
  enabledEl.checked = !!cfg.enabled;
  rulesEl.value = (cfg.rules || []).join('\n');
  rulesEl.focus();
}

async function save() {
  const lines = rulesEl.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const cfg = { enabled: !!enabledEl.checked, rules: lines };
  await storage.set(KEY, cfg);
  window.location.href = 'history.html';
}

saveBtn.addEventListener('click', save);
closeBtn?.addEventListener('click', () => {
  try {
    window.parent?.postMessage({ type: 'closePanel' }, '*');
  } catch {}
});
load();
