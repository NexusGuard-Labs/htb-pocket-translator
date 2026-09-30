# Privacidade e segurança

Responsável: [NexusGuard-Labs](https://github.com/NexusGuard-Labs). Owner: [Mid-night2026](https://github.com/Mid-night2026).

## Dados utilizados

Cada usuário configura sua própria chave Gemini. Ela fica no armazenamento local do perfil do Firefox e é enviada por HTTPS no cabeçalho `x-goog-api-key` para `generativelanguage.googleapis.com`.

A tradução também envia ao Google os fragmentos selecionados ou da seção, o contexto necessário do parágrafo e os termos do glossário. O manifesto declara transmissão de conteúdo de sites e informações de autenticação. A extensão não envia esses dados à organização, não tem backend próprio nem telemetria. O tratamento pela API Google depende das condições aplicáveis ao seu projeto.

A máscara esconde os caracteres na interface, mas não criptografa o armazenamento. Quem tem acesso ao perfil do navegador pode inspecionar a chave. A chave nunca é retornada nas mensagens para a página; o background realiza as chamadas. `setAccessLevel` é aplicado quando o navegador oferece essa API; em versões que não a oferecem, os content scripts da própria extensão têm o acesso padrão ao storage, sem disponibilizá-lo ao JavaScript do site.

O cache de traduções fica em `sessionStorage`, limitado em tamanho, e pode ser lido pelo próprio site. Não contém chaves. A restauração de sessão do navegador pode preservar esse cache.

## Distribuir sem expor segredos

O pacote é montado por uma lista explícita de arquivos e não inclui `config.js`, `.env`, perfis, scripts de terminal ou testes. Nenhuma chave deve ser embutida na extensão. `.gitignore` não protege arquivos adicionados à força ou já existentes no histórico.

Restrinja a chave à API Gemini, confira cotas e revogue uma chave exposta. [Orientações do Google](https://ai.google.dev/gemini-api/docs/api-key). A chave da conta Mozilla para assinatura é diferente da chave Gemini: mantenha ambas fora do Git.

Traduções são aplicadas como texto, nunca executadas como HTML. Código, comandos, links e eventos são preservados. Mensagens de configuração são aceitas apenas da página do popup da própria extensão.

## Relatar problemas

O relato privado de vulnerabilidades está habilitado. Use [Report a vulnerability](https://github.com/NexusGuard-Labs/htb-pocket-translator/security/advisories/new) ou procure o owner. Não exponha chaves ou dados de cursos em uma issue pública.
