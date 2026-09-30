# Instalar e usar no Android

Use **Firefox para Android 142+**. Este projeto é uma extensão, não um aplicativo APK. Cada pessoa usa sua própria chave Gemini.

## Instalar o pacote assinado

O Firefox estável exige assinatura da Mozilla. Depois de obter um `.xpi` assinado:

1. Salve o arquivo no celular.
2. No Firefox, abra **Configurações → Sobre o Firefox**.
3. Toque cinco vezes seguidas no logotipo para habilitar as opções de instalação por arquivo.
4. Volte às configurações e abra **Instalar extensão de arquivo**.
5. Selecione o XPI assinado e confirme as permissões.

Esse é o procedimento documentado para [instalação independente no Android](https://www.extensionworkshop.com/documentation/publish/install-self-distributed/). Um XPI `unsigned` serve para desenvolvimento, não substitui a assinatura.

## Preparar a distribuição — owner

1. Rode `npm run build`. O pacote gerado em `dist/` não contém credenciais.
2. Entre no [Developer Hub da Mozilla](https://addons.mozilla.org/developers/), com a conta responsável pelo complemento.
3. Envie o pacote para assinatura, como distribuição própria (*unlisted*) ou listagem pública. Indique compatibilidade com Android, uso de Gemini e a política de privacidade deste repositório.
4. Após a aprovação/assinatura, baixe o XPI assinado e disponibilize-o aos usuários.

A assinatura depende da conta Mozilla e de sua análise; não foi realizada nesta sessão. O ID do complemento é `htb-pocket-translator@nexusguard-labs`. Não altere esse ID entre atualizações.

## Configurar e traduzir

Abra **menu do Firefox → Extensões → HTB Pocket Translator**. Cole a chave pessoal no campo mascarado. **Testar Conexão** faz uma tradução curta e consome cota; depois toque **Salvar Chave**. Chaves não são copiadas do navegador do computador.

Abra uma seção no HTB Academy. A extensão traduz automaticamente e acompanha avançar/voltar. Expanda **Opções de tradução** para ver o original, retomar uma falha ou desligar a automação. O painel fica recolhido para economizar espaço.

Para um trecho, faça a seleção pelo toque e use **Traduzir seleção** no painel. O resultado aparece em uma caixa com botão de fechar. O glossário do popup aceita termos separados por vírgulas que você deseja preservar.

## Teste temporário no aparelho — desenvolvimento

Com o Android conectado por USB, depuração USB e depuração remota do Firefox habilitadas, use as ferramentas de desenvolvimento da Mozilla:

```bash
npx --yes web-ext@10.7.0 run --source-dir HTB-Pocket-Translator --target firefox-android --firefox-apk org.mozilla.firefox
```

Requer Android Platform Tools (`adb`) e autorização da conexão no aparelho. [Guia oficial](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/). Essa instalação é temporária.

## Se algo falhar

- Sem tradução: confira permissão de acesso ao Academy, chave e automação ativada; recarregue a aba.
- Cota ou rede: o original fica preservado. Aguarde a disponibilidade e toque **Traduzir / tentar novamente**.
- Texto já traduzido por outro tradutor: restaure a página original; não sobreponha as duas traduções.
- XPI rejeitado: confira a versão do Firefox e se o pacote foi assinado. Renomear um ZIP para XPI não produz assinatura.

Modelos: `python3 atualizar_modelo.py` mostra a lista; informe de um a três IDs oficiais para mudá-la. Depois, gere e assine uma nova versão do pacote para instalar no telefone.
