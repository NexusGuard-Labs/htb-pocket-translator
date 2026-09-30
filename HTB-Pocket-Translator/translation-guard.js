// Executa antes do conteúdo: evita sobrepor Gemini ao Google Tradutor.
(() => {
  'use strict';
  const isTranslated = () => document.documentElement?.classList.contains('translated-ltr') || document.documentElement?.classList.contains('translated-rtl');
  function protectPage() {
    if (!document.head) return false;
    let meta = document.head.querySelector('meta[name="google"][content="notranslate"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'google'; meta.content = 'notranslate';
      document.head.prepend(meta);
    }
    return true;
  }
  if (!protectPage()) {
    const observer = new MutationObserver(() => { if (protectPage()) observer.disconnect(); });
    observer.observe(document, { childList: true, subtree: true });
  }
  globalThis.htbTranslationGuard = {
    isTranslated,
    ensureOriginal() {
      if (!isTranslated()) return true;
      protectPage();
      // Uma única recarga por seção e aba recupera o HTML do servidor.
      // A extensão não tem API para alterar a preferência global de tradução do Chrome.
      const key = 'htb-original-reload:' + location.pathname + location.search;
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          location.reload();
        }
      } catch { /* Storage indisponível: mantém o bloqueio, sem arriscar loop. */ }
      return false;
    }
  };
})();
