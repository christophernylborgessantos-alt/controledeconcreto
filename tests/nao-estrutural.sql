begin;
insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000081','ensaio-editor@example.invalid'),('00000000-0000-4000-8000-000000000082','ensaio-cliente@example.invalid');
update public.profiles set ativo=true,role='Analista' where id='00000000-0000-4000-8000-000000000081';
update public.profiles set ativo=true where id='00000000-0000-4000-8000-000000000082';
insert into public.obras(id,nome) values ('10000000-0000-4000-8000-000000000081','TESTE NAO ESTRUTURAL');
insert into public.locais(id,obra_id,nome) values ('20000000-0000-4000-8000-000000000081','10000000-0000-4000-8000-000000000081','TESTE');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000081","obra_id":"10000000-0000-4000-8000-000000000081","local_id":"20000000-0000-4000-8000-000000000081","numero":"TESTE-NE","data":"2020-01-01","fck":30,"volume":8}',null);
do $$ declare payload jsonb:='{"nao_estrutural":true,"7":{"esperado":30,"resultados":[0,2]},"28":{"esperado":null,"resultados":[null,null]},"63":{"esperado":null,"resultados":[null,null]}}'; begin
 perform public.salvar_ensaios('30000000-0000-4000-8000-000000000081',1,payload,'teste');
 if not exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000081' and nao_estrutural and versao=2) then raise exception 'Classificação não salva'; end if;
 if not exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000081' and idade=7 and resultado_1=0) then raise exception 'Resultados perdidos'; end if;
 begin perform public.salvar_ensaios('30000000-0000-4000-8000-000000000081',1,payload||'{"nao_estrutural":false}','');raise exception 'Conflito não bloqueado';exception when serialization_failure then null;end;
 perform public.salvar_ensaios('30000000-0000-4000-8000-000000000081',2,payload-'nao_estrutural','legado');
 if not (select nao_estrutural from public.notas where id='30000000-0000-4000-8000-000000000081') then raise exception 'Cliente legado alterou classificação'; end if;
 perform public.salvar_ensaios('30000000-0000-4000-8000-000000000081',3,payload||'{"nao_estrutural":false}','');
 if (select nao_estrutural from public.notas where id='30000000-0000-4000-8000-000000000081') then raise exception 'Reativação falhou';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000082","role":"authenticated"}',true);
do $$ begin
 begin perform public.salvar_ensaios('30000000-0000-4000-8000-000000000081',4,'{}','');raise exception 'Cliente classificou';exception when insufficient_privilege then null;end;
 begin update public.notas set nao_estrutural=true where id='30000000-0000-4000-8000-000000000081';raise exception 'UPDATE direto permitido';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'VERIFICADO: classificação, retorno estrutural, resultados preservados, conflito e permissões' as resultado;
rollback;
