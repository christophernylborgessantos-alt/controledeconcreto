# Controle de notas de concreto
Somente o módulo controlenotasconcreto. React + Vite, CSS próprio, navegação por estado. Referência visual: preview.html. Requisitos: PLANO-DO-PROJETO.md e PRD-FRONTEND.md.
Dados: src/lib/dados.js é a única porta; mockData.js gera exemplos; regras.js concentra cálculos. Cada nota e local possui obra_id. Perfis Christopher e Analista escrevem; Cliente consulta todas as obras. Perfil demonstrativo não é autenticação real.
Volume teórico opcional por local; ausência não é zero. Duas resistências por idade (7, 28, 63); esperado por idade, sem inferir fck. Prazos contam provisoriamente da aplicação, em dias corridos. Dois resultados preenchem a idade, inclusive zero. Datas atuais no fuso America/Sao_Paulo.
Persistência de demonstração em localStorage; sem Supabase conectado. Não inserir dados reais nesta fase. Não há envio de e-mail/push, só avisos internos.
Verificação obrigatória: npm run check (build, lint e testes). Bugs em src/lib exigem teste de regressão. Revisão de código antes de push se alterar src/lib/dados.js, src/lib/supabase.js, RLS, migrations ou dinheiro. Não enviar automaticamente ao GitHub nem publicar.
Nunca versionar node_modules, dist, .env.local ou outras chaves. Banco futuro só via migrations versionadas, RLS e GRANT para authenticated. Não configurar credenciais sem necessidade.
