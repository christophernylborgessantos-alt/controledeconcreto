# Publicação e convites

Endereço definitivo: https://controledenotasconcreto.vercel.app/

O GitHub controledeconcreto está conectado à Vercel. Ao enviar uma versão revisada para main, a Vercel compila e publica automaticamente. O domínio permanece o mesmo entre versões. Não compartilhe os endereços temporários de cada publicação.

A página é pública; o conteúdo do sistema exige login Supabase e permissões do banco. O cadastro público permanece desligado.

A função usuarios gera convites e recuperação usando somente esse domínio. Para corrigir um link antigo de localhost, o gestor usa Gerar link de acesso. O destinatário define sua própria senha. Nenhum e-mail é enviado automaticamente por essa gestão.

Em 12/10/2026: primeira publicação 58518cb READY; HTTP200 sem sessão; login visível; npm run check aprovado; teste anônimo com portas fechadas. Nova publicação de documentação e testes verifica a continuidade automática.

Se mudar de domínio, atualize o endereço fixo em supabase/functions/usuarios/index.ts, implante a função, atualize Site URL e redirects no Supabase e confira os links novamente. Alterações na função ou banco precisam ser implantadas separadamente; o GitHub/Vercel publica somente o frontend.
