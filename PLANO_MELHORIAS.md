# Plano de melhorias

Objetivo: traduzir automaticamente para pt-BR com naturalidade e precisão técnica, preservando código e os termos que fazem sentido em inglês. Apenas duas melhorias adicionais têm benefício direto após as correções desta revisão.

| Prioridade | Melhoria | Implementação simples | Como aceitar |
|---|---|---|---|
| 1 | Avaliar qualidade contextual com exemplos revisados por uma pessoa | Ampliar os cinco casos já registrados em `tests/prompt-cases.json` para 15–20 frases curtas próprias sobre redes, autenticação e pentest. Incluir termos ambíguos, frases divididas por links e exemplos de redundância. Registrar a tradução esperada e a razão das escolhas. Rodar manualmente o mesmo prompt ao trocar modelo ou alterar terminologia; ajustar somente os casos com erro comprovado. | O sentido está completo, o português é natural, código e nomes permanecem intactos e não aparecem duplicatas acrescentadas. Aceitar variações naturais, sem exigir frases idênticas. |
| 2 | Validar em um telefone Android e no layout real autenticado do HTB | No Firefox Android, instalar temporariamente via USB ou usar XPI assinado. Conferir uma seção curta e outra com listas, tabelas e código na conta do usuário, navegando avançar/voltar. Se o layout revelar uma falha que o cenário sintético não cobre, adicionar uma fixture mínima sem conteúdo privado aos testes existentes e corrigir o seletor ou a transição responsável. | Toda seção nova é detectada, o original continua acessível e respostas atrasadas não modificam outra lição. O Google Tradutor não se sobrepõe. |

As duas etapas podem ser feitas sem novas telas, serviços ou dependências. O glossário existente atende preferências individuais de termos; as regras gerais continuam no único prompt do background.
