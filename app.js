// 交互脚本（仅静态原型）：搜索、历史侧栏、链接跳转

// 搜索引擎映射
// 说明：根据选择的引擎，拼接搜索地址并跳转
const ENGINE_URLS = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  baidu: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`
};

// DOM 获取
const engineSelect = document.getElementById('engine');
const searchForm   = document.getElementById('search-form');
const searchInput  = document.getElementById('search-input');
const historyWidget = document.getElementById('history-widget');
const historyPanel  = document.getElementById('history-panel');
const panelTitle    = document.getElementById('panel-title');
const panelOverlay  = document.getElementById('panel-overlay');
const quoteWidget   = document.getElementById('quote-widget');
const quoteTextEl   = document.getElementById('quote-text');
const quoteAuthorEl = document.getElementById('quote-author');
const quoteNextBtn  = document.getElementById('quote-next');
// 提前引用网格容器，供后续事件委托使用
let widgetsContainer = document.querySelector('.widgets');


// 搜索表单提交
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = (searchInput.value || '').trim();
  if (!q) {
    searchInput.focus();
    return;
  }
  const engine = engineSelect.value || 'google';
  const to = ENGINE_URLS[engine]?.(q) ?? ENGINE_URLS.google(q);
  // 新标签打开搜索结果
  window.open(to, '_blank', 'noopener');
});

// 通用打开子页面方法：组件可控制标题与展现形式
// type: 'right' | 'center'
function openPanel({ title = '', url = '', type = 'right', focusSelector = '' } = {}) {
  if (panelTitle) panelTitle.textContent = title || '';
  historyPanel.classList.toggle('no-header', !title);
  historyPanel.classList.toggle('center', type === 'center');
  historyPanel.classList.toggle('left', type === 'left');
  if (panelOverlay) panelOverlay.classList.toggle('show', type === 'center');
  const frame = document.getElementById('history-frame');
  if (frame) {
    const current = frame.getAttribute('src') || '';
    if (!current || current === 'about:blank' || current !== url) {
      frame.setAttribute('src', url || 'about:blank');
      frame.addEventListener('load', () => {
        if (focusSelector) {
          try {
            const el = frame.contentWindow?.document?.querySelector(focusSelector);
            el?.focus();
          } catch {}
        }
      }, { once: true });
    } else if (focusSelector) {
      try {
        const el = frame.contentWindow?.document?.querySelector(focusSelector);
        el?.focus();
      } catch {}
    }
  }
  historyPanel.classList.add('open');
  historyWidget.setAttribute('aria-expanded', 'true');
  historyPanel.setAttribute('aria-hidden', 'false');
}

// 历史记录组件：右侧抽屉 + 历史页面 + 自动聚焦搜索框
const openHistory = () => openPanel({
  title: '', // 由子页面自身展示标题
  url: 'history.html',
  type: 'right',
  focusSelector: '#q'
});
const closeHistory = () => {
  historyPanel.classList.remove('open');
  historyWidget.setAttribute('aria-expanded', 'false');
  historyPanel.setAttribute('aria-hidden', 'true');
  panelOverlay?.classList.remove('show');
  // 重要：关闭时重置 iframe，确保下次点击历史记录时回到列表页
  const frame = document.getElementById('history-frame');
  if (frame) frame.setAttribute('src', 'about:blank');
};

historyWidget.addEventListener('click', openHistory);
historyWidget.addEventListener('keydown', (e) => {
  // 如果正在输入法组合中，放行，让浏览器和输入法处理
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openHistory();
  }
});

// 细节增强：为可点击的小组件添加轻微按压反馈（名言组件不再整卡可点）
const pressable = [historyWidget].filter(Boolean);
pressable.forEach(el => {
  el.style.cursor = 'pointer';
  el.addEventListener('mousedown', () => { el.style.transform = 'scale(0.99)'; });
  document.addEventListener('mouseup', () => { el.style.transform = ''; });
});

function addRemoveButton(widgetEl) {
  if (!widgetEl || widgetEl.querySelector('.remove-btn')) return;
  if (widgetEl.classList.contains('spacer')) return; // 空位不添加删除按钮
  const btn = document.createElement('button');
  btn.className = 'remove-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', '移除');
  btn.textContent = '−';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.widget');
    if (!card) return;
    // 直接移除组件（不再保留空位）
    card.parentNode.removeChild(card);
    saveLayout();
  });
  widgetEl.appendChild(btn);
}
function ensureRemoveButtons() {
  document.querySelectorAll('.widgets .widget').forEach(addRemoveButton);
}
ensureRemoveButtons();

function setEditMode(on) {
  if (on) {
    document.body.classList.add('edit-mode');
    ensureRemoveButtons();
  } else {
    document.body.classList.remove('edit-mode');
    disableDragSort();
  }
}
widgetsContainer = document.querySelector('.widgets');
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setEditMode(false);
});
document.addEventListener('mousedown', (e) => {
  if (!document.body.classList.contains('edit-mode')) return;
  if (!e.target.closest('.widget')) {
    setEditMode(false);
  }
}, true);

// 保存布局（退出编辑模式）
const LAYOUT_KEY = 'widgetsLayout';
async function layoutSet(val) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(r => chrome.storage.local.set({ [LAYOUT_KEY]: val }, r));
  }
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(val));
}
async function layoutGet(def = null) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(r => chrome.storage.local.get([LAYOUT_KEY], v => r(v?.[LAYOUT_KEY] ?? def)));
  }
  try { const v = localStorage.getItem(LAYOUT_KEY); return v ? JSON.parse(v) : def; } catch { return def; }
}
function collectLayout() {
  const items = Array.from(document.querySelectorAll('.widgets .widget'));
  return items
    .filter(el => !el.classList.contains('spacer'))
    .map(el => el.getAttribute('data-kind') || '')
    .filter(Boolean);
}
async function saveLayout() {
  const layout = collectLayout();
  await layoutSet(layout);
}
// 覆盖 setEditMode 退出时保存
const __origSetEditMode = setEditMode;
setEditMode = function(on){
  if (on) {
    __origSetEditMode(true);
  } else {
    __origSetEditMode(false);
    saveLayout();
  }
};

// 应用布局顺序（页面加载时）
(async () => {
  const l = await layoutGet(null);
  if (!Array.isArray(l) || !l.length) return;
  const container = document.querySelector('.widgets');
  if (!container) return;
  // 清理历史遗留的空位占位
  container.querySelectorAll('.widget.spacer').forEach(n => n.remove());
  const nodes = Array.from(container.children);
  const map = new Map();
  nodes.forEach(n => {
    const k = n.getAttribute('data-kind') || '';
    if (k) map.set(k, n);
  });
  const frag = document.createDocumentFragment();
  l.forEach(kind => {
    const n = map.get(kind);
    if (n) { frag.appendChild(n); map.delete(kind); }
  });
  // 追加未在布局中的（新组件）
  nodes.forEach(n => { 
    const k = n.getAttribute('data-kind') || '';
    if (!k) return;
    if (!l.includes(k)) frag.appendChild(n); 
  });
  container.appendChild(frag);
})();

// 齿轮按钮进入编辑模式
const editToggle = document.getElementById('edit-toggle');
// 左键点击进入删除模式（不打开组件页，不启用拖拽）
editToggle?.addEventListener('click', () => {
  setEditMode(true);
  enableDragSort();
});
// 右键点击打开组件库（右侧）
editToggle?.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  openPanel({ title: '', url: 'components.html', type: 'right' });
});

let dragData = { el: null };
function enableDragSort() {
  if (!widgetsContainer) return;
  widgetsContainer.classList.add('drag-active');
  widgetsContainer.querySelectorAll('.widget').forEach(w => {
    w.setAttribute('draggable', 'true');
  });
  widgetsContainer.addEventListener('dragstart', onDragStart);
  widgetsContainer.addEventListener('dragover', onDragOver);
  widgetsContainer.addEventListener('drop', onDrop);
  widgetsContainer.addEventListener('dragend', onDragEnd);
}
function disableDragSort() {
  if (!widgetsContainer) return;
  widgetsContainer.classList.remove('drag-active');
  widgetsContainer.querySelectorAll('.widget').forEach(w => {
    w.removeAttribute('draggable');
    w.classList.remove('dragging');
  });
  widgetsContainer.removeEventListener('dragstart', onDragStart);
  widgetsContainer.removeEventListener('dragover', onDragOver);
  widgetsContainer.removeEventListener('drop', onDrop);
  widgetsContainer.removeEventListener('dragend', onDragEnd);
}
function onDragStart(e) {
  const w = e.target.closest('.widget');
  if (!w) return;
  dragData.el = w;
  w.classList.add('dragging');
  try { e.dataTransfer.setData('text/plain', ''); } catch {}
}
function onDragOver(e) {
  if (!dragData.el || !widgetsContainer) return;
  e.preventDefault();
  const { clientX: x, clientY: y } = e;
  // 找到距离指针最近的 widget（排除拖拽中的元素）
  const widgets = Array.from(widgetsContainer.querySelectorAll('.widget'))
    .filter(w => w !== dragData.el && !w.classList.contains('spacer'));
  if (widgets.length === 0) return;
  let closest = null;
  let minDist = Infinity;
  widgets.forEach(w => {
    const rect = w.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < minDist) {
      minDist = dist;
      closest = { node: w, rect, dx, dy };
    }
  });
  if (!closest) return;
  const { node: target, rect, dx, dy } = closest;
  if (target === dragData.el) return;
  // 判定插入方向：以距离最近的元素为参考，按照“主轴靠近中心”的方向决定 before/after
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const before = horizontal ? (x < rect.left + rect.width / 2) : (y < rect.top + rect.height / 2);
  // drop hint 可视提示
  if (dragData.hintTarget && dragData.hintTarget !== target) {
    dragData.hintTarget.classList.remove('drop-before','drop-after');
  }
  dragData.hintTarget = target;
  target.classList.toggle('drop-before', before);
  target.classList.toggle('drop-after', !before);
  if (before) {
    if (dragData.el.previousSibling !== target) {
      widgetsContainer.insertBefore(dragData.el, target);
    }
  } else {
    if (target.nextSibling !== dragData.el) {
      widgetsContainer.insertBefore(dragData.el, target.nextSibling);
    }
  }
}
function onDrop(e) {
  e.preventDefault();
  if (dragData.hintTarget) {
    dragData.hintTarget.classList.remove('drop-before','drop-after');
  }
}
function onDragEnd() {
  if (dragData.el) dragData.el.classList.remove('dragging');
  dragData.el = null;
  // 拖拽结束即保存布局
  saveLayout();
  if (dragData.hintTarget) {
    dragData.hintTarget.classList.remove('drop-before','drop-after');
    dragData.hintTarget = null;
  }
}

// 不再生成占位组件

// 点击侧栏外关闭子页面
document.addEventListener('mousedown', (e) => {
  if (!historyPanel.classList.contains('open')) return;
  const isInsidePanel = historyPanel.contains(e.target);
  const isTrigger = historyWidget.contains(e.target);
  if (!isInsidePanel && !isTrigger) {
    closeHistory();
  }
}, true);
panelOverlay?.addEventListener('click', closeHistory);

// 子页面发消息关闭面板
window.addEventListener('message', (e) => {
  const msg = e?.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'closePanel') {
    closeHistory();
  } else if (msg.type === 'getWidgets') {
    try {
      const kinds = Array.from(document.querySelectorAll('.widgets .widget')).map(n => n.getAttribute('data-kind') || '');
      const frame = document.getElementById('history-frame');
      frame?.contentWindow?.postMessage({ type: 'widgetsList', widgets: kinds }, '*');
    } catch {}
  } else if (msg.type === 'addWidget') {
    const kind = msg.kind;
    if (!kind) return;
    const exists = !!document.querySelector(`.widgets .widget[data-kind="${kind}"]`);
    if (exists) return;
    const container = document.querySelector('.widgets');
    if (!container) return;
    let node = null;
    if (kind === 'history') {
      const div = document.createElement('div');
      div.className = 'widget widget-1x1';
      div.setAttribute('data-kind','history');
      div.innerHTML = '<div class="widget-inner"><div class="widget-title">历史记录</div><div class="widget-sub">点击查看最近访问</div></div>';
      node = div;
      addRemoveButton(div);
    } else if (kind === 'quote') {
      const div = document.createElement('div');
      div.className = 'widget widget-3x2';
      div.setAttribute('data-kind','quote');
      div.innerHTML = '<div class="widget-inner"><div class="quote-content"><div class="quote-text"></div><div class="quote-author"></div></div><button class="quote-next" aria-label="下一句">›</button></div>';
      node = div;
      addRemoveButton(div);
      // 简单初始化随机一句
      try {
        const t = div.querySelector('.quote-text');
        const a = div.querySelector('.quote-author');
        if (t) t.textContent = '名言已添加';
        if (a) a.textContent = '';
      } catch {}
    } else if (kind === 'translator') {
      const div = document.createElement('div');
      div.className = 'widget widget-3x2';
      div.setAttribute('data-kind','translator');
      div.innerHTML = '<div class="widget-inner translator"><div class="translator-input"><textarea class="tr-input" placeholder="输入待翻译文本..."></textarea></div><div class="translator-controls"><select class="tr-select tr-source"><option value="en" selected>English</option><option value="zh">中文</option></select><span class="tr-arrow">→</span><select class="tr-select tr-target"><option value="zh" selected>中文</option><option value="en">English</option></select><button class="tr-btn">翻译</button></div><div class="translator-output"></div></div>';
      node = div;
      addRemoveButton(div);
    }
    if (node) {
      container.appendChild(node);
      // 简单保存布局
      saveLayout();
      // 若当前在编辑模式，确保新节点可拖拽
      if (document.body.classList.contains('edit-mode')) {
        enableDragSort();
      }
    }
  }
});

const QUOTES_FALLBACK = [
  { t: '千里之行，始于足下', a: '老子' },
  { t: '不积跬步，无以至千里', a: '荀子' },
  { t: '业精于勤荒于嬉', a: '韩愈' },
  { t: '为者常成，行者常至', a: '' },
  { t: '少壮不努力，老大徒伤悲', a: '' },
  { t: '日日行，不怕千万里；常常做，不怕千万事', a: '' },
  { t: '读万卷书，行万里路', a: '' },
  { t: '心有猛虎，细嗅蔷薇', a: '西格夫里·萨松' },
  { t: 'Stay hungry, stay foolish', a: 'Steve Jobs' }
];
const QKEY = 'quotesDataset';
const storageQ = {
  async get(key, def) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise(r => chrome.storage.local.get([key], s => r(s?.[key] ?? def)));
    }
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  async set(key, val) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise(r => chrome.storage.local.set({ [key]: val }, r));
    }
    localStorage.setItem(key, JSON.stringify(val));
  }
};
async function getQuotesDataset() {
  let ds = await storageQ.get(QKEY, null);
  if (!ds || !Array.isArray(ds) || ds.length === 0) {
    try {
      const res = await fetch('./quotes.json', { cache: 'no-cache' });
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        ds = data;
        await storageQ.set(QKEY, ds);
      } else {
        ds = QUOTES_FALLBACK;
      }
    } catch {
      ds = QUOTES_FALLBACK;
    }
  }
  return ds;
}
async function refreshQuote() {
  const ds = await getQuotesDataset();
  if (!ds || ds.length === 0 || !quoteTextEl) return;
  const i = Math.floor(Math.random() * ds.length);
  const q = ds[i];
  quoteTextEl.textContent = q.t || '';
  if (quoteAuthorEl) quoteAuthorEl.textContent = q.a ? `— ${q.a}` : '';
}
if (quoteWidget) {
  refreshQuote();
  quoteNextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    refreshQuote();
  });
  quoteWidget.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openPanel({ title: '', url: 'quote_settings.html', type: 'right' });
  });
}

// 翻译组件
const trInput = document.getElementById('tr-input');
const trSource = document.getElementById('tr-source');
const trTarget = document.getElementById('tr-target');
const trRun = document.getElementById('tr-run');
const trOutput = document.getElementById('tr-output');
const trKeyBtn = document.getElementById('tr-key');
const TR_EMAIL = 'myMemoryEmail';
async function trGetEmail() {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(r => chrome.storage.local.get([TR_EMAIL], v => r(v?.[TR_EMAIL] || '')));
  }
  try { return localStorage.getItem(TR_EMAIL) || ''; } catch { return ''; }
}
async function trSetEmail(val) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(r => chrome.storage.local.set({ [TR_EMAIL]: val }, r));
  }
  localStorage.setItem(TR_EMAIL, val);
}
async function runTranslate() {
  const text = (trInput?.value || '').trim();
  if (!text || !trOutput) return;
  const source = trSource?.value || 'en';
  const target = trTarget?.value || 'zh';
  trOutput.textContent = '翻译中…';
  try {
    // MyMemory 首选
    const email = await trGetEmail();
    const pair = `${source}|${target}`;
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', pair);
    if (email) url.searchParams.set('de', email);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    let out = data?.responseData?.translatedText || '';
    // MyMemory 可能返回 html 实体，简单解码
    out = out.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
    if (out) {
      trOutput.textContent = out;
      return;
    }
    // 回退到 LibreTranslate
    const ctrl2 = new AbortController();
    const timer2 = setTimeout(() => ctrl2.abort(), 8000);
    const res2 = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
      signal: ctrl2.signal
    });
    clearTimeout(timer2);
    if (!res2.ok) throw new Error('bad status');
    const data2 = await res2.json();
    const out2 = data2?.translatedText || '';
    trOutput.textContent = out2 || '未获取到结果';
  } catch {
    trOutput.textContent = '请求失败，请稍后重试';
  }
}
trRun?.addEventListener('click', runTranslate);
trInput?.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
    runTranslate();
  }
});
trKeyBtn?.addEventListener('click', async () => {
  const current = await trGetEmail();
  const v = prompt('设置 MyMemory 邮箱（可选，用于提升免费额度）', current || '');
  if (v !== null) {
    await trSetEmail(v.trim());
    trOutput && (trOutput.textContent = '已保存邮箱');
  }
});
