# Dashboard: Visão geral

Em Dashboards, escolha **Aplicado vs teórico** para o comparativo existente ou **Visão geral** para o painel de acompanhamento.

## Filtros cruzados

Selecione a obra no topo do sistema. No painel, use aplicação Desde/Até, local e peça. Clique em barras, pontos ou legendas para selecionar FCKs, meses, idades e faixas de resistência. As seleções da mesma dimensão são somadas (FCK 30 **ou** FCK 40); dimensões diferentes são combinadas (FCK 30 **e** mês selecionado). As opções permanecem disponíveis mesmo que estejam sem dados na seleção.

Clique novamente para desfazer ou remova a etiqueta do filtro ativo. **Limpar filtros** retorna aos dados da obra. Trocar de obra reinicia os filtros. Um período invertido exibe aviso e bloqueia impressão. Os controles dos gráficos também funcionam com teclado.

Filtros de idade/situação também restringem as séries que alimentam indicadores e gráficos. Selecionar apenas 7 dias deixa os gráficos exclusivos 28 dias sem resultados; o painel mostra esse motivo. Tabelas continuam identificando a situação de 28 dias das notas selecionadas. Não existem links decorativos para operações inexistentes.

## Leitura dos indicadores

- Notas: quantidade das notas selecionadas. Séries informadas: uma por nota/idade com ao menos um resultado, não uma por amostra. Zero é resultado válido.
- Cobertura: ensaios obrigatórios preenchidos divididos pelos obrigatórios cujo prazo já chegou, incluindo o dia atual. Não estruturais, opcionais de 63 dias e prazos futuros ficam fora. Sem denominador, exibe —.
- FCK atingido aos 28 dias e faixas resistência/FCK: usam a **melhor amostra** de cada nota com resultado de 28 dias informado. Uma amostra igual/superior ao FCK atende e dispensa os 63 dias. Faixas: ≥105%, ≥100% e <105%, <100%. Notas sem resultado não entram no percentual.
- Médias de resistência: média descritiva por nota/idade das amostras informadas; depois média dessas notas no grupo. Não usa médias para decidir atendimento/dispensa.
- Pendências: ensaios obrigatórios sem resultado, com situação por prazo. Inclui No prazo, Vence hoje e Vencido, conforme os filtros.
- Slump médio: apenas valores numéricos simples; textos como12 ± 2 cm ficam fora e não viram zero. A unidade deve ser consistente no cadastro.
- Concretagens mensais: barras para quantidade de notas e linha para volume aplicado, cada eixo identificado. O período é de aplicação, não data de importação.

Médias e faixas não representam aceitação estrutural. Datas atuais usam America/Sao_Paulo. Notas e pendências têm todas as linhas selecionadas disponíveis em tabelas com rolagem; impressão remove o limite visual e inclui critérios atuais.

## Verificação

Testes de cálculo cobrem filtros combinados/múltiplos, isolamento de obra, opcionais de 63 dias, melhor amostra aos 28 dias,7 dias a 70%, zero/null, ausência de denominador, médias, slump textual e precisão decimal em 105%. UI DEMO em memória verificou dois painéis, barras/rosca por teclado, combinação mês/FCK, remoção, local/peça, idade, período inválido, troca de obra, vazio, impressão via CSS e tela móvel. Nenhum dado DEMO foi salvo no banco. Impressão física não executada.
