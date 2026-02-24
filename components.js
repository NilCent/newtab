document.addEventListener('DOMContentLoaded', () => {
  const items = Array.from(document.querySelectorAll('.item'));
  const addBtns = Array.from(document.querySelectorAll('[data-add]'));
  function askKinds() {
    try { window.parent?.postMessage({ type: 'getWidgets' }, '*'); } catch {}
  }
  window.addEventListener('message', (e) => {
    const msg = e?.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'widgetsList') {
      const set = new Set(msg.widgets || []);
      items.forEach(it => {
        const k = it.getAttribute('data-kind');
        const btn = it.querySelector('[data-add]');
        if (!btn) return;
        // 链接组件允许多次添加，其余组件若已存在则禁用
        if (k === 'link') {
          btn.removeAttribute('disabled');
        } else {
          if (set.has(k)) btn.setAttribute('disabled', 'true');
          else btn.removeAttribute('disabled');
        }
      });
    }
  });
  addBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.closest('.item')?.getAttribute('data-kind');
      if (!k) return;
      try { window.parent?.postMessage({ type: 'addWidget', kind: k }, '*'); } catch {}
      if (k !== 'link') btn.setAttribute('disabled', 'true');
    });
  });
  askKinds();
});

