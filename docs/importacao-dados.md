# Importar notas e ensaios do Excel

Na aba **Importar dados**, abaixo de Mapeamento, selecione a obra e um arquivo `.xlsx`. Escolha a aba da planilha, confira a linha do cabeçalho e ajuste as colunas quando necessário. Revise a prévia e confirme a importação. Engenheiro e Analista com acesso à obra podem importar; Cliente consulta.

Uma linha corresponde a uma NF. Campos obrigatórios: **Data de aplicação, NF, Local, FCK e Volume**. Opcionais: Slump, Peça estrutural, Observações, Peça não estrutural e R1/R2 de 7, 28 e 63 dias. Colunas sem associação são indicadas para conferência. Todas as linhas da aba escolhida são consideradas, inclusive linhas ocultas.

- NFs existentes na obra são ignoradas, preservando notas e ensaios já salvos. NFs repetidas entre as novas linhas da própria planilha precisam ser corrigidas.
- Locais novos são cadastrados sem volume teórico. Locais existentes mantêm seu teórico; colunas de teórico do Excel não são importadas.
- Datas podem ser datas do Excel, `DD/MM/AAAA` ou `AAAA-MM-DD`. Números aceitam vírgula decimal e até seis casas. Use NF como texto para preservar zeros à esquerda.
- Resultados em branco permanecem ausentes; zero é um resultado preenchido. O esperado vem do FCK, com 70% aos 7 dias. A regra vigente de 63 dias opcional permanece aplicada.
- Fórmulas usam apenas o resultado salvo no arquivo: abra e salve no Excel antes de importar. Fórmulas e links não são executados.
- Limites: arquivo de 10 MB, 200 colunas, 5.000 linhas não vazias e 500 notas novas por lote. Para `.xls`, salve uma cópia como `.xlsx`.

Linhas inválidas bloqueiam a confirmação. A gravação no servidor é atômica: uma falha desfaz o lote inteiro. Se a conexão cair e o resultado não puder ser confirmado, recarregue os dados antes de tentar novamente; NFs já gravadas serão ignoradas. O arquivo é lido no navegador; apenas os dados confirmados das notas são enviados ao banco.

## Verificação — 12/10/2026

`npm run check` passou (build, lint e testes). Testes SQL com rollback verificaram duplicidade, preservação dos registros existentes, ensaios, precisão do esperado, isolamento entre obras, permissões e reversão integral. A interface foi exercitada com dados DEMO em memória, sem gravar notas fictícias no banco: prévia, erros, duplicidade, cancelamento e confirmação. Revisão de código concluída sem bloqueios. Migration `20261012_importacao.sql` aplicada via MCP; interface ainda sem publicação.
