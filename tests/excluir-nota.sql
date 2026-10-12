begin;
do $$ begin
 if has_function_privilege('anon','public.excluir_nota(uuid,integer)','EXECUTE') then raise exception 'anon executa exclusão'; end if;
end $$;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000081','exclusao-editor@example.invalid'),('00000000-0000-4000-8000-000000000082','exclusao-cliente@example.invalid'),('00000000-0000-4000-8000-000000000083','exclusao-pendente@example.invalid');
update public.profiles set role='Analista',ativo=true where id='00000000-0000-4000-8000-000000000081';
update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000082';
insert into public.obras(id,nome) values('10000000-0000-4000-8000-000000000081','TESTE EXCLUSAO');
insert into public.locais(id,obra_id,nome) values('20000000-0000-4000-8000-000000000081','10000000-0000-4000-8000-000000000081','TESTE');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000081","obra_id":"10000000-0000-4000-8000-000000000081","local_id":"20000000-0000-4000-8000-000000000081","numero":"TESTE","data":"2026-10-11","fck":30,"volume":1}',null);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000082","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_nota('30000000-0000-4000-8000-000000000081',1); raise exception 'Cliente conseguiu excluir'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_nota('30000000-0000-4000-8000-000000000081',1); raise exception 'Pendente conseguiu excluir'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_nota('30000000-0000-4000-8000-000000000081',2); raise exception 'Versao incorreta excluiu'; exception when serialization_failure then null; end;
 if not exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000081') then raise exception 'Nota perdida'; end if;
end $$;
reset role;
delete from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000081';
set local role authenticated;
do $$ begin
 begin perform public.excluir_nota('30000000-0000-4000-8000-000000000081',1); raise exception 'Editor sem vínculo conseguiu excluir'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.acessos_obras(usuario_id,obra_id) values('00000000-0000-4000-8000-000000000081','10000000-0000-4000-8000-000000000081');
set local role authenticated;
select public.excluir_nota('30000000-0000-4000-8000-000000000081',1);
do $$ begin
 if exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000081') or exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000081') then raise exception 'Exclusao incompleta'; end if;
end $$;
select 'Cliente/pendente bloqueados, versão conferida, Analista exclui nota e ensaios atomicamente' as resultado;
rollback;
