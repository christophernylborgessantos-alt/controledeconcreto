# Controle de notas de concreto
Somente o módulo controlenotasconcreto. React + Vite, CSS próprio, navegação por estado. Referência visual: preview.html. Requisitos: PLANO-DO-PROJETO.md e PRD-FRONTEND.md.
Dados: src/lib/dados.js é a única porta; mockData.js gera exemplos somente para testes; regras.js concentra cálculos. Cada nota, local e ensaio possui obra_id. Perfis Christopher e Analista escrevem; Cliente consulta todas as obras autorizadas. Perfil vem do banco, sem seleção demonstrativa na interface.
Volume teórico opcional por local; ausência não é zero. Duas resistências por idade (7, 28, 63); esperado por idade, sem inferir fck. Prazos contam da aplicação, em dias corridos, confirmado pelo usuário. Dois resultados preenchem a idade, inclusive zero. Datas atuais no fuso America/Sao_Paulo.
Persistência no Supabase, projeto sxdqlzkytwvpaytrbovc. Banco de negócios começa vazio; exemplos só nos testes. Sem importar demonstração de localStorage. Login real por convite; cadastro público desligado. Perfis ativos consultam todas as obras via acessos_obras; Christopher e Analista escrevem, Cliente consulta. Papel e ativação só por operação administrativa. Não inserir dados reais durante o aceite desta fase. Avisos de ensaios são internos; convites de autenticação são enviados apenas com destinatário e envio autorizados.
Verificação obrigatória: npm run check (build, lint e testes). Bugs em src/lib exigem teste de regressão. Revisão de código antes de push se alterar src/lib/dados.js, src/lib/supabase.js, RLS, migrations ou dinheiro. Não enviar automaticamente ao GitHub nem publicar.
Nunca versionar node_modules, dist, .env.local ou outras chaves. Banco futuro só via migrations versionadas, RLS e GRANT para authenticated. Não configurar credenciais sem necessidade.

## Retomada atual — login e banco, 11/10/2026

- Branch local codex/login-banco. Projeto Supabase criado em sa-east-1, custo consultado US$ 0/mês.
- Seis tabelas com RLS e GRANT mínimo. SQL em supabase/migrations; notas/ensaios gravados por RPC atômica e controle de versão. Resultado/volume com até seis casas decimais, finitos e menores que 1 bilhão.
- Telas usam dados.js de forma assíncrona, sem fallback para mock; supabase.js instancia o cliente. Login, saída, definição de senha por convite e estados vazios implementados. Obras/locais podem ser cadastrados por escritores.
- Prazos confirmados pela aplicação. Não criar data de moldagem nesta etapa.
- Snapshot tests/_schema-snapshot.json gerado pelo banco real. Regenerar após migration; npm run check inclui schema e GRANT, mas testes SQL/HTTP de segurança são verificações separadas.
- Teste anônimo bloqueou 18 operações; cadastro público fechado. tests/seguranca.sql verifica identidades autenticadas em rollback. Relatório em seguranca-relatorio.md.
- Conta Christopher convidada e ativada com autorização. Erro inicial de conexão local: servidor reiniciado fora da restrição de rede e HTTP 200 confirmado; usuário confirmou tela de entrada. Link de recuperação enviado ao mesmo e-mail para concluir senha após convite consumido. Aguardando aceite no navegador. Não pedir senha nem link com token no chat.
- App iniciado em http://127.0.0.1:5175/. URLs do Auth apontam provisoriamente para esse endereço local. Verificar servidor/porta antes de convites futuros.
- Sem push, publicação ou migração de dados reais. Aceite completo do login e persistência pela interface ainda pendente.

### Atualizações solicitadas após o login

