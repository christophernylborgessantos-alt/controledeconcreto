create function public.excluir_nota(p_id uuid,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_obra uuid; v_versao integer;
begin
 if not public.perfil_editor() then raise exception 'Acesso de exclusão negado.' using errcode='42501'; end if;
 select obra_id,versao into v_obra,v_versao from public.notas where id=p_id for update;
 if v_obra is null or not public.acessa_obra(v_obra) then raise exception 'Acesso de exclusão negado.' using errcode='42501'; end if;
 if p_versao is null or p_versao<>v_versao then raise exception 'Esta nota foi alterada. Recarregue antes de excluir.' using errcode='40001'; end if;
 delete from public.ensaios where nota_id=p_id;
 delete from public.notas where id=p_id;
 return p_id;
end $$;
revoke all on function public.excluir_nota(uuid,integer) from public,anon,authenticated;
grant execute on function public.excluir_nota(uuid,integer) to authenticated;
