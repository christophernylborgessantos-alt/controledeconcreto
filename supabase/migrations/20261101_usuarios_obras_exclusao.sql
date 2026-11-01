-- Seleção administrativa de obras e exclusão sem remover histórico.
begin;
create or replace function public.vincular_perfil() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.ativo and new.gestor_usuarios then
  insert into public.acessos_obras(usuario_id,obra_id) select new.id,id from public.obras on conflict do nothing;
 end if;
 return new;
end $$;
create or replace function public.vincular_obra() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.acessos_obras(usuario_id,obra_id)
 select id,new.id from public.profiles where ativo and (gestor_usuarios or id=auth.uid());
 return new;
end $$;
create function public.administrar_obras(p_gestor uuid,p_id uuid,p_obras uuid[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Mesma ordem de locks em operações administrativas concorrentes.
 perform 1 from public.profiles where id in (p_gestor,p_id) order by id for update;
 if not exists(select 1 from public.profiles where id=p_gestor and ativo and gestor_usuarios) then raise exception 'Acesso negado.' using errcode='42501'; end if;
 if p_id=p_gestor or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_id and not p.gestor_usuarios and u.deleted_at is null) then raise exception 'Conta protegida ou inexistente.' using errcode='42501'; end if;
 if p_obras is null or exists(select 1 from unnest(p_obras) v where v is null or not exists(select 1 from public.obras o where o.id=v)) then raise exception 'Obras inválidas.' using errcode='23514'; end if;
 delete from public.acessos_obras where usuario_id=p_id;
 insert into public.acessos_obras(usuario_id,obra_id) select p_id,v from unnest(p_obras) v group by v;
end $$;
create function public.preparar_exclusao_usuario(p_gestor uuid,p_id uuid,p_nome text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id in (p_gestor,p_id) order by id for update;
 if not exists(select 1 from public.profiles where id=p_gestor and ativo and gestor_usuarios) then raise exception 'Acesso negado.' using errcode='42501'; end if;
 if p_id=p_gestor or not exists(select 1 from public.profiles where id=p_id and not gestor_usuarios and trim(nome)=trim(p_nome) and trim(p_nome)<>'') then raise exception 'Confira o nome. A conta gestora é protegida.' using errcode='42501'; end if;
 update public.profiles set ativo=false where id=p_id;
 delete from public.acessos_obras where usuario_id=p_id;
 -- Nenhuma linha de obras, locais, notas, ensaios ou mapas é excluída.
end $$;
-- Impede que a rotina anterior reative uma identidade já excluída do Auth.
create or replace function public.administrar_perfil(p_gestor uuid,p_id uuid,p_nome text,p_role text,p_ativo boolean)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id in (p_gestor,p_id) order by id for update;
 if not exists(select 1 from public.profiles where id=p_gestor and ativo and gestor_usuarios) then raise exception 'Acesso negado.' using errcode='42501'; end if;
 if p_id=p_gestor or not exists(select 1 from auth.users where id=p_id and deleted_at is null) then raise exception 'Conta protegida ou excluída.' using errcode='42501'; end if;
 if p_role is null or p_role not in ('Christopher','Analista','Cliente') or p_ativo is null then raise exception 'Categoria ou situação inválida.' using errcode='23514'; end if;
 update public.profiles set nome=trim(coalesce(p_nome,'')),role=p_role,ativo=p_ativo where id=p_id and not gestor_usuarios;
 if not found then raise exception 'Conta não encontrada.' using errcode='42501'; end if;
 return p_id;
end $$;
revoke all on function public.administrar_obras(uuid,uuid,uuid[]),public.preparar_exclusao_usuario(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.administrar_obras(uuid,uuid,uuid[]),public.preparar_exclusao_usuario(uuid,uuid,text) to service_role;
grant select on public.obras,public.acessos_obras to service_role;
create or replace function public.acessa_obra(p_obra uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.acessos_obras a join public.profiles p on p.id=a.usuario_id join auth.users u on u.id=p.id
 where p.id=(select auth.uid()) and p.ativo and u.deleted_at is null and a.obra_id=p_obra);
$$;
create or replace function public.perfil_editor() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=(select auth.uid()) and p.ativo and u.deleted_at is null and p.role in ('Christopher','Analista'));
$$;
commit;
