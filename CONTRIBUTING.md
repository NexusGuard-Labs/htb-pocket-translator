# Contribuir

Mantenha o foco: tradução automática contextual para pt-BR no Firefox Android, preservando código e a leitura confortável. Faça mudanças em uma branch, teste, commite, envie ao remoto e abra um PR. Não distribua credenciais.

## Testar

```bash
npm install
npx playwright-core install chromium
npm test
npm run lint:addon
npm run build
git diff --check
```

`npm test` roda 13 casos no Node/Chromium: lógica compartilhada, navegação, cache, erros, chave, preservação de código, seleção e layout de 320 px. O teste integrado em Chromium adapta apenas o manifesto em uma pasta temporária; o pacote de distribuição continua usando o manifesto Firefox.

Para um Chromium já instalado: `CHROME_PATH=/caminho/chrome npm test`.

## Firefox real

Instale Firefox, geckodriver e Selenium para Python (`python3 -m pip install selenium` em ambiente virtual). Depois:

```bash
GECKODRIVER=/caminho/geckodriver npm run test:firefox
```

Usa perfil temporário, instala o XPI sem assinatura temporariamente e verifica background, popup, chave mascarada e glossário persistido. Não usa seu perfil pessoal. Execute como usuário normal da sessão gráfica, não como root.

Teste no telefone conectado: veja [INSTRUCTIONS.md](INSTRUCTIONS.md). Validação em Firefox desktop e viewport pequeno não equivale a teste em Android físico.

## Prompt

`tests/prompt-cases.json` contém cinco exemplos sintéticos. O avaliador opcional usa a API real e consome cota:

```bash
HTB_CONFIG_FILE=/caminho/privado/config.js node tests/evaluate-prompt.cjs
```

Esse arquivo de teste local deve definir `const CONFIG = { GEMINI_API_KEY: 'sua chave' };` e ficar fora do Git. O aplicativo móvel usa exclusivamente o popup para configurar a chave. O teste verifica termos essenciais, e a revisão humana deve avaliar naturalidade e sentido.

## Pacote e assinatura

`package_addon.py` usa apenas a biblioteca padrão do Python e uma lista explícita de arquivos. O XPI gerado em `dist/` não é assinado. A assinatura e a distribuição são feitas pela conta Mozilla da organização, conforme [INSTRUCTIONS.md](INSTRUCTIONS.md).
