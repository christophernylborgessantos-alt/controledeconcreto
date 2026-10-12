# Execução de 2026-10-11-login-banco.md

- Projeto criado: sxdqlzkytwvpaytrbovc, região sa-east-1, custo informado US$ 0/mês.
- Banco público vazio e advisors sem alertas antes da criação de tabelas.
- Baseline npm run check passou antes das mudanças.
- Branch local codex/login-banco criada; main preservada. Sandbox exigiu escalada para a branch, autorizada.
- Implementação na pasta atual para manter o servidor e os documentos de planejamento juntos, sem nova worktree.
- E-mail da primeira conta confirmado: christopher.nyl.borges.santos@gmail.com. Convite ainda não enviado.
- MCP disponível não oferece configuração do Auth nem administração de usuários. Investigar painel antes de provisionamento.

## Trabalho executado

- Banco criado via migration versionada, seis tabelas com RLS e GRANT explícito. Teste de ausência de RLS falhou antes da migration; tests/schema.sql passou após a aplicação.
- tests/seguranca.sql executado e revertido: anon sem acesso, Cliente sem exclusão/escrita/promoção, pendente sem dados/autoaprovação e vínculo A sem B. Verificados duplicidade, FK entre obras, zero/null, atomicidade e versão.
- Camada assíncrona e autenticação implementadas em dados.js/supabase.js. Testes falharam antes e passaram após implementação, incluindo erros e conflito.
- Telas adaptadas; Obras permite início vazio. Login verificado visualmente e HTTP 200 confirmado.
- Revisão independente encontrou leitura da versão e ensaios em chamadas separadas e edição permitida durante salvamento. Ambos corrigidos. Regressão de leitura conjunta RED/GREEN e revisão das correções concluídos.
- Tipo de convite capturado antes de o cliente limpar o hash; regressão RED/GREEN. Recuperação de senha implementada e testada.
- Configuração do Auth pelo painel, pois MCP não expõe ferramenta: cadastro público e login anônimo desligados. Site URL local http://127.0.0.1:5175.
- Convite enviado com aprovação explícita e perfil Christopher ativado. Conta real mantida; nenhuma conta de teste persistida.
- Erro de conexão local relatado; servidor reiniciado com acesso de rede autorizado. Usuário confirmou tela de login. Convite consumido; enviado novo link de recuperação ao mesmo endereço, aguardando definição de senha e aceite.
- npm run check passou com build, lint, regras, dados, schema e GRANT. git diff --check passou. .env.local ignorado, não versionado.
- Script anônimo pela API: 18 operações fechadas e cadastro público fechado. Saída salva em docs/verificacao/teste-anonimo.txt.
- Advisors: quatro avisos intencionais sobre SECURITY DEFINER autenticadas, documentados no relatório; não alegar zero avisos.

## Pendências para conclusão

- Relatórios implementados e testados: filtro inclusivo de obra/período, somas decimais, zero/null e todas as idades; prévia visual com exemplos e filtro de data conferidos. CSS A4 preparado; botão acionou impressão nativa, mas a paginação física/PDF exige conferir no navegador do usuário. Nenhum envio à impressora efetuado.
- Corrigida truncagem de carga em 1000 linhas: leitura paginada 500 por lote, regressão de 1001 notas RED/GREEN. Ensaios continuam embutidos na leitura da nota para preservar versão consistente.
- Exclusão solicitada e aprovada para Christopher/Analista. Migration local aplicada, RPC com acesso/lock/versão e transação. Tests/excluir-nota.sql RED (função ausente), GREEN (Analista autorizado; Cliente, pendente, anon e editor sem vínculo bloqueados; versão inválida recusada; nota/ensaios removidos juntos), tudo em rollback.
- Teste UI isolado: cancelar não exclui, Cliente sem botão e confirmação remove nota e zera totais. Fixtures temporárias removidas.
- Revisão independente de relatórios/paginação/exclusão sem falhas bloqueantes; layout dos filtros corrigido com seletor mais específico. Snapshot conferido no banco após migration: tabelas/colunas inalteradas.

- Pedido adicional aprovado: lista de locais com cadastro na própria nota. Implementado em Notas; commit devolve o resultado para selecionar o ID cadastrado. Verificação em cenário isolado no navegador: antes, Nova nota bloqueada sem locais; depois, cadastro e seleção automática com rascunho preservado. Falha simulada também mantém nome e nota. Cenário temporário removido; nenhum dado gravado no banco por esse teste.

- Cadastro de obra bloqueado no aceite: INSERT RETURNING era avaliado antes do gatilho AFTER INSERT criar o vínculo de leitura. Reproduzido no Postgres com Christopher ativo e em teste de regressão da camada. Corrigido usando INSERT sem retorno e leitura após conclusão; ambos os testes passaram, sem mudar RLS. npm run check passou. Solicitar novo teste de cadastro ao usuário.

- Usuário confirmou definição de senha e acesso com banco vazio no próprio navegador. Falta logout/restauração e teste de cadastro. Navegador operável pelo agente ainda sem sessão; solicitado login nele sem compartilhamento da senha.
- Conferir cadastro/edição inicial e persistência pela interface, com dados fictícios controlados e limpeza autorizada quando necessária.
- Atualizar relatório/aceite ao concluir. Sem push, deploy ou inclusão de dados reais.
