# PRD Frontend — controlenotasconcreto
Escopo desta etapa: demonstração local React + Vite, dados fictícios persistidos no navegador. Referência: preview.html, opção Painel, paleta #0E7C86 #06282A #EEF3F4 #1EE6F0 #E8845B. Menu lateral em tela larga, barra inferior no celular, botões de pelo menos 44px.
## Notas
Tela inicial com obra, datas inicial/final e local como filtros. Lista: data, número fiscal, fck em MPa, slump, local, volume m³, acumulado diário da obra. Total diário não muda com filtro de local; subtotal acompanha todos os filtros. Christopher e analista criam/editam; cliente só consulta. Nota duplicada na mesma obra é rejeitada. Volume e fck positivos. Estado vazio com ação de criar para perfis autorizados.
## Obras e locais
10 obras com notas e locais separados. Volume teórico opcional por local, editável por Christopher e analista. Cliente consulta tudo. Valor teórico preenchido é positivo.
## Dashboards
Volumes por dia e comparação aplicada x teórica por local da obra selecionada. Diferença em m³ e percentual somente quando teórico informado. Filtros de obra comuns às telas.
## Ensaios e prazos
Cada nota possui dois resultados em MPa aos 7, 28 e 63 dias, esperado opcional por idade e observações. Resultado abaixo do esperado é destacado individualmente. Sem esperado não há conclusão. Datas previstas calculadas provisoriamente a partir da aplicação. Vencido: prazo anterior ao dia atual e algum dos dois resultados ausente. Vence hoje: prazo hoje e incompleto. Ambos preenchidos: Preenchido. Zero é valor, não ausência. Avisos internos por nota e idade. Filtros de obra, idade, situação e abaixo do esperado; cartões com contagem de vencidos, baixos e preenchidos. Cliente consulta; outros dois perfis lançam.
## Limites
Login e permissões reais, banco, notificações externas, exclusão e histórico ficam para etapas futuras. Confirmar aplicação versus moldagem antes de uso real. Dados não se sincronizam entre dispositivos.
## Aceite
Trocar obra troca listas e totais. Alterações reaparecem ao recarregar neste navegador. Cliente não dispõe de controles de escrita. Ausência de teórico e ensaios não bloqueia nota. npm run check fecha em zero.
