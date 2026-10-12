# PRD Backend — controlenotasconcreto

Desenho aprovado e implementação em aceite. Data: 11/10/2026. Progresso em docs/superpowers/plans/login-banco-progresso.md.

## Objetivo e decisões confirmadas

Adicionar login real e persistência compartilhada ao app React existente, mantendo somente controlenotasconcreto. Supabase Auth identifica as pessoas; Postgres guarda os dados e aplica permissões.

- Acesso por convite autorizado por Christopher, sem cadastro público.
- Christopher e Analista consultam e escrevem; Cliente consulta todas as obras.
- Prazos dos ensaios contam da aplicação, em dias corridos, aos 7, 28 e 63 dias.
- Banco começa vazio. Dados fictícios existem somente nos testes, sem importar localStorage.
- Sem histórico completo, notificações externas, push ao GitHub ou publicação nesta etapa. Exclusão foi autorizada posteriormente para Christopher e Analista, com confirmação e remoção atômica de nota/ensaios.

## Login e liberação

Login por e-mail e senha, restauração de sessão e saída. A tela não permite escolher perfil. Conta sem perfil ativo não acessa os dados.

Cadastro público deve estar desligado no Supabase, inclusive pela API. O perfil nasce sem privilégios de escrita e inativo; ativação e papel são definidos por operação administrativa confiável. Nome, papel e situação enviados pelo navegador ou nos metadados de cadastro nunca concedem poder.

A primeira conta Christopher será provisionada administrativamente. Convites posteriores dependem de autorização de Christopher e são executados por operação administrativa; não haverá tela de gestão de usuários nesta entrega. Senhas e chaves administrativas não entram no frontend. Envios de convites e recuperação são transacionais de autenticação, distintos dos avisos internos de ensaios; destinatários serão definidos antes de qualquer envio.

## Modelo de dados proposto

Identificadores UUID; datas de aplicação como date; registros de criação e atualização como timestamptz. Volumes e resistências usam numeric exato, com valores finitos, menores que 1 bilhão e até seis casas decimais. O banco recusa precisão excedente em vez de arredondar silenciosamente; a interface explica a restrição em erros de validação.

| Tabela | Conteúdo e restrições |
| --- | --- |
| profiles | id vinculado a auth.users, nome, role em Christopher/Analista/Cliente, ativo, created_at. Papel e ativação não podem ser alterados pelo usuário comum. |
| obras | id, nome obrigatório, tipo, created_at, updated_at. |
| acessos_obras | usuario_id e obra_id, únicos em conjunto. Controla quais obras uma conta ativa consulta. |
| locais | id, obra_id, nome obrigatório, teorico opcional: null ou positivo, created_at, updated_at. |
| notas | id, obra_id, local_id, numero textual obrigatório, data de aplicação, fck positivo, slump textual, volume positivo, observacoes, created_at, updated_at, versao. Número único por obra. |
| ensaios | id, obra_id, nota_id, idade em 7/28/63, esperado opcional e dois resultados opcionais, todos não negativos quando preenchidos. Único por nota e idade. |

Chaves estrangeiras compostas garantem que o local da nota e a nota do ensaio pertençam à mesma obra. Índices atendem acessos por usuário/obra, notas por obra/data e relacionamentos. Sem exclusão em cascata de dados de negócio nesta etapa.

Criar uma nota cria também suas três idades de ensaio em uma transação. Atualizar os ensaios e suas observações também é atômico. Escritas usam controle de versão da nota para recusar edição sobre dados alterados por outra pessoa, oferecendo recarregar em vez de sobrescrever silenciosamente.

Datas previstas e estados de vencimento são derivados, sem armazenar um status que envelhece. Um resultado, inclusive zero, completa a idade; segundo campo pode permanecer null. Esperado ausente não gera comparação; fck não determina o esperado. Dia atual usa America/Sao_Paulo.

## Permissões no banco

Todas as tabelas têm RLS e GRANT explícito mínimo para authenticated; anon não recebe acesso aos dados. Funções usadas nas políticas têm permissões explícitas e, quando privilegiadas, search_path fixo e validação da identidade.

Leitura depende de perfil ativo e vínculo em acessos_obras. Os três perfis ativos terão vínculos com todas as obras de negócio existentes, preservando o requisito de consulta global. Nova obra gera esses vínculos atomicamente; nova conta ativada recebe vínculos com as obras existentes. O navegador não administra os vínculos.

Christopher e Analista podem criar/editar notas, ensaios e volume teórico nas obras autorizadas, além de cadastrar/editar obras e locais. Cliente não pode escrever, mesmo usando a API diretamente. Nenhum perfil recebe DELETE direto nas tabelas. Exclusão autorizada por RPC excluir_nota confere editor ativo, vínculo e versão, bloqueia a nota durante a operação e remove ensaios e nota na mesma transação.

Perfis comuns consultam apenas o próprio perfil e seus vínculos. Alteração de papel e ativação é restrita à operação administrativa. Contas inativas, não convidadas ou sem vínculo não veem dados de negócio. Testes terão uma conta restrita a uma obra para provar que a política respeita vínculos, sem mudar a regra dos perfis reais de consulta às obras.

## Integração e estados da interface

