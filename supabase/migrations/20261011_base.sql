create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nome text not null default '',
 role text not null default 'Cliente' check (role in ('Christopher','Analista','Cliente')),
 ativo boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.obras (
 id uuid primary key default gen_random_uuid(),
 nome text not null check (length(trim(nome))>0),
 tipo text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.acessos_obras (
 usuario_id uuid not null references public.profiles(id) on delete cascade,
 obra_id uuid not null references public.obras(id),
 primary key(usuario_id,obra_id)
);
create table public.locais (
 id uuid primary key default gen_random_uuid(),
 obra_id uuid not null references public.obras(id),
 nome text not null check (length(trim(nome))>0),
 teorico numeric check (teorico>0 and teorico<1000000000 and scale(teorico)<=6),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,obra_id)
);
create table public.notas (
 id uuid primary key default gen_random_uuid(),
 obra_id uuid not null references public.obras(id),
 local_id uuid not null,
 numero text not null check (numero=trim(numero) and length(numero)>0),
 data date not null,
 fck numeric not null check(fck>0 and fck<1000000000 and scale(fck)<=6),
 slump text not null default '',
 volume numeric not null check(volume>0 and volume<1000000000 and scale(volume)<=6),
 observacoes text not null default '',
 versao integer not null default 1 check(versao>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(obra_id,numero), unique(id,obra_id),
 foreign key(local_id,obra_id) references public.locais(id,obra_id)
);
create table public.ensaios (
 id uuid primary key default gen_random_uuid(),
 obra_id uuid not null,
 nota_id uuid not null,
 idade integer not null check(idade in (7,28,63)),
 esperado numeric check(esperado>=0 and esperado<1000000000 and scale(esperado)<=6),
 resultado_1 numeric check(resultado_1>=0 and resultado_1<1000000000 and scale(resultado_1)<=6),
 resultado_2 numeric check(resultado_2>=0 and resultado_2<1000000000 and scale(resultado_2)<=6),
 unique(nota_id,idade),
 foreign key(nota_id,obra_id) references public.notas(id,obra_id)
);
create index acessos_obras_obra_idx on public.acessos_obras(obra_id);
create index locais_obra_idx on public.locais(obra_id);
create index notas_obra_data_idx on public.notas(obra_id,data);
create index notas_local_obra_idx on public.notas(local_id,obra_id);
create index ensaios_obra_idx on public.ensaios(obra_id);

create function public.perfil_editor() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and ativo and role in ('Christopher','Analista'));
$$;
create function public.acessa_obra(p_obra uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.acessos_obras a join public.profiles p on p.id=a.usuario_id
 where p.id=(select auth.uid()) and p.ativo and a.obra_id=p_obra);
$$;
create function public.novo_perfil() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id);
 return new;
end $$;
create trigger novo_usuario after insert on auth.users for each row execute function public.novo_perfil();

create function public.vincular_perfil() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.ativo and (tg_op='INSERT' or not old.ativo) then
  insert into public.acessos_obras(usuario_id,obra_id) select new.id,id from public.obras on conflict do nothing;
 end if;
 return new;
end $$;
create trigger perfil_ativado after insert or update of ativo on public.profiles for each row execute function public.vincular_perfil();
create function public.vincular_obra() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.acessos_obras(usuario_id,obra_id) select id,new.id from public.profiles where ativo;
 return new;
end $$;
create trigger obra_criada after insert on public.obras for each row execute function public.vincular_obra();

alter table public.profiles enable row level security;
alter table public.obras enable row level security;
alter table public.acessos_obras enable row level security;
alter table public.locais enable row level security;
alter table public.notas enable row level security;
alter table public.ensaios enable row level security;
revoke all on public.profiles,public.obras,public.acessos_obras,public.locais,public.notas,public.ensaios from anon,authenticated;
grant select on public.profiles,public.obras,public.acessos_obras,public.locais,public.notas,public.ensaios to authenticated;
grant insert on public.obras,public.locais to authenticated;
grant update(nome,tipo,updated_at) on public.obras to authenticated;
grant update(nome,teorico,updated_at) on public.locais to authenticated;
create policy perfil_proprio on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy vinculos_proprios on public.acessos_obras for select to authenticated using(usuario_id=(select auth.uid()));
create policy obras_leitura on public.obras for select to authenticated using(public.acessa_obra(id));
create policy obras_criacao on public.obras for insert to authenticated with check((select public.perfil_editor()));
create policy obras_edicao on public.obras for update to authenticated using(public.acessa_obra(id) and (select public.perfil_editor())) with check(public.acessa_obra(id) and (select public.perfil_editor()));
create policy locais_leitura on public.locais for select to authenticated using(public.acessa_obra(obra_id));
create policy locais_criacao on public.locais for insert to authenticated with check(public.acessa_obra(obra_id) and (select public.perfil_editor()));
create policy locais_edicao on public.locais for update to authenticated using(public.acessa_obra(obra_id) and (select public.perfil_editor())) with check(public.acessa_obra(obra_id) and (select public.perfil_editor()));
create policy notas_leitura on public.notas for select to authenticated using(public.acessa_obra(obra_id));
create policy ensaios_leitura on public.ensaios for select to authenticated using(public.acessa_obra(obra_id));

-- Somente RPCs podem escrever notas/ensaios: garante transação e versão.
create function public.salvar_nota(p_nota jsonb, p_versao integer default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid := (p_nota->>'id')::uuid; v_obra uuid := (p_nota->>'obra_id')::uuid; v_idade integer;
begin
 if not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso de escrita negado.' using errcode='42501'; end if;
 if p_versao is null then
  insert into public.notas(id,obra_id,local_id,numero,data,fck,slump,volume)
  values(v_id,v_obra,(p_nota->>'local_id')::uuid,trim(p_nota->>'numero'),(p_nota->>'data')::date,
  (p_nota->>'fck')::numeric,coalesce(p_nota->>'slump',''),(p_nota->>'volume')::numeric);
  foreach v_idade in array array[7,28,63] loop
   insert into public.ensaios(obra_id,nota_id,idade) values(v_obra,v_id,v_idade);
  end loop;
 else
  update public.notas set local_id=(p_nota->>'local_id')::uuid,numero=trim(p_nota->>'numero'),
   data=(p_nota->>'data')::date,fck=(p_nota->>'fck')::numeric,slump=coalesce(p_nota->>'slump',''),
   volume=(p_nota->>'volume')::numeric,versao=versao+1,updated_at=now()
   where id=v_id and obra_id=v_obra and versao=p_versao;
  if not found then raise exception 'Esta nota foi alterada. Recarregue antes de salvar.' using errcode='40001'; end if;
 end if;
 return v_id;
end $$;
create function public.salvar_ensaios(p_id uuid,p_versao integer,p_ensaios jsonb,p_observacoes text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_obra uuid; v_idade integer; v_e jsonb;
begin
 select obra_id into v_obra from public.notas where id=p_id;
 if v_obra is null or not public.perfil_editor() or not public.acessa_obra(v_obra) then raise exception 'Acesso de escrita negado.' using errcode='42501'; end if;
 update public.notas set observacoes=coalesce(p_observacoes,''),versao=versao+1,updated_at=now() where id=p_id and versao=p_versao;
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
revoke all on function public.perfil_editor(),public.acessa_obra(uuid),public.novo_perfil(),public.vincular_perfil(),public.vincular_obra(),public.salvar_nota(jsonb,integer),public.salvar_ensaios(uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.perfil_editor(),public.acessa_obra(uuid),public.salvar_nota(jsonb,integer),public.salvar_ensaios(uuid,integer,jsonb,text) to authenticated;
