create table public.mapas (
 id uuid primary key default gen_random_uuid(),
 obra_id uuid not null references public.obras(id) on delete cascade,
 local_id uuid not null,
 peca text not null check(length(trim(peca)) between 1 and 160),
 desde date not null,
 ate date not null check(ate>=desde),
 imagem text check(imagem is null or (length(imagem)<=2800000 and imagem ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$')),
 versao integer not null default 1 check(versao>0),
 updated_at timestamptz not null default now(),
 unique(id,obra_id),
 foreign key(local_id,obra_id) references public.locais(id,obra_id) on delete cascade
);
create index mapas_obra_idx on public.mapas(obra_id);
create table public.mapa_itens (
 mapa_id uuid not null,
 obra_id uuid not null,
 nota_id uuid not null,
 betoneira text not null default '' check(length(betoneira)<=100),
 inicio text not null default '' check(inicio='' or inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 termino text not null default '' check(termino='' or termino ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 primary key(mapa_id,nota_id),
 foreign key(mapa_id,obra_id) references public.mapas(id,obra_id) on delete cascade,
 foreign key(nota_id,obra_id) references public.notas(id,obra_id) on delete cascade
);
create index mapa_itens_nota_idx on public.mapa_itens(nota_id,obra_id);
alter table public.mapas enable row level security;
alter table public.mapa_itens enable row level security;
revoke all on public.mapas,public.mapa_itens from public,anon,authenticated;
grant select on public.mapas,public.mapa_itens to authenticated;
create policy mapas_leitura on public.mapas for select to authenticated using(public.acessa_obra(obra_id));
create policy mapa_itens_leitura on public.mapa_itens for select to authenticated using(public.acessa_obra(obra_id));

create function public.salvar_mapa(p_mapa jsonb,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid:=coalesce((p_mapa->>'id')::uuid,gen_random_uuid());
 v_obra uuid:=(p_mapa->>'obra_id')::uuid; v_local uuid:=(p_mapa->>'local_id')::uuid;
 v_desde date:=(p_mapa->>'desde')::date; v_ate date:=(p_mapa->>'ate')::date;
 v_item jsonb;
begin
 if not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso negado.' using errcode='42501';end if;
 perform id from public.obras where id=v_obra for update;
 if not found then raise exception 'Obra removida.' using errcode='40001';end if;
 if p_versao is null then
  insert into public.mapas(id,obra_id,local_id,peca,desde,ate,imagem)
  values(v_id,v_obra,v_local,trim(p_mapa->>'peca'),v_desde,v_ate,p_mapa->>'imagem');
 else
  update public.mapas set local_id=v_local,peca=trim(p_mapa->>'peca'),desde=v_desde,ate=v_ate,imagem=p_mapa->>'imagem',versao=versao+1,updated_at=now()
  where id=v_id and obra_id=v_obra and versao=p_versao;
  if not found then raise exception 'Mapa alterado. Recarregue.' using errcode='40001';end if;
 end if;
 delete from public.mapa_itens where mapa_id=v_id;
 for v_item in select value from jsonb_array_elements(coalesce(p_mapa->'itens','[]'::jsonb)) loop
  if not exists(select 1 from public.notas where id=(v_item->>'nota_id')::uuid and obra_id=v_obra and local_id=v_local and data between v_desde and v_ate) then
   raise exception 'Nota fora do mapa. Recarregue.' using errcode='40001';
  end if;
  insert into public.mapa_itens(mapa_id,obra_id,nota_id,betoneira,inicio,termino)
  values(v_id,v_obra,(v_item->>'nota_id')::uuid,coalesce(v_item->>'betoneira',''),coalesce(v_item->>'inicio',''),coalesce(v_item->>'termino',''));
 end loop;
 return v_id;
end $$;
create function public.excluir_mapa(p_id uuid,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_obra uuid;
begin
 select obra_id into v_obra from public.mapas where id=p_id;
 if not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso negado.' using errcode='42501';end if;
 perform id from public.obras where id=v_obra for update;
 delete from public.mapas where id=p_id and obra_id=v_obra and versao=p_versao;
 if not found then raise exception 'Mapa alterado. Recarregue.' using errcode='40001';end if;
 return p_id;
end $$;
revoke all on function public.salvar_mapa(jsonb,integer),public.excluir_mapa(uuid,integer) from public,anon,authenticated;
grant execute on function public.salvar_mapa(jsonb,integer),public.excluir_mapa(uuid,integer) to authenticated;
