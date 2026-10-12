begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000091','obra-regressao@example.invalid');
update public.profiles set ativo=true,role='Christopher' where id='00000000-0000-4000-8000-000000000091';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
-- Mesmo fluxo corrigido da tela: inserir sem RETURNING; ler após criar vínculo.
insert into public.obras(nome,tipo) values('TESTE REGRESSAO','');
do $$ begin
 if not exists(select 1 from public.obras where nome='TESTE REGRESSAO') then
  raise exception 'Obra criada não visível após vínculo';
 end if;
end $$;
select 'Cadastro e leitura após vínculo: verificados' as resultado;
rollback;