- Aba Usuários implementada, exclusiva da conta proprietária via profiles.gestor_usuarios (não pelo nome da categoria). Somente f91895ef-2aca-4a45-bbed-e44d5cd87cb1 recebeu gestão. Não delegar ao classificar outro Engenheiro; própria conta não pode ser alterada pela tela/rotina administrativa.
- Gestão usa Edge Function usuarios, verify_jwt=true, valida getUser e perfil ativo/gestor no servidor. Chave service_role somente no ambiente da função. RPC administrar_perfil só para service_role. Fonte e migrations locais em supabase/. Dados das telas passam por dados.js.
- Convites por link para compartilhar, escolha do usuário: sem SMTP/e-mail automático. Não registrar links/tokens em logs, capturas reais, documentos ou localStorage. Testes de interface usam somente links fictícios. APP_URL da função está local (http://127.0.0.1:5175/); ajustar para endereço público, CORS e URLs do Auth na etapa de publicação.
- Classificação e ativação/desativação de terceiros exigem confirmação. Desativação preserva contas/registros, bloqueia futuras consultas/escritas via RLS. Testes SQL em rollback e API com cliente controlado; endpoint anônimo retorna 401. Confirmar listagem com sessão real do proprietário no navegador próprio.
- Proprietário confirmou a listagem real na aba Usuários; função implantada aceita sua sessão e retorna a própria conta. Nenhum convite real de terceiro gerado pelo agente. Guia em docs/GUIA-USUARIOS.md.

- Denominações exibidas dos acessos: Engenheiro, Analista e Cliente. Engenheiro corresponde ao identificador interno Christopher, preservado no banco e nas regras de autorização. Não confundir o nome pessoal Christopher Nyl com a denominação do perfil.

- Usuário confirmou definição de senha e acesso no navegador próprio; prefere conduzir o teste real nele.
- Local pode ser cadastrado na própria nota e selecionado automaticamente, preservando rascunho. Cadastro pela tela Obras também disponível.
- Aba Relatórios: obra e período de aplicação, notas/volumes/totais e ensaios 7/28/63, esperado opcional, resultados, situação e observações. Imprimir/salvar PDF usa janela do navegador e CSS A4. Confirmar a impressão final no navegador do usuário.
- Christopher e Analista podem excluir nota e ensaios definitivamente após confirmação, conforme autorização posterior do usuário. Cliente não exclui. RPC excluir_nota confere perfil ativo, vínculo da obra e versão; não há GRANT DELETE direto para authenticated. Migration 20261011_excluir_nota.sql; tests/excluir-nota.sql verifica permissões e atomicidade em rollback.
- carregar pagina consultas em lotes de 500 para não truncar notas no limite padrão da API. Teste cobre 1001 notas; nota/versão/ensaios continuam lidos juntos.
- Advisors atualizados: cinco avisos intencionais de funções privilegiadas autenticadas e proteção contra senhas vazadas desativada. Relatório documenta os avisos.

## Registro anterior — Fundação, 11/10/2026

O registro abaixo documenta a etapa anterior; o estado atual é o resumo acima.

### Pronto nesta conversa
- Fundação React + Vite na raiz desta pasta, somente para controlenotasconcreto. Telas em src/screens/: Notas, Obras, Dashboards e Ensaios. Menu lateral e barra inferior responsivos, seguindo cores, tipografia e cartões do preview.html.
- Dados fictícios de 10 obras, com notas em duas delas. Cadastro e edição de notas, filtros por obra/data/local, totais diários por obra e subtotal filtrado. Locais com volume teórico opcional e dashboard aplicado versus previsto.
- Dois resultados por nota aos 7, 28 e 63 dias, esperado opcional por idade, observações, destaque dos resultados baixos, datas previstas e avisos internos para ensaios incompletos vencidos. Filtros de obra, idade, situação e resultados baixos.
- Christopher e Analista lançam; Cliente consulta todas as 10 obras. Essa seleção é demonstrativa. Persistência local no navegador, sem sincronização entre dispositivos.
- PRD-FRONTEND.md foi criado nesta etapa a partir do plano e do preview. CLAUDE.md aponta para este AGENTS.md. PLANO-DO-PROJETO.md recebeu o resumo da Fundação.
- npm run check passou (build, lint e testes). Revisão corrigiu edição oculta em tablet e precisão de somas decimais; cálculos de comparação ficaram centralizados em regras.js. Testes cobrem datas, pendências, zero como resultado, resistências, isolamento de obras, bloqueio de escrita do cliente, duplicidade e somas decimais.
- Código enviado à branch main de https://github.com/christophernylborgessantos-alt/controledeconcreto, commit 4f4d9f7, mensagem: "Constrói controle de notas de concreto com ensaios, prazos e dashboards". Autor: Christopher Nyl, christopher.nyl.borges.santos@gmail.com. Chaves e pastas geradas excluídas e verificadas antes do envio.
- App iniciado em http://127.0.0.1:5174/ e resposta HTTP 200 confirmada. A porta 5173 estava ocupada. Em nova sessão, conferir se o servidor ainda está rodando; se necessário iniciar npm run dev e usar a porta indicada. Não confundir preview.html com o app React.

### Pela metade ou ainda pendente
- Teste de uso e aprovação visual do app React pelo usuário ainda pendentes; não houve verificação visual completa do app no navegador nesta etapa. "Funcionou" veio antes da entrega final do React e não prova aceite das telas finais.
- Confirmar se os prazos dos ensaios contam da aplicação ou da moldagem dos corpos de prova. A implementação atual usa aplicação, provisoriamente. Critérios de resistência esperada por idade são informados manualmente; não inferir aceitação estrutural a partir do destaque.
- PLANO-DO-PROJETO.md continua parcialmente incompleto. PRD-BACKEND.md ainda não existe. Fluxo de cadastro/liberação, exclusão, histórico, orçamento e prazo de uso real não foram fechados.
- Sem login real, banco Supabase, permissões no servidor, notificações externas ou publicação Vercel. Dados de demonstração em localStorage não são banco de produção. Cadastros de obras/locais são exemplos fixos nesta versão; não há tela de gestão de usuários.
- Esta atualização de retomada do AGENTS.md está salva localmente e ainda não foi enviada ao GitHub. Não enviar sem solicitação.

### Próximo passo
1. Ler este arquivo, PLANO-DO-PROJETO.md e PRD-FRONTEND.md. Conferir o estado da pasta e ligar o app existente sem reconstruir a Fundação.
2. Pedir ao usuário para testar troca de obras, lançamento/edição de nota, volume teórico, resultados e perfil Cliente. Corrigir o que ele apontar e executar npm run check após mudanças.
3. Confirmar a data-base dos ensaios e concluir o desenho do backend e dos acessos antes de conectar Supabase. Prosseguir somente com a etapa solicitada; não iniciar outro módulo, deploy ou envio ao GitHub automaticamente.

### Publicação em preparação — 12/10/2026
- Usuário autorizou envio ao GitHub e publicação Vercel para acesso por outros computadores, com atualizações automáticas. Essa autorização substitui a restrição anterior de não publicar nesta etapa.
- Projeto Vercel prj_lIFsw7cNsuLENaBrTiYbMV9BeitN conectado ao repositório controledeconcreto pelo usuário. Domínio reservado https://controledenotasconcreto.vercel.app/. Publicação ainda pendente de push/validação.
- Supabase Site URL e redirect autorizado apontam ao domínio público exato. Edge usuarios versão 2 usa esse endereço fixo para convites e recuperação, CORS público e dev 5175. Segredos apenas no servidor.
- Usuário autorizou remover a exigência de login Vercel para abrir a página; autenticação Supabase/RLS permanecem obrigatórias. Proteção Vercel removida com MCP após aprovação explícita.
- Botão Gerar link de acesso, somente gestor, para substituir links antigos. Não altera papel/status; alvo deve estar ativo. Recovery para conta confirmada, invite para pendente.

### Publicação confirmada — 12/10/2026
- https://controledenotasconcreto.vercel.app/ publicado via GitHub main 58518cb; Vercel READY, HTTP 200 anônimo e tela de login conferidos. Vercel conecta somente o repositório controledeconcreto. Novos pushes em main iniciam publicação automática.
- Build/lint/testes passaram. Teste do estranho bloqueou 18 operações nas 6 tabelas, cadastro público e gestão anônima. Revisões Standards/Spec sem bloqueios; texto de recuperação local corrigido.
- Para usuário já convidado com link local inválido: proprietário abre o app público, Usuários, Gerar link de acesso no destinatário e compartilha privadamente. O agente não solicita senha, token ou link. Confirmação real pelo convidado ainda pendente.
- Configurações e dados secretos nunca vão ao GitHub. .env.local/node_modules/dist/.vercel ignorados. Capturas de links reais não devem ser salvas.

- 12/10/2026: Cadastro de local pela nota inclui volume teórico opcional em m³, salvo no local e reutilizado nos demais lançamentos. Local existente sem teórico permite preenchê-lo na nota pelo botão Salvar volume teórico do local. Valor já salvo aparece para consulta; correções pela aba Obras. Comparativo na nota e Dashboard usa a soma de todas as notas salvas da mesma obra/local, de todas as datas. Nota em edição entra após salvar. Renomear local não altera teórico; cancelar limpa o rascunho.

- 12/10/2026: Dashboard com filtros Desde/Até, Local e FCK; obra pelo seletor global; Limpar filtros restaura todos. Trocar obra reinicia filtros. Gráfico diário, volume e número de notas seguem a seleção. Teórico continua total do local; comparação parcial rotulada e acumulado completo permanece como referência. Período invertido exibe alerta.
