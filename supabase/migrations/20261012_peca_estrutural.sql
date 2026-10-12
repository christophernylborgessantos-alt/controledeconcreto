alter table public.notas add column peca_estrutural text not null default '' check(length(peca_estrutural)<=160 and peca_estrutural=trim(peca_estrutural));
create or replace function public.salvar_nota(p_nota jsonb, p_versao integer default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid := (p_nota->>'id')::uuid; v_obra uuid := (p_nota->>'obra_id')::uuid; v_idade integer;
begin
 if not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso de escrita negado.' using errcode='42501'; end if;
 if p_versao is null then
  insert into public.notas(id,obra_id,local_id,numero,data,fck,slump,volume,peca_estrutural)
  values(v_id,v_obra,(p_nota->>'local_id')::uuid,trim(p_nota->>'numero'),(p_nota->>'data')::date,
  (p_nota->>'fck')::numeric,coalesce(p_nota->>'slump',''),(p_nota->>'volume')::numeric,trim(coalesce(p_nota->>'peca_estrutural','')));
  foreach v_idade in array array[7,28,63] loop
   insert into public.ensaios(obra_id,nota_id,idade) values(v_obra,v_id,v_idade);
  end loop;
 else
  update public.notas set local_id=(p_nota->>'local_id')::uuid,numero=trim(p_nota->>'numero'),
   data=(p_nota->>'data')::date,fck=(p_nota->>'fck')::numeric,slump=coalesce(p_nota->>'slump',''),
   peca_estrutural=case when p_nota ? 'peca_estrutural' then trim(coalesce(p_nota->>'peca_estrutural','')) else peca_estrutural end,
   volume=(p_nota->>'volume')::numeric,versao=versao+1,updated_at=now()
   where id=v_id and obra_id=v_obra and versao=p_versao;
  if not found then raise exception 'Esta nota foi alterada. Recarregue antes de salvar.' using errcode='40001'; end if;
 end if;
 return v_id;
end $$;

revoke all on function public.salvar_nota(jsonb,integer) from public,anon,authenticated;
grant execute on function public.salvar_nota(jsonb,integer) to authenticated;
