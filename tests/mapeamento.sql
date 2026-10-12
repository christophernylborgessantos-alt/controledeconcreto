begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000097','map-editor@example.invalid'),
 ('00000000-0000-4000-8000-000000000098','map-cliente@example.invalid'),
 ('00000000-0000-4000-8000-000000000099','map-pendente@example.invalid');
update public.profiles set ativo=true,role=case when id='00000000-0000-4000-8000-000000000097' then 'Analista' else 'Cliente' end where id in ('00000000-0000-4000-8000-000000000097','00000000-0000-4000-8000-000000000098');
insert into public.obras(id,nome) values ('10000000-0000-4000-8000-000000000097','TESTE MAPA'),('10000000-0000-4000-8000-000000000098','TESTE OUTRA');
insert into public.locais(id,obra_id,nome) values ('20000000-0000-4000-8000-000000000097','10000000-0000-4000-8000-000000000097','TESTE'),('20000000-0000-4000-8000-000000000098','10000000-0000-4000-8000-000000000098','TESTE OUTRO');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000097","role":"authenticated"}',true);
select public.salvar_nota('{"id":"30000000-0000-4000-8000-000000000097","obra_id":"10000000-0000-4000-8000-000000000097","local_id":"20000000-0000-4000-8000-000000000097","numero":"TESTE","data":"2026-10-12","fck":30,"volume":1}',null);
select public.salvar_mapa('{"id":"40000000-0000-4000-8000-000000000097","obra_id":"10000000-0000-4000-8000-000000000097","local_id":"20000000-0000-4000-8000-000000000097","peca":"Laje","desde":"2026-10-12","ate":"2026-10-12","imagem":"data:image/png;base64,YQ==","itens":[{"nota_id":"30000000-0000-4000-8000-000000000097","betoneira":"B1","inicio":"23:50","termino":"00:20"}]}',null);
do $$ declare m jsonb; begin
 select to_jsonb(mapas) into m from public.mapas where id='40000000-0000-4000-8000-000000000097';
 if not exists(select 1 from public.mapa_itens where mapa_id=(m->>'id')::uuid and inicio='23:50') then raise exception 'Item não salvo';end if;
 begin perform public.salvar_mapa(m,9);raise exception 'Conflito ignorado';exception when serialization_failure then null;end;
 begin perform public.salvar_mapa(m||'{"local_id":"20000000-0000-4000-8000-000000000098"}',1);raise exception 'Obra/local misturados';exception when foreign_key_violation then null;end;
 begin perform public.salvar_mapa(m||'{"desde":"2026-10-13","ate":"2026-10-12"}',1);raise exception 'Período inválido';exception when check_violation then null;end;
 begin perform public.salvar_mapa(m||'{"imagem":"data:image/svg+xml;base64,YQ=="}',1);raise exception 'SVG aceito';exception when check_violation then null;end;
 begin perform public.salvar_mapa(m||'{"desde":"2026-10-13","ate":"2026-10-13","itens":[{"nota_id":"30000000-0000-4000-8000-000000000097"}]}',1);raise exception 'Nota fora do período';exception when serialization_failure then null;end;
 if (select versao from public.mapas where id=(m->>'id')::uuid)<>1 then raise exception 'Falha não foi atômica';end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform id from public.mapas;raise exception 'Anônimo leu mapas';exception when insufficient_privilege then null;end;
 begin perform nota_id from public.mapa_itens;raise exception 'Anônimo leu itens';exception when insufficient_privilege then null;end;
 begin perform public.salvar_mapa('{}',null);raise exception 'Anônimo gravou';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from public.acessos_obras where usuario_id='00000000-0000-4000-8000-000000000097' and obra_id='10000000-0000-4000-8000-000000000097';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.mapas where id='40000000-0000-4000-8000-000000000097') then raise exception 'Sem vínculo leu';end if;
 begin perform public.excluir_mapa('40000000-0000-4000-8000-000000000097',1);raise exception 'Sem vínculo excluiu';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.acessos_obras(usuario_id,obra_id) values ('00000000-0000-4000-8000-000000000097','10000000-0000-4000-8000-000000000097');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000098","role":"authenticated"}',true);
do $$ begin
 if not exists(select 1 from public.mapas where id='40000000-0000-4000-8000-000000000097') then raise exception 'Cliente não consulta';end if;
 begin perform public.excluir_mapa('40000000-0000-4000-8000-000000000097',1);raise exception 'Cliente excluiu';exception when insufficient_privilege then null;end;
 begin perform public.salvar_mapa('{}',null);raise exception 'Cliente gravou';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.mapas where id='40000000-0000-4000-8000-000000000097') or exists(select 1 from public.mapa_itens where mapa_id='40000000-0000-4000-8000-000000000097') then raise exception 'Pendente leu';end if;
 begin perform public.excluir_mapa('40000000-0000-4000-8000-000000000097',1);raise exception 'Pendente excluiu';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000097","role":"authenticated"}',true);
select public.excluir_mapa('40000000-0000-4000-8000-000000000097',1);
do $$ begin
 if not exists(select 1 from public.notas where id='30000000-0000-4000-8000-000000000097') then raise exception 'Mapa apagou nota';end if;
 if exists(select 1 from public.mapa_itens where mapa_id='40000000-0000-4000-8000-000000000097') then raise exception 'Itens órfãos';end if;
end $$;
select public.salvar_mapa('{"id":"40000000-0000-4000-8000-000000000097","obra_id":"10000000-0000-4000-8000-000000000097","local_id":"20000000-0000-4000-8000-000000000097","peca":"Laje","desde":"2026-10-12","ate":"2026-10-12"}',null);
select public.excluir_obra('10000000-0000-4000-8000-000000000097','TESTE MAPA');
reset role;
do $$ begin
 if exists(select 1 from public.mapas where id='40000000-0000-4000-8000-000000000097') then raise exception 'Obra deixou mapa';end if;
 if not exists(select 1 from public.obras where id='10000000-0000-4000-8000-000000000098') then raise exception 'Outra obra apagada';end if;
 if has_table_privilege('anon','public.mapas','SELECT') or has_table_privilege('authenticated','public.mapas','DELETE') or has_table_privilege('authenticated','public.mapa_itens','INSERT') then raise exception 'Grant aberto';end if;
end $$;
select 'VERIFICADO: mapas, itens, versão, atomicidade, perfis, isolamento e exclusão em cascata' as resultado;
rollback;
