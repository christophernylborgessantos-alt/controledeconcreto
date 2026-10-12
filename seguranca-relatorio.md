# Auditoria de segurança — teste do estranho

Data: 11/10/2026, America/Sao_Paulo. Projeto: controledenotasconcreto (sxdqlzkytwvpaytrbovc).

## Resultado comprovado

As 18 tentativas anônimas pela API (LER, INSERIR, APAGAR em seis tabelas) retornaram bloqueio de permissão, código 42501. O script teste-do-estranho.mjs usa apenas URL e chave pública de .env.local e não faz login. Cadastro público desligado e conferido em /auth/v1/settings.

Testes autenticados no Postgres simularam as identidades JWT e o papel authenticated dentro de transação revertida. Cliente não exclui, não cria obra, não escreve ensaios nem altera perfil; conta pendente não lê dados nem se aprova; usuário vinculado à obra A não lê B. Esses testes comprovam permissões de banco, não substituem o teste de login real no navegador.

Não existem contratos, medições, user_profiles ou papel usuario neste módulo: o equivalente de consulta é Cliente e a tabela de identidade é profiles.

## Raio-X das tabelas

| Tabela | RLS | Policies |
| --- | --- | --- |
| profiles | Ligada | perfil_proprio: SELECT somente próprio perfil |
| acessos_obras | Ligada | vinculos_proprios: SELECT somente próprios vínculos |
| obras | Ligada | obras_leitura: obra autorizada; obras_criacao: editor ativo; obras_edicao: editor ativo e obra autorizada |
| locais | Ligada | locais_leitura: obra autorizada; locais_criacao e locais_edicao: editor ativo e obra autorizada |
| notas | Ligada | notas_leitura: obra autorizada |
| ensaios | Ligada | ensaios_leitura: obra autorizada |

Nenhuma policy provisória using(true) ou with check(true) encontrada. anon não tem privilégios nas tabelas. authenticated não tem DELETE em nenhuma delas, nem escrita direta em profiles/acessos/notas/ensaios. Notas e ensaios são gravados por funções transacionais com verificação de identidade, perfil ativo, vínculo e versão.

## Validações e correções

- Durante o aceite, corrigido cadastro de obra: retirar RETURNING da criação evita leitura antes do vínculo ser criado. Testes SQL e da camada reproduziram o erro e passaram após ajuste. Nenhuma policy ou privilégio foi ampliado.

- Banco criado fechado via migration local supabase/migrations/20261011_base.sql.
- FKs compostas impedem local ou ensaio pertencer a obra diferente da nota.
- Nota duplicada por obra, resistência negativa e edição com versão antiga foram recusadas.
- Dois resultados zero, esperado null e rollback de atualização inválida foram verificados.
- Revisão de código identificou leitura separada da versão/ensaios; corrigida para leitura conjunta. Teste de regressão falhou antes e passou após a correção.
- Formulários bloqueiam alterações enquanto salvam, evitando perda de digitação após o envio.
- .env.local está ignorado e não é versionado.
- Contas e registros fictícios dos testes SQL foram revertidos. Banco de negócios continua vazio. A conta real Christopher foi criada por convite autorizado; ela não é conta de teste.

## Advisors de segurança

O advisor retornou cinco avisos sobre funções SECURITY DEFINER executáveis por authenticated: acessa_obra, perfil_editor, salvar_nota, salvar_ensaios e excluir_nota. Esse uso é intencional: as duas primeiras avaliam apenas a identidade atual; as operações de gravação/exclusão conferem acesso e executam mudanças atômicas. Todas fixam search_path e tiveram execução pública/anônima revogada. Os testes cobrem conta comum, inativa e vínculo restrito.

