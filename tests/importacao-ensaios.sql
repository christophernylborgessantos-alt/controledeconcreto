begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000091','import-ensaio@example.invalid');
update public.profiles set ativo=true,role='Analista' where id='00000000-0000-4000-8000-000000000091';
insert into public.obras(id,nome) values('00000000-0000-4000-8000-000000000092','Fixture ensaios');
insert into public.acessos_obras values('00000000-0000-4000-8000-000000000091','00000000-0000-4000-8000-000000000092');
insert into public.locais(id,obra_id,nome,teorico) values('00000000-0000-4000-8000-000000000093','00000000-0000-4000-8000-000000000092','Fixture',10);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
select public.salvar_nota('{"id":"00000000-0000-4000-8000-000000000094","obra_id":"00000000-0000-4000-8000-000000000092","local_id":"00000000-0000-4000-8000-000000000093","numero":"001","data":"2026-11-01","fck":30,"slump":"12","volume":8}',null);
select public.salvar_ensaios('00000000-0000-4000-8000-000000000094',1,'{"7":{"resultados":[20,21]},"28":{"resultados":[30,null]},"63":{"resultados":[null,null]}}','Preservar');
select public.importar_resultados_ensaios('00000000-0000-4000-8000-000000000092','[{"id":"00000000-0000-4000-8000-000000000094","numero":"001","versao":2,"resultados":{"7":[0,null],"28":[null,35],"63":[null,null]}}]');
do $$ begin
 if not exists(select 1 from public.ensaios where nota_id='00000000-0000-4000-8000-000000000094' and idade=7 and resultado_1=0 and resultado_2=21 and esperado=21) then raise exception 'Zero/vazio alterado';end if;
 if not exists(select 1 from public.ensaios where nota_id='00000000-0000-4000-8000-000000000094' and idade=28 and resultado_1=30 and resultado_2=35) then raise exception 'Resultado não atualizado';end if;
 if not exists(select 1 from public.notas where id='00000000-0000-4000-8000-000000000094' and numero='001' and volume=8 and fck=30 and slump='12' and observacoes='Preservar' and not nao_estrutural and versao=3) then raise exception 'Nota alterada';end if;
 begin perform public.importar_resultados_ensaios('00000000-0000-4000-8000-000000000092','[{"id":"00000000-0000-4000-8000-000000000094","numero":"001","versao":2,"resultados":{"7":[99,null],"28":[null,null],"63":[null,null]}}]');raise exception 'Versão antiga aceita';exception when serialization_failure then null;end;
 begin perform public.importar_resultados_ensaios('00000000-0000-4000-8000-000000000092','[{"id":"00000000-0000-4000-8000-000000000094","numero":"001","versao":3,"resultados":{"7":[99,null],"28":[-1,null],"63":[null,null]}}]');raise exception 'Negativo aceito';exception when check_violation then null;end;
 if not exists(select 1 from public.ensaios where nota_id='00000000-0000-4000-8000-000000000094' and idade=7 and resultado_1=0) then raise exception 'Atomicidade perdida';end if;
end $$;
do $$
declare
 obra constant uuid := '00000000-0000-4000-8000-000000000092';
 lote constant jsonb := '[{"id":"00000000-0000-4000-8000-000000000094","numero":"001","versao":3,"resultados":{"7":[25,null],"28":[null,null],"63":[null,null]}}]';
 registro jsonb;
begin
 registro := public.importar_laudo(obra,lote,'Drive.pdf','drive');
 if registro->>'arquivo' is distinct from 'Drive.pdf' or registro->>'notas_atualizadas' is distinct from '1'
 then raise exception 'Registro de upload incorreto'; end if;

 begin
  perform public.importar_laudo(obra,jsonb_set(lote,'{0,versao}','4'),'Falha.pdf','invalido');
  raise exception 'Origem inválida aceita';
 exception when check_violation then null; end;

 if not exists(select 1 from public.ultimo_upload_laudo u where u.obra_id=obra and u.arquivo='Drive.pdf')
 then raise exception 'Falha substituiu o último upload'; end if;
 if not exists(select 1 from public.notas where obra_id=obra and numero='001' and versao=4)
 then raise exception 'Falha no registro gravou o ensaio'; end if;

 perform public.importar_laudo(obra,jsonb_set(lote,'{0,versao}','4'),'Local.pdf','local');
 if not exists(select 1 from public.ultimo_upload_laudo u where u.obra_id=obra and u.arquivo='Local.pdf' and u.origem='local')
 then raise exception 'O último upload não foi substituído'; end if;
end $$;
reset role;
update public.profiles set role='Cliente' where id='00000000-0000-4000-8000-000000000091';
set local role authenticated;
do $$ begin
 begin perform public.importar_resultados_ensaios('00000000-0000-4000-8000-000000000092','[]');raise exception 'Cliente escreve';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.importar_resultados_ensaios(uuid,jsonb)','EXECUTE') then raise exception 'Anon executa';end if;
 if exists(select 1 from public.ultimo_upload_laudo) then raise exception 'Cliente lê registro de upload';end if;
 begin perform public.importar_laudo('00000000-0000-4000-8000-000000000092','[]','Laudo.pdf','drive');raise exception 'Cliente registra laudo';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
