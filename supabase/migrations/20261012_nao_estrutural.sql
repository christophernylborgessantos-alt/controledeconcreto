alter table public.notas add column nao_estrutural boolean not null default false;

create or replace function public.salvar_ensaios(p_id uuid,p_versao integer,p_ensaios jsonb,p_observacoes text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_obra uuid; v_idade integer; v_e jsonb;
begin
 select obra_id into v_obra from public.notas where id=p_id;
 if v_obra is null or not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso de escrita negado.' using errcode='42501'; end if;
 update public.notas set nao_estrutural=coalesce((p_ensaios->>'nao_estrutural')::boolean,nao_estrutural),observacoes=coalesce(p_observacoes,''),versao=versao+1,updated_at=now() where id=p_id and versao=p_versao;
 if not found then raise exception 'Esta nota foi alterada. Recarregue antes de salvar.' using errcode='40001'; end if;
 if p_ensaios is null or jsonb_typeof(p_ensaios)<>'object' then raise exception 'Informe as três idades.'; end if;
 foreach v_idade in array array[7,28,63] loop
  v_e:=p_ensaios->v_idade::text;
  if v_e is null or jsonb_typeof(v_e->'resultados') is distinct from 'array' or jsonb_array_length(v_e->'resultados')<>2 then raise exception 'Informe dois resultados por idade.'; end if;
  update public.ensaios set esperado=(v_e->>'esperado')::numeric,resultado_1=(v_e->'resultados'->>0)::numeric,resultado_2=(v_e->'resultados'->>1)::numeric where nota_id=p_id and idade=v_idade;
  if not found then raise exception 'Idade de ensaio ausente.'; end if;
 end loop;
 return p_id;
end $$;

revoke all on function public.salvar_ensaios(uuid,integer,jsonb,text) from public,anon;
grant execute on function public.salvar_ensaios(uuid,integer,jsonb,text) to authenticated;
