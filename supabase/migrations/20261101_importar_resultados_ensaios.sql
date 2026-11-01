-- Atualiza somente resultados; null significa preservar, nunca apagar.
create function public.importar_resultados_ensaios(p_obra uuid,p_linhas jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l jsonb; n public.notas%rowtype; i integer; r jsonb; v jsonb; x numeric; quantidade integer:=0;
begin
 if not public.perfil_editor() or not public.acessa_obra(p_obra) then raise exception 'Acesso negado.' using errcode='42501';end if;
 if jsonb_typeof(p_linhas) is distinct from 'array' then raise exception 'Informe um lote.' using errcode='23514';end if;
 if jsonb_array_length(p_linhas) not between 1 and 500 or octet_length(p_linhas::text)>2000000 then raise exception 'Limite de 500 notas.' using errcode='23514';end if;
 if exists(select 1 from jsonb_array_elements(p_linhas) a group by a->>'id' having count(*)>1) then raise exception 'Nota repetida.' using errcode='23514';end if;
 perform id from public.obras where id=p_obra for no key update;
 if not found then raise exception 'Obra removida.' using errcode='40001';end if;
 for l in select value from jsonb_array_elements(p_linhas) order by value->>'id' loop
  select * into n from public.notas where id=(l->>'id')::uuid and obra_id=p_obra and numero=l->>'numero' for update;
  if not found or n.versao is distinct from (l->>'versao')::integer then raise exception 'Nota alterada ou removida. Recarregue.' using errcode='40001';end if;
  if n.nao_estrutural then raise exception 'Peça não estrutural.' using errcode='23514';end if;
  if jsonb_typeof(l->'resultados') is distinct from 'object' then raise exception 'Resultados inválidos.' using errcode='23514';end if;
  foreach i in array array[7,28,63] loop
   r:=l->'resultados'->i::text;
   if jsonb_typeof(r) is distinct from 'array' then raise exception 'Informe cada idade.' using errcode='23514';end if;
   if jsonb_array_length(r)<>2 then raise exception 'Informe duas posições por idade.' using errcode='23514';end if;
   for v in select value from jsonb_array_elements(r) loop
    if jsonb_typeof(v)='null' then continue;end if;
    if jsonb_typeof(v)<>'number' then raise exception 'Resultado deve ser numérico.' using errcode='23514';end if;
    x:=v::text::numeric;
    if x<0 or x>=1000000000 or x<>round(x,6) then raise exception 'Resultado inválido.' using errcode='23514';end if;
   end loop;
   update public.ensaios set resultado_1=coalesce((r->>0)::numeric,resultado_1),resultado_2=coalesce((r->>1)::numeric,resultado_2) where nota_id=n.id and obra_id=p_obra and idade=i;
   if not found then raise exception 'Ensaio ausente.' using errcode='23514';end if;
  end loop;
  update public.notas set versao=versao+1,updated_at=now() where id=n.id;
  quantidade:=quantidade+1;
 end loop;
 return jsonb_build_object('atualizadas',quantidade);
end $$;
revoke all on function public.importar_resultados_ensaios(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.importar_resultados_ensaios(uuid,jsonb) to authenticated;
