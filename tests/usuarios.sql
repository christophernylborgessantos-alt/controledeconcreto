begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000071','gestor-teste@example.invalid'),('00000000-0000-4000-8000-000000000072','usuario-teste@example.invalid');
-- O gestor real não é alterado. Somente a rotina administrativa muda o terceiro.
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000072','Teste','Analista',true);
do $$ begin
 if not exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000072' and role='Analista' and ativo) then raise exception 'Gestor não alterou terceiro'; end if;
 begin perform public.administrar_perfil('00000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000071','Intruso','Christopher',true); raise exception 'Comum administra'; exception when insufficient_privilege then null; end;
 begin perform public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','f91895ef-2aca-4a45-bbed-e44d5cd87cb1','Proprio','Cliente',false); raise exception 'Auto-desativacao permitida'; exception when insufficient_privilege then null; end;
 begin perform public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000072','Invalido','administrador',true); raise exception 'Papel invalido permitido'; exception when check_violation then null; end;
 if has_function_privilege('authenticated','public.administrar_perfil(uuid,uuid,text,text,boolean)','EXECUTE') then raise exception 'Navegador executa administracao direta'; end if;
end $$;
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000072','Teste','Cliente',false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000072","role":"authenticated"}',true);
do $$ begin
 begin update public.profiles set gestor_usuarios=true where id='00000000-0000-4000-8000-000000000072'; raise exception 'Autopromocao permitida'; exception when insufficient_privilege then null; end;
 if exists(select 1 from public.obras) then raise exception 'Desativado ve dados'; end if;
end $$;
reset role;
select 'Gestão, classificação, auto-desativação, privilégio de gestão e bloqueio após desativação: verificados' as resultado;
rollback;