Esses avisos não foram ocultados nem apresentados como zero alertas. Referência: [aviso de funções privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Pendências de aceite

Gestão de usuários adicionada: flag exclusiva de gestor, protegida no banco; classificar alguém como Engenheiro não concede gestão. RPC administrativa somente para service_role e função de servidor com JWT validado, getUser e perfil ativo/gestor. Testes SQL em rollback e testes API cobrem sucesso/bloqueio, auto-desativação, categoria inválida, identidade não aceita do body e falha parcial sem link. HTTP anônimo real retornou 401. Proprietário confirmou listagem autenticada na aba. Nenhum convite real para terceiro foi gerado durante os testes. Advisors permanecem com os cinco avisos de funções autenticadas privilegiadas e aviso de proteção contra senhas vazadas.

Após autorização posterior do usuário, Christopher e Analista podem excluir pela RPC excluir_nota; DELETE direto permanece bloqueado. Testes de exclusão verificaram anon/Cliente/pendente/editor sem vínculo bloqueados, conflito de versão e remoção atômica. Registros de testes revertidos; nenhum registro do usuário foi removido.

O advisor também indicou proteção contra senhas vazadas desativada. Isso significa que o Auth não está verificando senhas contra listas de vazamentos; não significa que uma senha desta conta foi vazada. Configuração não alterada nesta entrega. [Referência oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Convite real enviado para o endereço aprovado. Erro inicial de conexão ao servidor local resolvido após reinício; HTTP 200 confirmado. Novo link de recuperação enviado ao mesmo endereço para concluir a senha após o convite consumido. Usuário confirmou que definiu a senha e entrou, vendo o banco vazio. Restauração de sessão, saída e cadastro pela interface ainda precisam de verificação final. Sem publicação ou envio ao GitHub nesta etapa.

Tabela nova no futuro = rodar esta auditoria novamente. Snapshot e verificações estáticas de migrations não substituem testes reais de RLS/GRANT e devem ser atualizados após qualquer migration.

## Verificação após classificação não estrutural — 12/10/2026

Nova coluna em notas, sem privilégios de UPDATE direto. RPC exige escritor ativo, acesso à obra e versão atual. SQL em rollback confirmou gravação/reversão, preservação de resultados, conflito, cliente bloqueado e compatibilidade com omissão do campo. Teste anônimo fechou18operações e cadastro público. Advisors mantêm os mesmos5avisos de funções SECURITY DEFINER intencionais/autorizadas e proteção de senhas vazadas desativada; nenhum alerta novo nesta alteração.

## Exclusão de obra — 12/10/2026

RPCExcluirObra autenticada e limitada a escritor ativo vinculado à obra. Exclusão integral/atômica somente dessaobra; semGRANTDELETEdireto. TesteSQLrollback confirma Cliente/Pendente/anônimo/semvínculo bloqueados e nome desatualizado recusado; falhainduzida preserva todos osdados. Testeanônimo:18operações continuamfechadas e cadastrópúblicodesligado. Advisors agora apontam6RPCsSECURITYDEFINER intencionais (novaexcluir_obra), todascomchecagens, e oavisopréexistente sobreproteçãodesenhasvazadasdesativada.

## Auditoria adicional — Mapeamento, 12/10/2026

- Tabelas novas: mapas e mapa_itens; RLS ativa, SELECT apenas authenticated com vínculo ativo à obra, escrita/exclusão apenas pelas RPCs que exigem editor ativo e versão.
- Teste do estranho repetido: 24 tentativas nas oito tabelas, todas PORTA FECHADA. Cadastro público bloqueado.
- Testes SQL em rollback: Cliente lê e não salva/exclui; pendente não lê/exclui; local de outra obra, período inválido, SVG, notas fora do período e versão antiga bloqueados; falhas atômicas; excluir mapa preserva notas; excluir obra remove mapas/itens, preservando outra obra. Não foram criadas contas permanentes de teste.
- Advisors: oito funções SECURITY DEFINER intencionalmente acessíveis aos autenticados, com verificações internas (incluindo salvar_mapa/excluir_mapa). Aviso não indica policy liberada; nenhum RLS ausente. [Detalhes do aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Permanece o aviso anterior de proteção contra senhas vazadas desativada no Auth. [Configuração](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Imagens limitadas a 2 MB, carregadas só ao abrir o mapa e removidas junto ao registro; sem links públicos.
- Tabela nova no futuro: repetir a auditoria.

## Importação Excel — 12/10/2026

Migration versionada 20261012_importacao.sql aplicada via MCP. Sem novas tabelas nem alteração de RLS. RPC importar_notas revoga PUBLIC/anon e concede execução a authenticated, exigindo editor ativo e acesso à obra. SQL em rollback confirmou bloqueio de Cliente, Pendente, anônimo e usuário sem vínculo, preservação de NFs existentes, isolamento e rollback do lote inválido. Nenhuma conta ou nota de teste permanente criada.

Advisors: nove funções SECURITY DEFINER intencionalmente disponíveis a authenticated, com verificações internas; nenhum alerta de RLS ausente. Continua o aviso anterior de proteção contra senhas vazadas desativada. Referências e explicação constam na auditoria de Mapeamento acima. A revisão desta alteração não substitui uma nova auditoria completa de todas as tabelas.
