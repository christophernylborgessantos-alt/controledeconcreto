begin;
-- Executar somente após a migration; tudo é revertido.
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000081','acessos-teste@example.invalid');
insert into public.obras(id,nome) values('00000000-0000-4000-8000-000000000082','Obra fixture A'),('00000000-0000-4000-8000-000000000083','Obra fixture B');
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081','Teste preservado','Analista',true);
do $$ begin
 if exists(select 1 from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000081') then raise exception 'Convite ativado recebeu obras automaticamente'; end if;
 begin perform public.administrar_obras('00000000-0000-4000-8000-000000000081','f91895ef-2aca-4a45-bbed-e44d5cd87cb1','{}'::uuid[]);raise exception 'Não gestor administrou obras';exception when insufficient_privilege then null;end;
 begin perform public.preparar_exclusao_usuario('00000000-0000-4000-8000-000000000081','f91895ef-2aca-4a45-bbed-e44d5cd87cb1','Christopher');raise exception 'Não gestor excluiu conta';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.administrar_obras(uuid,uuid,uuid[])','EXECUTE') or has_function_privilege('authenticated','public.preparar_exclusao_usuario(uuid,uuid,text)','EXECUTE') or has_function_privilege('anon','public.preparar_exclusao_usuario(uuid,uuid,text)','EXECUTE') then raise exception 'GRANT administrativo aberto'; end if;
end $$;
select public.administrar_obras('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081',array['00000000-0000-4000-8000-000000000082']::uuid[]);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","role":"authenticated"}',true);
do $$ begin
 if not public.acessa_obra('00000000-0000-4000-8000-000000000082') or public.acessa_obra('00000000-0000-4000-8000-000000000083') then raise exception 'Obras não isoladas'; end if;
 if has_function_privilege('authenticated','public.administrar_obras(uuid,uuid,uuid[])','EXECUTE') then raise exception 'Administração pelo navegador'; end if;
end $$;
reset role;
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081','Teste preservado','Analista',false);
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081','Teste preservado','Analista',true);
do $$ begin
 if (select count(*) from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000081')<>1 then raise exception 'Reativação alterou obras explícitas'; end if;
end $$;
-- Obra criada pelo escritor vincula criador e gestor, sem liberar outros ativos.
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000089','outro-fixture@example.invalid');
select public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000089','Outro fixture','Cliente',true);
set local role authenticated;
insert into public.obras(id,nome) values('00000000-0000-4000-8000-000000000090','Obra criada por fixture');
reset role;
do $$ begin
 if not exists(select 1 from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000081' and obra_id='00000000-0000-4000-8000-000000000090') or not exists(select 1 from public.acessos_obras where usuario_id='f91895ef-2aca-4a45-bbed-e44d5cd87cb1' and obra_id='00000000-0000-4000-8000-000000000090') or exists(select 1 from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000089' and obra_id='00000000-0000-4000-8000-000000000090') then raise exception 'Vínculos de obra nova incorretos'; end if;
end $$;
insert into public.locais(id,obra_id,nome) values('00000000-0000-4000-8000-000000000084','00000000-0000-4000-8000-000000000082','Local preservado');
insert into public.notas(id,obra_id,local_id,numero,data,fck,volume) values('00000000-0000-4000-8000-000000000085','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000084','FIXTURE','2026-11-01',30,8);
insert into public.ensaios(obra_id,nota_id,idade,resultado_1) values('00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000085',28,30);
insert into public.mapas(id,obra_id,local_id,peca,desde,ate) values('00000000-0000-4000-8000-000000000086','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000084','Fixture','2026-11-01','2026-11-01');
insert into public.mapa_itens(mapa_id,obra_id,nota_id) values('00000000-0000-4000-8000-000000000086','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000085');
select public.preparar_exclusao_usuario('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081','Teste preservado');
do $$ begin
 if not exists(select 1 from public.locais where id='00000000-0000-4000-8000-000000000084') then raise exception 'Histórico perdido'; end if;
 if exists(select 1 from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000081') then raise exception 'Acesso não revogado'; end if;
 if exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000081' and ativo) then raise exception 'Perfil continua ativo'; end if;
 begin perform public.preparar_exclusao_usuario('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','f91895ef-2aca-4a45-bbed-e44d5cd87cb1','Christopher');raise exception 'Gestor excluído';exception when insufficient_privilege then null;end;
end $$;
-- Simula a marca deixada pelo soft delete, somente na identidade fixture.
update auth.users set deleted_at=now() where id='00000000-0000-4000-8000-000000000081';
-- Mesmo uma reativação administrativa concorrente não pode restaurar o token antigo.
update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000081';
insert into public.acessos_obras(usuario_id,obra_id) values('00000000-0000-4000-8000-000000000081','00000000-0000-4000-8000-000000000082');
set local role authenticated;
do $$ begin
 if public.acessa_obra('00000000-0000-4000-8000-000000000082') or public.perfil_editor() then raise exception 'Token antigo da conta excluída continua autorizado'; end if;
 if exists(select 1 from public.notas where id='00000000-0000-4000-8000-000000000085') or exists(select 1 from public.mapas where id='00000000-0000-4000-8000-000000000086') then raise exception 'RLS expôs histórico à conta excluída'; end if;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.notas where id='00000000-0000-4000-8000-000000000085' and volume=8) or not exists(select 1 from public.ensaios where nota_id='00000000-0000-4000-8000-000000000085' and resultado_1=30) or not exists(select 1 from public.mapas where id='00000000-0000-4000-8000-000000000086') or not exists(select 1 from public.mapa_itens where mapa_id='00000000-0000-4000-8000-000000000086') then raise exception 'Histórico de notas/ensaios/mapas perdido'; end if;
 begin perform public.administrar_perfil('f91895ef-2aca-4a45-bbed-e44d5cd87cb1','00000000-0000-4000-8000-000000000081','Teste preservado','Analista',true);raise exception 'Conta excluída reativada';exception when insufficient_privilege then null;end;
end $$;
rollback;
