# Login e banco — plano de implementação

> Para execução: usar superpowers:executing-plans, tarefa por tarefa, nesta conversa.

**Objetivo:** substituir a demonstração local por login e banco Supabase protegidos.
**Arquitetura:** telas acessam dados.js; supabase.js instancia o cliente. Regras de negócio permanecem em regras.js e restrições de integridade/permissões são impostas também no Postgres.
**Stack:** React, Vite, CSS próprio, Supabase Auth/Postgres e @supabase/supabase-js já declarado.
**Spec:** PRD-BACKEND.md na raiz.

## Restrições globais

- Apenas controledenotasconcreto. Banco vazio, sem importar localStorage.
- Convites autorizados por Christopher; cadastro público desligado.
- Christopher e Analista escrevem, Cliente consulta todas as obras vinculadas.
- Aplicação + 7/28/63 dias corridos; America/Sao_Paulo.
- null não é zero. Sem DELETE, publicação ou push nesta etapa.
- Toda alteração de banco tem migration versionada, RLS e GRANT mínimo.

## Foco de revisão

- Resposta de consulta antiga após logout não repõe dados na nova sessão.
- Banco vazio permite cadastrar obra e local antes da nota.
- Erro ao salvar mantém formulário e não anuncia sucesso.
- Duas edições simultâneas geram conflito, sem perda silenciosa.
- Usuário inativo ou sem vínculo não acessa dados pela API diretamente.

## 1. Banco e permissões

Arquivos: supabase/migrations/20261011_base.sql; tests/seguranca.sql.
Interfaces: profiles, obras, acessos_obras, locais, notas, ensaios conforme PRD; funções transacionais salvar_nota e salvar_ensaios recebem versão esperada e recusam conflito.

- [ ] Confirmar custo e criar projeto na organização escolhida, região sa-east-1; conferir tabelas existentes e advisors antes de aplicar SQL.
- [ ] Escrever testes SQL em transações revertidas: anon sem acesso; Cliente sem escrita; perfil comum sem promoção; inativo sem leitura; vínculo A sem linhas B; FK entre obras recusada; nota duplicada recusada; resultados zero preservados.
- [ ] Criar migrations com UUIDs, numeric finito sem arredondamento silencioso, datas, CHECKs, índices, FKs compostas, RLS e GRANT mínimo. Gatilhos criam perfil inativo e vínculos após ativação/criação de obra.
- [ ] Implementar operações atômicas de nota e ensaios com versão e validar permissões no servidor; funções não podem conceder acesso implícito.
- [ ] Aplicar via MCP e executar testes SQL, incluindo segunda escrita com versão antiga recusada. Dados fictícios não permanecem no banco.

## 2. Camada de dados e sessão

Arquivos: src/lib/supabase.js, src/lib/dados.js, .env.example, tests/dados.mjs, tests/run.mjs.
Interfaces: entrar(email, senha), sair(), observarSessao(callback), carregar() e operações de salvar retornam Promises; erros tratados em português. Consultas e autenticação passam por dados.js.

- [ ] Escrever testes com cliente controlado: resposta com erro rejeita salvamento; montagem do objeto preserva null/zero; nenhuma operação cai em mock quando banco falha.
- [ ] Rodar testes e comprovar falha antes da implementação.
- [ ] Instanciar cliente com URL/chave publicável em .env.local ignorado pelo Git; implementar leitura e escrita por registro, sem persistir conjunto completo do navegador.
- [ ] Adaptar testes anteriores preservando validação pura e cálculos; rodar testes até passarem.

## 3. Login e telas assíncronas

Arquivos: src/App.jsx, src/screens/Login.jsx, src/screens/Notas.jsx, src/screens/Ensaios.jsx, src/screens/Obras.jsx, src/index.css.
Interfaces: telas aguardam salvar; App controla sessão, perfil, carregamento e atualização dos dados. Obras permite cadastro/edição de obra e local para perfis escritores.

- [ ] Substituir seletor de perfil por login, sessão e saída. Bloquear perfil inativo e limpar dados ao sair. Ignorar respostas de sessão anterior.
- [ ] Adaptar formulários para aguardar confirmação, bloquear envio duplicado e manter rascunho no erro; recarregar em conflito mediante ação do usuário.
- [ ] Implementar estados vazios e criação de obra/local; remover obra fixa e referências a dez obras cadastradas.
- [ ] Conferir no navegador login, saída, banco vazio, cadastro inicial, edição, erro sem perda do formulário e Cliente sem controles de escrita.

## 4. Provisionamento e fechamento

Arquivos: tests/check-schema.mjs, tests/check-grants.mjs, tests/_schema-snapshot.json, package.json, AGENTS.md, PLANO-DO-PROJETO.md, PRD-FRONTEND.md, seguranca-relatorio.md.

- [ ] Conferir cadastro público desligado. Definir destinatário da primeira conta Christopher antes de provisionar/enviar qualquer convite; sem senha no chat nem chave administrativa no frontend.
- [ ] Acrescentar checks de schema/GRANT ao runner; regenerar snapshot após migration. Não tratar snapshot como prova da RLS.
- [ ] Executar npm.cmd run check: build, lint e testes com saída zero.
- [ ] Executar auditoria anônima e autenticada em registros controlados; ausência de linhas ou erro de integridade não é prova automática de bloqueio. Executar advisors e relatar limitações.
- [ ] Verificar login e persistência real, atualizar documentação e entregar resultado sem push ou deploy.

## Revisão do plano

As quatro tarefas cobrem login, provisionamento, integridade, permissões, início vazio e integração assíncrona do PRD. E-mail inicial e custo dependem de informação externa e serão resolvidos antes de criar/enviar recursos. Implementação será feita pelo agente nesta conversa, sem delegação automática.
