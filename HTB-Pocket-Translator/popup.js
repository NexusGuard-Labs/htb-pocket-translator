'use strict';
const api = globalThis.browser || globalThis.chrome;
document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('api-key-input');
  const visibility = document.getElementById('toggle-visibility');
  const save = document.getElementById('btn-save-key');
  const test = document.getElementById('btn-test-key');
  const feedback = document.getElementById('api-feedback');
  const auto = document.getElementById('auto-translate-toggle');
  const translate = document.getElementById('btn-translate-now');
  const badge = document.getElementById('header-status-badge');
  function show(text, type = 'info') {
    feedback.textContent = text;
    feedback.className = `feedback-box feedback-${type}`;
    feedback.style.display = 'block';
  }
  function render(settings) {
    document.getElementById('current-key-masked').textContent = settings.hasKey ? `******** • ${settings.source === 'popup' ? 'salva no navegador' : 'arquivo local'}` : 'Nenhuma chave configurada';
    document.getElementById('status-indicator-dot').className = `dot ${settings.hasKey ? 'dot-ok' : 'dot-err'}`;
    badge.className = `badge ${settings.hasKey ? 'badge-active' : 'badge-idle'}`;
    badge.textContent = settings.hasKey ? 'Configurada' : 'Sem chave';
    auto.checked = settings.autoTranslate;
    if (typeof settings.glossary === 'string') document.getElementById('glossary-input').value = settings.glossary;
  }
  async function message(request) {
    const result = await api.runtime.sendMessage(request);
    if (!result?.success) throw new Error(result?.error || 'Sem resposta da extensão. Recarregue a extensão.');
    return result;
  }
  function busy(value) { save.disabled = value; test.disabled = value; input.disabled = value; }
  visibility.onclick = () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    const visible = input.type === 'text';
    visibility.textContent = visible ? '🔒' : '👁️';
    visibility.setAttribute('aria-label', visible ? 'Ocultar chave' : 'Mostrar chave');
    visibility.setAttribute('aria-pressed', String(visible));
  };
  save.onclick = async () => {
    const key = input.value.trim();
    if (!key) { show('Insira a nova chave de API.', 'error'); input.focus(); return; }
    busy(true);
    try {
      render(await message({ action: 'save_api_key', key }));
      input.value = ''; input.type = 'password';
      visibility.textContent = '👁️'; visibility.setAttribute('aria-pressed', 'false'); visibility.setAttribute('aria-label', 'Mostrar chave');
      show('Chave salva. Novas traduções já usam esta chave.', 'success');
    } catch (error) { show(error.message, 'error'); }
    finally { busy(false); }
  };
  test.onclick = async () => {
    const unsaved = !!input.value.trim();
    busy(true);
    show('Testando uma tradução curta com a chave informada ou configurada...');
    try {
      const result = await message({ action: 'test_api_key', key: input.value.trim() });
      show(`Tradução de teste concluída (${result.model}).${unsaved ? ' Clique em Salvar Chave para ativá-la.' : ''}`, 'success');
    } catch (error) { show(error.message, 'error'); }
    finally { busy(false); }
  };
  auto.onchange = async () => {
    const value = auto.checked;
    auto.disabled = true;
    try { await message({ action: 'set_auto_translate', value }); show(value ? 'Auto-tradução ativada.' : 'Auto-tradução desativada.'); }
    catch (error) { auto.checked = !value; show(error.message, 'error'); }
    finally { auto.disabled = false; }
  };
  translate.onclick = async () => {
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || new URL(tab.url).origin !== 'https://academy.hackthebox.com') throw new Error('Abra uma seção de curso do HTB Academy.');
      let result;
      try { result = await api.tabs.sendMessage(tab.id, { action: 'trigger_translate' }); }
      catch { throw new Error('Recarregue a página do HTB para conectar a extensão.'); }
      if (!result?.success) throw new Error(result?.error || 'Não foi possível iniciar a tradução.');
      window.close();
    } catch (error) { show(error.message, 'error'); }
  };
  document.getElementById('btn-save-glossary').onclick = async () => {
    const button = document.getElementById('btn-save-glossary');
    button.disabled = true;
    try {
      render(await message({ action: 'save_glossary', glossary: document.getElementById('glossary-input').value }));
      show('Glossário salvo. A tradução será atualizada.', 'success');
    } catch (error) { show(error.message, 'error'); }
    finally { button.disabled = false; }
  };
  api.runtime.onMessage.addListener(request => {
    if (['preferences_updated', 'api_key_updated', 'glossary_updated'].includes(request.action)) render(request);
  });
  try { render(await message({ action: 'get_settings' })); }
  catch (error) { show(error.message, 'error'); }
});
