begin;
insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000095','fck-editor@example.invalid');
update public.profiles set role='Analista',ativo=true where id='00000000-0000-4000-8000-000000000095';
insert into public.obras(id,nome) values ('10000000-0000-4000-8000-000000000095','TESTE FCK');
insert into public.locais(id,obra_id,nome) values ('20000000-0000-4000-8000-000000000095','10000000-0000-4000-8000-000000000095','TESTE');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000095","obra_id":"10000000-0000-4000-8000-000000000095","local_id":"20000000-0000-4000-8000-000000000095","numero":"TESTE","data":"2026-10-12","fck":30,"volume":8}',null);
do $$ begin
 if (select count(*) from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and esperado=case when idade=7 then 21 else 30 end)<>3 then raise exception 'Esperado inicial não veio do FCK';end if;
 perform public.salvar_ensaios('30000000-0000-4000-8000-000000000095',1,'{"7":{"esperado":1,"resultados":[0,null]},"28":{"esperado":1,"resultados":[30,null]},"63":{"esperado":1,"resultados":[null,null]}}','teste');
 if (select count(*) from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and esperado=case when idade=7 then 21 else 30 end)<>3 then raise exception 'Cliente trocou esperado manualmente';end if;
 perform public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000095","obra_id":"10000000-0000-4000-8000-000000000095","local_id":"20000000-0000-4000-8000-000000000095","numero":"TESTE","data":"2026-10-12","fck":35,"volume":8}',2);
 if (select count(*) from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and esperado=case when idade=7 then 24.5 else 35 end)<>3 then raise exception 'Correção FCK não atualizou as três idades';end if;
 if not exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and idade=7 and resultado_1=0 and resultado_2 is null) or not exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and idade=28 and resultado_1=30) then raise exception 'Resultados alterados';end if;
 perform public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000095","obra_id":"10000000-0000-4000-8000-000000000095","local_id":"20000000-0000-4000-8000-000000000095","numero":"TESTE","data":"2026-10-12","fck":30.123456,"volume":8}',3);
 if not exists(select 1 from public.ensaios where nota_id='30000000-0000-4000-8000-000000000095' and idade=7 and esperado=21.086419) then raise exception 'Precisão do limite incorreta';end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','public.esperado_fck_nota()','EXECUTE') or has_function_privilege('anon','public.atualizar_esperado_fck()','EXECUTE') then raise exception 'Funções internas expostas';end if;
end $$;
select 'VERIFICADO: FCK automático, entrada manual ignorada, correção sincronizada, resultados preservados e funções restritas' as resultado;
rollback;
