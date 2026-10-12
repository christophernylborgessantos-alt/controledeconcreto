# Publicação — Controle de notas de concreto

Data: 12/10/2026 (America/Sao_Paulo).
Site: https://controledenotasconcreto.vercel.app/
Código: f5bb163394873e00db5d295ee93c0abedba3ba6f, branch main.
Deployment: dpl_DKBWEHiEASx3Nc3rNwpvogZwfvaC.
Estado: READY confirmado pela Vercel; domínio público vinculado e HTTP 200 verificado.
Confirmação: 12/10/2026, aproximadamente 13:18 (America/Sao_Paulo).

## Alterações desta versão
- Mapeamento: vários mapas por obra/local/período, imagem privada até 2 MB, notas/volumes automáticos, betoneira e horários, duração automática, impressão e exclusão confirmada.
- Relatórios: notas e ensaios numa tabela única.
- Ensaios: esperado de 70% do FCK aos 7 dias; 100% aos 28/63, idades reunidas por nota.
- Dashboard: quatro indicadores, comparação compacta e resumo por idade, com impressão/PDF e filtros.
- Leitura concorrente de mapas protegida: versão conferida antes/depois dos itens, evitando sobrescrever horários de outro usuário.

## Validação
- npm run check passou: build, lint e testes, incluindo regressão da leitura concorrente.
- SQL em rollback confirmou permissões, conflitos, atomicidade, isolamento por obra/local/período e cascatas de exclusão. Nenhum registro real foi excluído.
- Teste sem login: 24 tentativas nas oito tabelas bloqueadas e cadastro público bloqueado.
- UI DEMO: imagens, acumulados, horários/duração, dois mapas, reabertura e Cliente somente consulta conferidos; impressão física não executada.
- Revisões Standards/segurança e Spec sem bloqueios após corrigir concorrência.
- Advisors: funções protegidas SECURITY DEFINER intencionalmente acessíveis a autenticados; aviso anterior de proteção contra senhas vazadas desativada permanece. Detalhes em seguranca-relatorio.md.

## Banco
Migrations versionadas e já aplicadas: 20261012_esperado_7_dias.sql, 20261012_esperado_7_dias_precisao.sql e 20261012_mapeamento.sql. Mapas/imagens e itens têm RLS; escrita/exclusão via RPC exige editor ativo e vínculo à obra. Excluir mapa preserva notas; excluir obra remove seus mapas.

Credenciais, arquivos gerados e capturas locais com a imagem ilustrativa ficaram fora do commit. Tabela nova no futuro exige repetir a auditoria.

## Atualização — volume teórico editável, 12/10/2026

Código publicado: 5cfaeea3379bd3618589dd471b638b194e71c7c8 (main).
Deployment: dpl_6ktAZzzWPWhAHGi6LdQwEDJUniWZ, READY, domínio público vinculado sem erro. HTTP 200 e texto do ajuste conferidos no código servido.

O formulário de qualquer nota permite alterar o teórico compartilhado do local; Salvar volume teórico do local atualiza todas as notas e comparativos. Vazio remove o teórico, zero/negativos rejeitados. Trocar nota/local reinicia o rascunho, e salvar a nota com alteração de teórico pendente pede salvar o teórico primeiro.

npm run check passou. UI DEMO: duas notas compartilharam alteração20→30m³; aplicado13m³/desvio-17m³; troca de local, vazio, zero e proteção de rascunho conferidos. Captura: docs/verificacao/teorico-editavel.jpg. Sem alterações de schema/RLS/migrations nem dados reais de teste.

## Atualização — peças, importação e mapas em branco, 12/10/2026

Publicação solicitada expressamente pelo usuário. Inclui cadastro de peça estrutural por obra, importação XLSX de notas e ensaios com prévia e confirmação (NFs existentes preservadas), filtros de peça em Notas/Relatórios/Dashboard, desvio do Dashboard como teórico menos aplicado e formulário de mapa em branco com desenho e dez linhas para preenchimento à mão. Impressão/PDF e Excel acompanham os filtros correspondentes.

Migrations 20261012_peca_estrutural.sql e 20261012_importacao.sql versionadas e já aplicadas via MCP. Importação exige editor ativo vinculado à obra; lote atômico, sem privilégios anônimos novos. Não foram gravados exemplos no banco real. Advisors e limites registrados em seguranca-relatorio.md e docs/importacao-dados.md.

npm run check passou no estado final: build, lint e testes. SQL em rollback validou peça/importação, isolamento, permissões e reversão. UI DEMO conferiu cadastros, prévia/importação, erros, cancelamento, modelo em branco e retorno. Renderização conferiu o desvio para aplicado abaixo/acima/igual ao teórico e seletor de peças. Impressão física não executada.

### Publicação confirmada — 12/10/2026

Código 958ebbe9e8e6744ccfd9b466753cc8a8cc9616af enviado à main. Deployment dpl_DiQZudbiPiEuHvkcGqMtiZn1naNP READY, alias https://controledenotasconcreto.vercel.app/ vinculado sem erro. HTTP200 e marcadores públicos de importação, mapa em branco, filtros de peça e desvio invertido conferidos. Revisão de código contra4019ed9 sem bloqueios. Esta confirmação supera as anotações anteriores de interface local/sem publicação para cadastro de peça, importação, filtros e mapa em branco.
