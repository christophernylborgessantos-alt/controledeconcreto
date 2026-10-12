begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000091','import-editor@example.invalid'),
 ('00000000-0000-4000-8000-000000000092','import-cliente@example.invalid'),
 ('00000000-0000-4000-8000-000000000093','import-pendente@example.invalid');
update public.profiles set ativo=true,role=case when id='00000000-0000-4000-8000-000000000091' then 'Analista' else 'Cliente' end where id in ('00000000-0000-4000-8000-000000000091','00000000-0000-4000-8000-000000000092');
insert into public.obras(id,nome) values ('10000000-0000-4000-8000-000000000091','TESTE IMPORTAÇÃO'),('10000000-0000-4000-8000-000000000092','TESTE OUTRA');
insert into public.locais(id,obra_id,nome,teorico) values ('20000000-0000-4000-8000-000000000091','10000000-0000-4000-8000-000000000091','Existente',100);
delete from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000091' and obra_id='10000000-0000-4000-8000-000000000092';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000091","obra_id":"10000000-0000-4000-8000-000000000091","local_id":"20000000-0000-4000-8000-000000000091","numero":"EXISTE","data":"2026-10-12","fck":30,"volume":8,"peca_estrutural":"Pilar antigo"}',null);
do $$ declare ens jsonb:='{"7":{"esperado":1,"resultados":[0,null]},"28":{"esperado":1,"resultados":[30,null]},"63":{"esperado":1,"resultados":[null,null]}}';
 lote jsonb; r jsonb;
begin
 perform public.salvar_ensaios('30000000-0000-4000-8000-000000000091',1,ens,'Original');
 lote:=jsonb_build_array(
  '{"linha":2,"numero":"EXISTE","volume":999,"local":"NÃO CRIAR"}'::jsonb,
  jsonb_build_object('linha',3,'numero','NOVA1','local','Novo local','data','2026-10-12','fck',30,'volume',0.1,'peca_estrutural','Viga V03','observacoes','Importado','ensaios',ens,'obra_id','10000000-0000-4000-8000-000000000092'),
  jsonb_build_object('linha',4,'numero','NOVA2','local',' NOVO  LOCAL ','data','2026-10-13','fck',30.123456,'volume',0.2,'nao_estrutural',true,'ensaios',ens)
 );
 r:=public.importar_notas('10000000-0000-4000-8000-000000000091',lote);
 if r->>'criadas'<>'2' or r->>'ignoradas'<>'1' or r->>'locais_criados'<>'1' then raise exception 'Contagem incorreta: %',r;end if;
 if not exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000091' and volume=8 and observacoes='Original' and peca_estrutural='Pilar antigo' and versao=2) then raise exception 'Nota existente alterada';end if;
 if exists(select 1 from public.locais where obra_id='10000000-0000-4000-8000-000000000091' and nome='NÃO CRIAR') then raise exception 'Local de NF ignorada criado';end if;
 if (select teorico from public.locais where id='20000000-0000-4000-8000-000000000091')<>100 then raise exception 'Teórico alterado';end if;
 if not exists(select 1 from public.notas n join public.ensaios e on e.nota_id=n.id where n.obra_id='10000000-0000-4000-8000-000000000091' and n.numero='NOVA1' and n.volume=0.1 and n.observacoes='Importado' and n.peca_estrutural='Viga V03' and e.idade=7 and e.esperado=21 and e.resultado_1=0 and e.resultado_2 is null) then raise exception 'Importação incorreta ou zero perdido';end if;
 if not exists(select 1 from public.notas where obra_id='10000000-0000-4000-8000-000000000091' and numero='NOVA2' and nao_estrutural) then raise exception 'Classificação perdida';end if;
 if not exists(select 1 from public.notas n join public.ensaios e on e.nota_id=n.id where n.obra_id='10000000-0000-4000-8000-000000000091' and n.numero='NOVA2' and e.idade=7 and e.esperado=21.086419) then raise exception 'Precisão FCK na importação incorreta';end if;
 r:=public.importar_notas('10000000-0000-4000-8000-000000000091',lote);
 if r->>'criadas'<>'0' or r->>'ignoradas'<>'3' or r->>'locais_criados'<>'0' then raise exception 'Reimportação duplicou';end if;
 begin
  perform public.importar_notas('10000000-0000-4000-8000-000000000091',jsonb_build_array(
   jsonb_build_object('numero','ATÔMICA1','local','LOCAL ATÔMICO','data','2026-10-12','fck',30,'volume',1,'ensaios',ens),
   jsonb_build_object('numero','ATÔMICA2','local','LOCAL ATÔMICO','data','2026-10-12','fck',30,'volume',-1,'ensaios',ens)
  ));raise exception 'Erro aceito';exception when check_violation then null;
 end;
 if exists(select 1 from public.notas where obra_id='10000000-0000-4000-8000-000000000091' and numero like 'ATÔMICA%') or exists(select 1 from public.locais where obra_id='10000000-0000-4000-8000-000000000091' and nome='LOCAL ATÔMICO') then raise exception 'Importação parcial';end if;
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000092',lote);raise exception 'Sem vínculo importou';exception when insufficient_privilege then null;end;
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000091','[]');raise exception 'Lote vazio aceito';exception when check_violation then null;end;
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000091','{}');raise exception 'Objeto aceito';exception when check_violation then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000092","role":"authenticated"}',true);
do $$ begin
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000091','[]');raise exception 'Cliente importou';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000093","role":"authenticated"}',true);
do $$ begin
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000091','[]');raise exception 'Pendente importou';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.importar_notas('10000000-0000-4000-8000-000000000091','[]');raise exception 'Anônimo importou';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'VERIFICADO: importação atômica, NF existente preservada, reimportação, locais, ensaios/zero/FCK, classificação e permissões' as resultado;
rollback;
