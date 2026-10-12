begin;
create temporary table auditoria_resultados(caso text,resultado text);
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','editor@example.invalid'),
 ('00000000-0000-4000-8000-000000000002','cliente@example.invalid'),
 ('00000000-0000-4000-8000-000000000003','pendente@example.invalid');
update public.profiles set ativo=true,role='Christopher' where id='00000000-0000-4000-8000-000000000001';
update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000002';
insert into public.obras(id,nome) values
 ('10000000-0000-4000-8000-000000000001','TESTE A'),
 ('10000000-0000-4000-8000-000000000002','TESTE B');
delete from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000002' and obra_id='10000000-0000-4000-8000-000000000002';
insert into public.locais(id,obra_id,nome) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','TESTE'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','TESTE');
grant select,insert on auditoria_resultados to authenticated,anon;
set local role anon;
do $$ declare t text; begin
 foreach t in array array['profiles','obras','acessos_obras','locais','notas','ensaios'] loop
  begin execute format('select * from public.%I limit 1',t); raise exception 'PORTA ABERTA % leitura',t; exception when insufficient_privilege then insert into auditoria_resultados values(t||' anon ler','PORTA FECHADA'); end;
  begin execute format('insert into public.%I default values',t); raise exception 'PORTA ABERTA % inserir',t; exception when insufficient_privilege then insert into auditoria_resultados values(t||' anon inserir','PORTA FECHADA'); end;
  begin execute format('delete from public.%I where false',t); raise exception 'PORTA ABERTA % excluir',t; exception when insufficient_privilege then insert into auditoria_resultados values(t||' anon excluir','PORTA FECHADA'); end;
 end loop;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000001","obra_id":"10000000-0000-4000-8000-000000000001","local_id":"20000000-0000-4000-8000-000000000001","numero":"TESTE-1","data":"2026-10-11","fck":30,"volume":0.1}'::jsonb,null);
do $$ begin
 if (select count(*) from public.ensaios where nota_id='30000000-0000-4000-8000-000000000001')<>3 then raise exception 'Idades ausentes'; end if;
 begin perform public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000002","obra_id":"10000000-0000-4000-8000-000000000001","local_id":"20000000-0000-4000-8000-000000000002","numero":"TESTE-2","data":"2026-10-11","fck":30,"volume":1}',null); raise exception 'FK aberta'; exception when foreign_key_violation then insert into auditoria_resultados values('FK obra/local','PORTA FECHADA'); end;
 begin perform public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000002","obra_id":"10000000-0000-4000-8000-000000000001","local_id":"20000000-0000-4000-8000-000000000001","numero":"TESTE-1","data":"2026-10-11","fck":30,"volume":1}',null); raise exception 'Duplicidade aceita'; exception when unique_violation then insert into auditoria_resultados values('nota duplicada','PORTA FECHADA'); end;
end $$;
select public.salvar_ensaios('30000000-0000-4000-8000-000000000001',1,'{"7":{"esperado":null,"resultados":[0,0]},"28":{"esperado":30,"resultados":[null,null]},"63":{"esperado":null,"resultados":[null,null]}}','teste');
do $$ begin
 if not exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000001' and idade=7 and resultado_1=0 and resultado_2=0 and esperado=30) then raise exception 'Zero/null corrompido'; end if;
 begin perform public.salvar_ensaios('30000000-0000-4000-8000-000000000001',1,'{}','perda'); raise exception 'Versao antiga aceita'; exception when serialization_failure then insert into auditoria_resultados values('edicao concorrente','PORTA FECHADA'); end;
 begin perform public.salvar_ensaios('30000000-0000-4000-8000-000000000001',2,'{"7":{"esperado":1,"resultados":[1,2]},"28":{"esperado":1,"resultados":[-1,2]},"63":{"esperado":1,"resultados":[1,2]}}','perda'); raise exception 'Negativo aceito'; exception when check_violation then insert into auditoria_resultados values('resistencia negativa','PORTA FECHADA'); end;
 if not exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000001' and versao=2 and observacoes='teste') then raise exception 'Atomicidade falhou'; end if;
 insert into auditoria_resultados values('zero/null e atomicidade','VERIFICADO');
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ declare t text; begin
 if (select count(*) from public.obras where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'))<>1 then raise exception 'Vazamento entre obras'; end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Perfil alheio visivel'; end if;
 foreach t in array array['profiles','obras','acessos_obras','locais','notas','ensaios'] loop
  begin execute format('delete from public.%I where false',t); raise exception 'DELETE permitido'; exception when insufficient_privilege then insert into auditoria_resultados values(t||' cliente excluir','PORTA FECHADA'); end;
 end loop;
 begin update public.profiles set role='Christopher',ativo=true where id='00000000-0000-4000-8000-000000000002'; raise exception 'Promocao permitida'; exception when insufficient_privilege then insert into auditoria_resultados values('cliente promover perfil','PORTA FECHADA'); end;
 begin insert into public.obras(nome) values('INTRUSA'); raise exception 'Cliente cria obra'; exception when insufficient_privilege then insert into auditoria_resultados values('cliente criar obra','PORTA FECHADA'); end;
 update public.locais set teorico=10 where obra_id='10000000-0000-4000-8000-000000000001';
 if found then raise exception 'Cliente edita teorico'; end if;
 begin perform public.salvar_ensaios('30000000-0000-4000-8000-000000000001',2,'{}','intruso'); raise exception 'Cliente salva ensaio'; exception when insufficient_privilege then insert into auditoria_resultados values('cliente RPC escrita','PORTA FECHADA'); end;
 insert into auditoria_resultados values('isolamento de obras e perfis','PORTA FECHADA');
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ declare t text; v_count integer; begin
 foreach t in array array['obras','locais','notas','ensaios','acessos_obras'] loop
  execute format('select count(*) from public.%I',t) into v_count;
  if v_count<>0 then raise exception 'Pendente le %',t; end if;
  insert into auditoria_resultados values(t||' pendente ler','PORTA FECHADA');
 end loop;
 begin update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000003'; raise exception 'Autoaprovacao permitida'; exception when insufficient_privilege then insert into auditoria_resultados values('pendente autoaprovar','PORTA FECHADA'); end;
end $$;
reset role;
select * from auditoria_resultados;
rollback;
