# Dois modelos de importação

Regra confirmada: Modelo 1 preserva a importação da base; Modelo 2 localiza NF exata na obra selecionada e substitui apenas resultados preenchidos, inclusive zero. Vazios preservam resultados atuais. Data/FCK/slump são referência e não são alterados. Cada opção baixa seu XLSX modelo vazio.

- [x] Testes de prévia, modelos reabertos, dados e compatibilidade do XLSX com namespaces prefixados.
- [x] Reutilizar leitura/mapeamento Excel; criar prévia de resultados com antes/depois, erros por NF e bloqueio de duplicadas/não estruturais.
- [x] RPC atômica com controle de versão, autorização por obra e validação; atualizar somente resultados e versão da nota. Sem alteração de lançamentos reais nos testes.
- [x] Interface com seleção de modelo, download, prévia e confirmação.
- [x] npm run check, SQL em rollback, revisão e documentação. Não publicar automaticamente esta nova alteração.

Validação final: npm run check, SQL em rollback, UI DEMO e revisão independente passaram. Snapshot remoto conferido: sem mudanças nas colunas. Auditoria de dependências: 14 avisos moderados nas cadeias existentes de ESLint/ExcelJS; nenhuma troca transitiva no lockfile, JSZip mantido em 3.10.2. Sem publicação desta alteração.
