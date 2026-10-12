create function public.importar_notas(p_obra uuid,p_linhas jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_linha jsonb; v_numero text; v_nome text; v_local uuid; v_id uuid;
 v_locais integer; v_novo_local boolean; v_criadas integer:=0; v_ignoradas integer:=0;
 v_locais_criados integer:=0; v_ignoradas_lista jsonb:='[]'::jsonb;
begin
 if not public.perfil_editor() or not public.acessa_obra(p_obra) then
  raise exception 'Acesso de importação negado.' using errcode='42501';
 end if;
 if jsonb_typeof(p_linhas) is distinct from 'array' then
  raise exception 'Informe um lote de linhas.' using errcode='23514';
 end if;
 if jsonb_array_length(p_linhas) not between 1 and 500
 or octet_length(p_linhas::text)>2000000 then
  raise exception 'Importe entre 1 e 500 linhas válidas.' using errcode='23514';
 end if;
 -- Serializa importações da obra e impede excluir a obra durante o lote.
 perform id from public.obras where id=p_obra for no key update;
 if not found then raise exception 'Obra removida. Recarregue.' using errcode='40001';end if;
 for v_linha in select value from jsonb_array_elements(p_linhas) loop
  v_numero:=trim(v_linha->>'numero');
  if v_numero is null or length(v_numero) not between 1 and 120 then
   raise exception 'Informe a NF em cada linha.' using errcode='23514';
  end if;
  if exists(select 1 from public.notas where obra_id=p_obra and numero=v_numero) then
   v_ignoradas:=v_ignoradas+1;
   v_ignoradas_lista:=v_ignoradas_lista||jsonb_build_array(jsonb_build_object('linha',v_linha->'linha','numero',v_numero));
   continue;
  end if;
  begin
   v_nome:=regexp_replace(trim(v_linha->>'local'),'[[:space:]]+',' ','g');
   if v_nome is null or length(v_nome) not between 1 and 300 then raise exception 'Informe o local.' using errcode='23514';end if;
   select count(*) into v_locais from public.locais where obra_id=p_obra
    and lower(regexp_replace(trim(nome),'[[:space:]]+',' ','g'))=lower(v_nome);
   if v_locais>1 then raise exception 'Há locais com nomes repetidos. Corrija o cadastro antes de importar.' using errcode='23514';end if;
   v_novo_local:=v_locais=0;
   if v_novo_local then
    insert into public.locais(obra_id,nome) values(p_obra,v_nome) returning id into v_local;
   else
    select id into v_local from public.locais where obra_id=p_obra
     and lower(regexp_replace(trim(nome),'[[:space:]]+',' ','g'))=lower(v_nome) for key share;
   end if;
   v_id:=gen_random_uuid();
   perform public.salvar_nota(v_linha||jsonb_build_object('id',v_id,'obra_id',p_obra,'local_id',v_local,'numero',v_numero),null);
   perform public.salvar_ensaios(v_id,1,coalesce(v_linha->'ensaios','{}'::jsonb)||jsonb_build_object('nao_estrutural',coalesce((v_linha->>'nao_estrutural')::boolean,false)),coalesce(v_linha->>'observacoes',''));
   v_criadas:=v_criadas+1;
   if v_novo_local then v_locais_criados:=v_locais_criados+1;end if;
  exception when unique_violation then
   -- Uma NF criada por outra sessão no intervalo deve ser preservada.
   if not exists(select 1 from public.notas where obra_id=p_obra and numero=v_numero) then raise;end if;
   v_ignoradas:=v_ignoradas+1;
   v_ignoradas_lista:=v_ignoradas_lista||jsonb_build_array(jsonb_build_object('linha',v_linha->'linha','numero',v_numero));
  end;
 end loop;
 return jsonb_build_object('criadas',v_criadas,'ignoradas',v_ignoradas,'locais_criados',v_locais_criados,'nfs_ignoradas',v_ignoradas_lista);
end $$;
revoke all on function public.importar_notas(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.importar_notas(uuid,jsonb) to authenticated;
