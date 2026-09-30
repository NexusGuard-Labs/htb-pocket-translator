# Validação da versão móvel

Base: revisão desktop `d3d6492` do HTB Context Translator. O relatório daquela revisão está no repositório de origem.

A cópia usa um manifesto Firefox próprio, background por scripts, API WebExtensions nativa e controles de toque. O Chrome original continua em seu repositório separado.

- 13 casos automatizados no Node/Chromium cobrem núcleo, popup, navegação, cache, erros, seleção e viewport de 320 px.
- `web-ext lint` valida o manifesto e as APIs para distribuição Firefox.
- `tests/firefox_smoke.py` testa o pacote real com Firefox desktop e perfil temporário.
- O empacotador não inclui configuração privada e não assina o XPI.

Limites: os testes usam conteúdo sintético. Não houve aparelho Android conectado nem sessão autenticada do HTB. A assinatura Mozilla depende da conta do mantenedor e ainda não foi realizada. Esses pontos estão explícitos nas instruções de instalação.

Resultado desta execução: **13/13 testes Node/Chromium aprovados**, smoke test do Firefox real aprovado e validador Mozilla com **0 erros, 0 avisos e 0 observações**. O teste Firefox usou uma chave fictícia e não fez chamadas externas Gemini.
