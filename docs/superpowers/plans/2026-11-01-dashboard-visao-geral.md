# Dashboard Visão geral

Design aprovado: duas opções em Dashboards, Aplicado vs teórico preservado e Visão geral inspirada na imagem enviada. Fundo azul escuro #0b1721, painéis #132530, contornos #29404f, texto #edf4f8, azul #36a3ff, verde #30c77c e âmbar #ffb443. Tipografia e navegação existentes. Grade compacta responsiva, sete indicadores, gráficos de linhas/barras/roscas, notas e pendências. Sem dados ilustrativos em produção.

Filtros: obra global; aplicação desde/até, local, peça, FCK, idade e situação. Cliques nos gráficos selecionam múltiplos meses/FCKs/idades/faixas de resistência e filtram todo o painel; seleções OR dentro de uma dimensão e AND entre dimensões. Filtros ativos removíveis, limpar, desfazer clique. Catálogos preservados para acrescentar/remover seleções. Troca de obra reinicia filtros. Sem liberação de escrita adicional.

Métricas: uma série por nota/idade com resultado informado, não cada amostra. Cobertura somente ensaios obrigatórios já elegíveis (prazo atingido), excluindo peças não estruturais e63 opcionais. Resultado zero conta como informado. Média descritiva usa média dos resultados informados por nota/idade; faixas e FCK atingido28 usam a melhor amostra, coerente com regra aprovada. Não inferir aceitação estrutural. Slump textual só entra na média se for número simples; ausência não é zero. Datas America/Sao_Paulo. Sem percentuais de evolução inventados, sem data de importação inexistente.

- [x] Cálculos em src/lib/visaoGeral.js e testes de regressão: filtros combinados, elegibilidade, opcionais63, amostras28 divergentes, 7dias70%, zero/null, médias, slump e isolamento.
- [x] src/screens/VisaoGeral.jsx e CSS: aparência da referência, gráficos SVG acessíveis, seleção cruzada, tabelas, estados vazios e impressão.
- [x] Dashboards.jsx com dois botões e painel existente preservado.
- [x] Verificação npm run check, UI DEMO em desktop/móvel, revisão independente e documentação. Sem push/publicação automática.

Validação: testes de cálculo, npm run check, revisão independente e UI DEMO desktop/móvel passaram. Sem dados reais modificados e sem publicação.
