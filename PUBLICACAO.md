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
