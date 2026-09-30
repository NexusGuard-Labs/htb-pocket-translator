// O DOM do curso é preservado: somente nós de texto recebem traduções.
(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  if (globalThis.__htbTranslatorLoaded) return;
  globalThis.__htbTranslatorLoaded = true;
  const BLOCKS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,figcaption';
  const IGNORE = 'pre,code,kbd,samp,script,style,textarea,input,select,button,form,nav,footer,svg,math,[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,.terminal,.xterm,.console,.pwnbox-terminal,.question-box,.questions,[hidden],[aria-hidden="true"],#htb-translator-widget,#htb-selection-popup';
  const records = new Map();
  let glossary = '', googleBlocked = false;
  const cache = new Map();
  try {
    const saved = JSON.parse(sessionStorage.getItem('htb-translations-v2') || '[]');
    if (Array.isArray(saved)) for (const pair of saved.slice(-200)) {
      if (Array.isArray(pair) && typeof pair[0] === 'string' && typeof pair[1] === 'string' && pair[0].length < 12000 && pair[1].length < 32000) cache.set(...pair);
    }
  } catch { /* Cache indisponível não impede tradução. */ }
  function cacheKey(record) { return JSON.stringify([route, glossary, originalContext(record.block), record.original]); }
  function saveCache(key, value) {
    cache.set(key, value);
    while (cache.size > 200) cache.delete(cache.keys().next().value);
    try {
      let serialized = JSON.stringify([...cache]);
      while (serialized.length > 500000 && cache.size) { cache.delete(cache.keys().next().value); serialized = JSON.stringify([...cache]); }
      sessionStorage.setItem('htb-translations-v2', serialized);
    } catch { /* A página continua utilizável sem armazenamento. */ }
  }
  let auto = true, ready = false, showOriginal = false, failure = false;
  let route = routeKey(), generation = 0, running = null, timer, widget, observer;
  const guard = globalThis.htbTranslationGuard;
  function routeKey() { return location.pathname + location.search; }
  function isLesson() { return /\/(?:app\/)?module\/\d+\/section\/\d+\/?$/.test(location.pathname); }
  function container() {
    return document.querySelector('.module-content article, #module-content article') || document.querySelector('.module-content, #module-content') || document.querySelector('article') || document.querySelector('main');
  }
  async function message(data) {
    try {
      const result = await api.runtime.sendMessage(data);
      if (!result?.success) throw new Error(result?.error || 'Sem resposta da extensão. Recarregue esta página.');
      return result;
    } catch (error) {
      if (/context invalidated|Receiving end|message port/i.test(error.message)) throw new Error('Extensão atualizada. Recarregue esta página do HTB.');
      throw error;
    }
  }
  function status(text, loading = false, error = false) {
    const badge = widget.querySelector('#htb-status-badge');
    badge.textContent = text;
    badge.className = `htb-trans-badge${loading ? ' loading' : error ? ' error' : ' active'}`;
    widget.querySelector('#htb-btn-translate').disabled = loading;
    widget.querySelector('#htb-btn-toggle').disabled = loading;
  }
  function updateToggle() {
    widget.querySelector('#htb-btn-toggle').hidden = !Array.from(records.values()).some(r => r.translated !== null && intact(r));
    widget.querySelector('#htb-toggle-text').textContent = showOriginal ? 'Ver Tradução (PT-BR)' : 'Ver Original (EN)';
  }
  function observe() { observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  function editText(callback) {
    observer.disconnect();
    try { callback(); } finally { observe(); }
  }
  function intact(record) { return record.node.isConnected && record.node.nodeValue === record.applied; }
  function apply(record, value) {
    if (!intact(record)) return false;
    record.node.nodeValue = value; record.applied = value;
    return true;
  }
  function cancel() {
    generation++;
    if (running) api.runtime.sendMessage({ action: 'cancel_translation' }).catch(() => {});
    running = null;
    clearTimeout(timer);
  }
  function checkRoute() {
    if (routeKey() === route) return false;
    cancel();
    editText(() => { for (const record of records.values()) apply(record, record.original); });
    records.clear(); route = routeKey(); showOriginal = false; failure = false;
    widget.hidden = !isLesson(); updateToggle(); status('Nova seção'); schedule();
    return true;
  }
  function originalContext(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let result = '';
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement.closest('script,style,form,button,.question-box')) continue;
      const record = records.get(node);
      result += record && intact(record) ? record.original : node.nodeValue;
      if (result.length > 1200) break;
    }
    return result.slice(0, 1200);
  }
  function collect() {
    const root = container();
    if (!root || !isLesson()) return [];
    for (const [node, record] of records) if (!root.contains(node) || !intact(record)) records.delete(node);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), result = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest(IGNORE)) continue;
      const block = parent.closest(BLOCKS);
      if (!block || !root.contains(block) || !/[\p{L}]/u.test(node.nodeValue) || !parent.getClientRects().length) continue;
      let record = records.get(node);
      if (!record) {
        record = { node, block, original: node.nodeValue, applied: node.nodeValue, translated: null };
        records.set(node, record);
      }
      if (record.translated === null) result.push(record);
    }
    return result;
  }
  function protect(text) {
    const literals = [];
    const pattern = /__HTB_KEEP_\d+__|`[^`\n]+`|https?:\/\/[^\s<>"']+|\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b|\b[A-Fa-f0-9]{32,128}\b|\b[A-Za-z]:\\(?:[^\s,;"'<>]+)|(?<![\w:])\/(?:[\w.-]+\/)*[\w.-]+|(?<!\w)--?[A-Za-z][\w-]*|\b(?:Burp Suite|Nmap|Metasploit|Wireshark|Cloudflare|ModSecurity|Sysmon|WinSock|libcurl|Chisel|Active Directory)\b/g;
    return { text: text.replace(pattern, value => `__HTB_KEEP_${literals.push(value) - 1}__`), literals };
  }
  function restore(text, literals) {
    const markers = text.match(/__HTB_KEEP_\d+__/g) || [];
    if (markers.length !== literals.length || literals.some((_, i) => markers.filter(m => m === `__HTB_KEEP_${i}__`).length !== 1)) throw new Error('A IA alterou um trecho protegido. O original foi mantido.');
    return text.replace(/__HTB_KEEP_(\d+)__/g, (_, i) => literals[Number(i)]);
  }
  function schedule(delay = 800) {
    if (!ready || !auto || showOriginal || failure || !isLesson()) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (!running) void translatePage(); }, delay);
  }
  async function translatePage(manual = false) {
    checkRoute();
    if (running || !ready || !isLesson()) return;
    if (guard && !guard.ensureOriginal()) { status('Google Tradutor ativo. Use Mostrar original no Chrome para continuar.', false, true); return; }
    if (manual) {
      failure = false; showOriginal = false;
      editText(() => { for (const record of records.values()) if (record.translated !== null) apply(record, record.translated); });
    }
    let candidates = collect();
    // A chave usa texto original completo e contexto antes de qualquer alteração no DOM.
    for (const record of candidates) record.cacheKey = cacheKey(record);
    editText(() => {
      for (const record of candidates) {
        const cached = cache.get(record.cacheKey);
        if (cached !== undefined) { record.translated = cached; apply(record, cached); }
      }
    });
    candidates = candidates.filter(record => record.translated === null);
    if (!candidates.length) {
      if (manual) editText(() => { for (const record of records.values()) if (record.translated !== null) apply(record, record.translated); });
      updateToggle(); status(records.size ? 'Tradução disponível' : 'Aguardando texto da seção'); return;
    }
    const run = { generation, route, root: container() };
    running = run;
    const valid = () => running === run && generation === run.generation && routeKey() === run.route && container() === run.root && !guard?.isTranslated();
    let completed = 0;
    try {
      const entries = candidates.map((record, id) => {
        const protectedText = protect(record.original.trim());
        return { record, literals: protectedText.literals, item: { id, text: protectedText.text, context: originalContext(record.block) } };
      });
      const batches = []; let batch = [], size = 0;
      for (const entry of entries) {
        const length = JSON.stringify(entry.item).length;
        if (entry.item.text.length > 8000 || length > 18000) throw new Error('Trecho muito longo. Use a tradução por seleção para trechos menores.');
        if (batch.length && (batch.length >= 16 || size + length > 18000)) { batches.push(batch); batch = []; size = 0; }
        batch.push(entry); size += length;
      }
      if (batch.length) batches.push(batch);
      for (let i = 0; i < batches.length; i++) {
        if (!valid()) return;
        const current = batches[i].filter(entry => intact(entry.record));
        if (!current.length) continue;
        status(`Traduzindo ${i + 1}/${batches.length}`, true);
        const response = await message({ action: 'translate_batch', items: current.map(entry => entry.item) });
        if (!valid()) return;
        if (!Array.isArray(response.results) || response.results.length !== current.length) throw new Error('Resposta de tradução incompleta.');
        const byId = new Map(response.results.map(result => [result.id, result.translatedText]));
        if (byId.size !== current.length) throw new Error('Resposta com IDs duplicados.');
        const translations = current.map(entry => {
          const text = byId.get(entry.item.id), original = entry.record.original;
          if (typeof text !== 'string' || !text.trim()) throw new Error('Resposta de tradução inválida.');
          const value = original.match(/^\s*/)[0] + restore(text.trim(), entry.literals) + original.match(/\s*$/)[0];
          return { entry, value };
        });
        editText(() => {
          for (const { entry, value } of translations) {
            if (!intact(entry.record)) continue;
            entry.record.translated = value; apply(entry.record, value);
            saveCache(entry.record.cacheKey, value);
            entry.record.block.classList.add('htb-fade-in'); completed++;
          }
        });
      }
      if (valid()) status('Tradução concluída');
    } catch (error) {
      if (valid()) { failure = true; status(`${completed ? 'Tradução parcial. ' : ''}${error.message}`, false, true); }
    } finally {
      if (running === run) {
        running = null; updateToggle();
        if (!failure && !showOriginal && auto && collect().length) schedule();
      }
    }
  }
  function toggleLanguage() {
    if (running) return;
    showOriginal = !showOriginal; clearTimeout(timer);
    editText(() => { for (const record of records.values()) if (record.translated !== null) apply(record, showOriginal ? record.original : record.translated); });
    updateToggle(); status(showOriginal ? 'Original (EN)' : 'Tradução (PT-BR)');
    if (!showOriginal) schedule();
  }
  function setPreferences(preferences) {
    const previous = auto; auto = preferences.autoTranslate;
    if (typeof preferences.glossary === 'string' && preferences.glossary !== glossary) {
      cancel(); failure = false;
      editText(() => { for (const record of records.values()) apply(record, record.original); });
      records.clear(); cache.clear(); glossary = preferences.glossary; showOriginal = false; updateToggle(); schedule();
    }
    widget.querySelector('#htb-auto-check').checked = auto;
    if (!auto) { cancel(); status('Auto-tradução desativada'); }
    else if (!previous) { failure = false; schedule(); }
  }
  function selection(text) {
    let popup = document.getElementById('htb-selection-popup');
    if (!popup) {
      popup = document.createElement('div'); popup.id = 'htb-selection-popup';
      const header = document.createElement('div'); header.className = 'htb-popup-header'; header.textContent = 'Tradução HTB';
      const close = document.createElement('button'); close.className = 'htb-close-btn'; close.textContent = '×'; close.setAttribute('aria-label', 'Fechar tradução'); close.onclick = () => popup.remove();
      header.append(close);
      const body = document.createElement('div'); body.className = 'htb-selection-text'; popup.append(header, body); document.body.append(popup);
    }
    popup.querySelector('.htb-selection-text').textContent = text;
  }
  async function init() {
    widget = document.createElement('div'); widget.id = 'htb-translator-widget'; widget.hidden = !isLesson();
    widget.innerHTML = `<div class="htb-trans-card">
      <div class="htb-trans-header"><span class="htb-trans-title">🛡️ HTB Pocket</span></div>
      <div id="htb-status-badge" class="htb-trans-badge" role="status" aria-live="polite">Pronto</div>
      <div class="htb-trans-actions"><button id="htb-btn-translate" class="htb-btn-primary">Traduzir / tentar novamente</button>
      <button id="htb-btn-toggle" class="htb-btn-secondary" hidden><span id="htb-toggle-text">Ver Original (EN)</span></button></div>
      <label class="htb-trans-checkbox-label htb-trans-toggle-row"><input type="checkbox" id="htb-auto-check" checked>Auto-traduzir ao avançar e voltar</label></div>`;
    const controls = document.createElement('details');
    controls.className = 'htb-controls';
    const summary = document.createElement('summary'); summary.textContent = 'Opções de tradução';
    controls.append(summary, widget.querySelector('.htb-trans-actions'), widget.querySelector('.htb-trans-toggle-row'));
    widget.querySelector('.htb-trans-card').append(controls);
    const selectionButton = document.createElement('button');
    selectionButton.id = 'htb-btn-selection'; selectionButton.className = 'htb-btn-primary';
    selectionButton.textContent = 'Traduzir seleção'; selectionButton.hidden = true;
    widget.querySelector('.htb-trans-card').append(selectionButton);
    let selectedText = '', selectedContext = '';
    document.addEventListener('selectionchange', () => {
      const selected = window.getSelection();
      const parent = selected?.anchorNode?.parentElement;
      const text = selected?.toString().trim() || '';
      if (text && parent && container()?.contains(parent) && !parent.closest('#htb-translator-widget,#htb-selection-popup')) {
        selectedText = text; selectedContext = originalContext(parent.closest(BLOCKS) || parent);
        selectionButton.hidden = false;
      } else if (!text) selectionButton.hidden = true;
    });
    selectionButton.onpointerdown = event => event.preventDefault();
    selectionButton.onclick = async () => {
      if (!selectedText || guard?.isTranslated()) return;
      const selectedRoute = routeKey(); selectionButton.disabled = true; selection('Traduzindo seleção...');
      try {
        const result = await message({ action: 'translate_selection', text: selectedText, context: selectedContext });
        if (selectedRoute === routeKey()) selection(result.text);
      } catch (error) { if (selectedRoute === routeKey()) selection(error.message); }
      finally { selectionButton.disabled = false; }
    };
    document.body.append(widget);
    widget.querySelector('#htb-btn-translate').onclick = () => void translatePage(true);
    widget.querySelector('#htb-btn-toggle').onclick = toggleLanguage;
    widget.querySelector('#htb-auto-check').onchange = async event => {
      const value = event.target.checked; setPreferences({ autoTranslate: value });
      try { await message({ action: 'set_auto_translate', value }); } catch (error) { status(error.message, false, true); }
    };
    observer = new MutationObserver(mutations => {
      if (checkRoute()) return;
      if (guard?.isTranslated()) return;
      const relevant = mutations.some(m => {
        const el = m.target.nodeType === Node.ELEMENT_NODE ? m.target : m.target.parentElement;
        return el && !el.closest('#htb-translator-widget,#htb-selection-popup') && (container()?.contains(el) || m.type === 'childList' && Array.from(m.addedNodes).some(n => n.nodeType === Node.ELEMENT_NODE && (n.matches('article,main,.module-content,#module-content') || n.querySelector('article,main,.module-content,#module-content'))));
      });
      if (relevant) schedule();
    });
    observe();
    // A página e o content script usam mundos JS diferentes: não sobrescreve history.pushState.
    setInterval(() => {
      if (checkRoute() || !isLesson()) return;
      if (guard?.isTranslated()) {
        if (!googleBlocked) {
          googleBlocked = true; cancel();
          status('Google Tradutor ativo. Use Mostrar original no Chrome para continuar.', false, true);
          guard.ensureOriginal();
        }
      } else if (googleBlocked) { googleBlocked = false; failure = false; schedule(); }
    }, 500);
    window.addEventListener('popstate', () => { checkRoute(); });
    window.addEventListener('pageshow', () => { checkRoute(); schedule(); });
    api.runtime.onMessage.addListener((request, sender, respond) => {
      if (sender.id !== api.runtime.id) return false;
      if (request.action === 'trigger_translate') {
        if (!isLesson()) { respond({ success: false, error: 'Abra uma seção de curso do HTB Academy.' }); return false; }
        void translatePage(true); respond({ success: true });
      } else if (request.action === 'preferences_updated' || request.action === 'glossary_updated') setPreferences(request);
      else if (request.action === 'api_key_updated') { cancel(); failure = false; setPreferences(request); schedule(); }
      else if (request.action === 'selection_context') {
        const selected = window.getSelection();
        const node = selected?.anchorNode;
        const parent = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
        const block = parent?.closest(BLOCKS);
        respond({ success: !guard?.isTranslated(), context: block ? originalContext(block) : '' });
      }
      else if (request.action === 'selection_result') selection(request.text);
      return false;
    });
    try { setPreferences(await message({ action: 'get_settings' })); ready = true; schedule(); }
    catch (error) { status(error.message, false, true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else void init();
})();
