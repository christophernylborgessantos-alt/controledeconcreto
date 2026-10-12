alter table public.profiles add column gestor_usuarios boolean not null default false;
alter table public.profiles add constraint gestor_ativo check(not gestor_usuarios or (ativo and role='Christopher'));
create unique index um_gestor_usuarios on public.profiles ((true)) where gestor_usuarios;

create function public.administrar_perfil(p_gestor uuid,p_id uuid,p_nome text,p_role text,p_ativo boolean)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_gestor and ativo and gestor_usuarios) then
  raise exception 'Somente a conta gestora pode administrar usuários.' using errcode='42501';
 end if;
 if p_id=p_gestor then raise exception 'Sua própria conta não pode ser alterada nesta tela.' using errcode='42501'; end if;
 if p_role is null or p_role not in ('Christopher','Analista','Cliente') or p_ativo is null then
  raise exception 'Categoria ou situação inválida.' using errcode='23514';
 end if;
 update public.profiles set nome=trim(coalesce(p_nome,'')),role=p_role,ativo=p_ativo
 where id=p_id and not gestor_usuarios;
 if not found then raise exception 'Usuário não encontrado ou conta protegida.' using errcode='42501'; end if;
 return p_id;
end $$;
revoke all on function public.administrar_perfil(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.administrar_perfil(uuid,uuid,text,text,boolean) to service_role;
grant select on public.profiles to service_role;