src/lib/dados.js permanece a única porta de dados e autenticação das telas; src/lib/supabase.js instancia o cliente. regras.js mantém os cálculos. Não haverá chamadas Supabase espalhadas pelas telas.

Operações passam a ser assíncronas. Telas mostram carregamento, erro e estado vazio; confirmam sucesso somente após resposta do banco. Sem retorno automático ao mock quando uma consulta falhar. Formulário mantém o rascunho em caso de erro. Logout limpa dados da sessão e respostas atrasadas não podem preencher a sessão seguinte.

No primeiro acesso vazio, Christopher/Analista cadastram uma obra e um local antes da nota. Cliente vê orientação de que ainda não existem obras. O seletor não usa id fixo nem assume dez obras cadastradas. Totais diários continuam abrangendo todos os locais da obra; subtotal segue os filtros.

URL e chave publicável ficam em .env.local ignorado pelo Git, com .env.example sem valores reais. Nenhuma chave service_role no navegador. A demonstração local existente não será copiada ao banco.

## Entrega e verificação

SQL mantido em supabase/migrations e aplicado de forma rastreável. Testes com dados fictícios em ambiente isolado ou transações revertidas, sem deixar exemplos no banco de negócio. Acrescentar verificações de schema e GRANT ao npm run check.

Aceite: login/saída e restauração de sessão; conta inativa bloqueada; Cliente não escreve via API; usuário comum não muda papel; conta restrita não lê outra obra sem filtro; relações entre obras inválidas e números duplicados recusados; zero e null preservados; salvamento atômico e conflito de edição verificados; cadastro inicial funciona em banco vazio; dados reaparecem ao recarregar e em outra sessão autorizada. npm run check fecha em zero. Revisão de código antes de eventual push solicitado.

## Recursos externos e próxima etapa

### Gestão de usuários aprovada posteriormente

profiles possui gestor_usuarios, falso por padrão, com índice que permite uma única conta gestora e CHECK que exige gestor ativo com categoria interna Christopher. Somente a conta proprietária confirmada recebeu o indicador por provisionamento separado. Usuários comuns não atualizam profiles; atribuir Engenheiro não altera esse indicador.

Edge Function usuarios usa JWT validado, consulta perfil ativo/gestor no banco e executa listagem, convite por generateLink e alteração de perfil. verify_jwt=true. Chave service_role existe apenas no ambiente do servidor. RPC administrar_perfil só executável por service_role, revalida a identidade gestora, bloqueia alteração da própria conta e não permite mudar gestor_usuarios. Convites só divulgam link depois de liberar o perfil; falha parcial exige conferir a lista. Não há exclusão definitiva de contas nem envio de e-mails nesta aba.

Função implantada no Supabase como parte do backend autorizado, sem publicar o site. APP_URL inicialmente http://127.0.0.1:5175/ e origem de navegador restrita ao mesmo endereço. Antes da publicação, configurar APP_URL para o domínio público e ajustar URLs do Auth. Servidor padrão de e-mail tem restrição a membros da organização; usuário escolheu compartilhar links manualmente.

MCP list_projects respondeu sem projetos. list_organizations encontrou christopher.nyl.borges.santos@gmail.com's Org (uqgrsawnhkkvmbzbjmgi). Isso confirma acesso à organização, não a existência de um banco.

Antes de criar projeto, confirmar organização escolhida e consultar/apresentar custo pelo MCP. Proposta de nome: controlenotasconcreto; região sa-east-1. Nenhum projeto, conta, convite ou credencial foi criado neste diagnóstico.

Revisar este desenho, especialmente cadastro de obras/locais e provisionamento administrativo dos convites, antes de preparar a execução.

- 12/10/2026: Ensaios com botão Peça não estrutural (aria-pressed), confirmado pelo botão Salvar ensaio. Flag notas.nao_estrutural defaultfalse, persistida na RPC salvar_ensaios junto à versão/observações/resultados, enviada como chave nao_estrutural no JSON p_ensaios; omissão por versão antiga preserva valor. Desabilita esperado/resultados7/28/63; dispensa vencidos, pendências, preenchidos e abaixo do esperado. Volumes mantidos. Relatórios identificam peça dispensada sem tabela pendente; dados históricos não são apagados. Desmarcar reativa regras e resultados. Migration20261012_nao_estrutural.sql; testes Node/renderização e SQLrollback testes/nao-estrutural.sql passaram, revisão Standards/Spec sem bloqueios.

- 12/10/2026, orientação posterior: um resultado informado é suficiente aos7/28/63dias, em qualquer posição e inclusivezero; segundo ausente não é pendência. Abaixo do esperado continua destacado. Resultado63é opcional quando houver pelo menosumresultado28 e todos os resultados28informados≥Esperado28; semesperado/semresultado não dispensa, semmédiaouFCK. Corrigir28reativa obrigação63 se nãoatingir esperado. Dashboard poridade mostraobrigatórios/preenchidos/vencidos e opcionais/dispensados separados; preenchimento usa apenas obrigatórios. Optionalpreenchido preservaresultado ealertas. Atualização derivada, sem migration. As menções antigas a dois resultados obrigatórios ficam substituídas por esta regra.
