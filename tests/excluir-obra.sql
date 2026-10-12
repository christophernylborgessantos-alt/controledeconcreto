begin;
insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000091','obra-editor@example.invalid'),('00000000-0000-4000-8000-000000000092','obra-cliente@example.invalid'),('00000000-0000-4000-8000-000000000093','obra-pendente@example.invalid');
update public.profiles set role='Analista',ativo=true where id='00000000-0000-4000-8000-000000000091';
update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000092';
insert into public.obras(id,nome) values ('10000000-0000-4000-8000-000000000091','TESTE APAGAR'),('10000000-0000-4000-8000-000000000092','TESTE PRESERVAR');
insert into public.locais(id,obra_id,nome,teorico) values ('20000000-0000-4000-8000-000000000091','10000000-0000-4000-8000-000000000091','TESTE',20),('20000000-0000-4000-8000-000000000092','10000000-0000-4000-8000-000000000092','TESTE',30);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000091","obra_id":"10000000-0000-4000-8000-000000000091","local_id":"20000000-0000-4000-8000-000000000091","numero":"TESTE-A","data":"2026-10-12","fck":30,"volume":8}',null);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000092","obra_id":"10000000-0000-4000-8000-000000000092","local_id":"20000000-0000-4000-8000-000000000092","numero":"TESTE-B","data":"2026-10-12","fck":30,"volume":5}',null);
do $$ begin
 begin perform public.excluir_obra('10000000-0000-4000-8000-000000000091','Nome antigo');raise exception 'Nome incorreto permitido';exception when serialization_failure then null;end;
 begin delete from public.obras where id='10000000-0000-4000-8000-000000000091';raise exception 'DELETE direto permitido';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000092","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_obra('10000000-0000-4000-8000-000000000091','TESTE APAGAR');raise exception 'Cliente excluiu';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000093","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_obra('10000000-0000-4000-8000-000000000091','TESTE APAGAR');raise exception 'Pendente excluiu';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin if has_function_privilege('anon','public.excluir_obra(uuid,text)','EXECUTE') then raise exception 'Anon executa exclusão';end if;end $$;
delete from public.acessos_obras where obra_id='10000000-0000-4000-8000-000000000091' and usuario_id='00000000-0000-4000-8000-000000000091';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
do $$ begin
 begin perform public.excluir_obra('10000000-0000-4000-8000-000000000091','TESTE APAGAR');raise exception 'Sem vínculo excluiu';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.acessos_obras(usuario_id,obra_id) values ('00000000-0000-4000-8000-000000000091','10000000-0000-4000-8000-000000000091');
create function pg_temp.falhar_exclusao() returns trigger language plpgsql as $$ begin if old.id='10000000-0000-4000-8000-000000000091' then raise exception 'TESTE FALHA' using errcode='23514';end if;return old;end $$;
create trigger teste_falha before delete on public.obras for each row execute function pg_temp.falhar_exclusao();
set local role authenticated;
do $$ begin
 begin perform public.excluir_obra('10000000-0000-4000-8000-000000000091','TESTE APAGAR');raise exception 'Falha não disparou';exception when check_violation then null;end;
 if (select count(*) from public.ensaios where obra_id='10000000-0000-4000-8000-000000000091')<>3 then raise exception 'Resultados perdidos após falha';end if;
 if not exists(select 1 from public.notas where obra_id='10000000-0000-4000-8000-000000000091') or not exists(select 1 from public.locais where obra_id='10000000-0000-4000-8000-000000000091') then raise exception 'Dados parcialmente apagados';end if;
end $$;
reset role;
drop trigger teste_falha on public.obras;
set local role authenticated;
select public.excluir_obra('10000000-0000-4000-8000-000000000091','TESTE APAGAR');
reset role;
do $$ declare tabela text; n integer; begin
 if exists(select 1 from public.obras where id='10000000-0000-4000-8000-000000000091') then raise exception 'Obra não apagada';end if;
 foreach tabela in array array['locais','notas','ensaios','acessos_obras'] loop
  execute format('select count(*) from public.%I where obra_id=$1',tabela) into n using '10000000-0000-4000-8000-000000000091'::uuid;
  if n<>0 then raise exception 'Dados restantes em %',tabela;end if;
 end loop;
 if not exists(select 1 from public.obras where id='10000000-0000-4000-8000-000000000092') or (select count(*) from public.ensaios where obra_id='10000000-0000-4000-8000-000000000092')<>3 then raise exception 'Outra obra afetada';end if;
 if (select count(*) from public.profiles where id in ('00000000-0000-4000-8000-000000000091','00000000-0000-4000-8000-000000000092','00000000-0000-4000-8000-000000000093'))<>3 then raise exception 'Contas apagadas';end if;
end $$;
select 'VERIFICADO: exclusão completa, atomicidade, outra obra/contas preservadas e permissões restritas' as resultado;
rollback;
