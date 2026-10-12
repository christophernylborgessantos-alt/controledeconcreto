create function public.excluir_obra(p_id uuid,p_nome text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_nome text;
begin
 if not public.perfil_editor() then raise exception 'Acesso de exclusão negado.' using errcode='42501'; end if;
 select nome into v_nome from public.obras where id=p_id for update;
 if not found or not public.acessa_obra(p_id) then raise exception 'Acesso de exclusão negado.' using errcode='42501'; end if;
 if p_nome is distinct from v_nome then raise exception 'Esta obra foi alterada. Recarregue antes de excluir.' using errcode='40001'; end if;
 -- Salvar ensaios também bloqueia a nota antes de seus resultados.
 perform id from public.notas where obra_id=p_id order by id for update;
 delete from public.ensaios where obra_id=p_id;
 delete from public.notas where obra_id=p_id;
 delete from public.locais where obra_id=p_id;
 delete from public.acessos_obras where obra_id=p_id;
 delete from public.obras where id=p_id;
 return p_id;
end $$;
revoke all on function public.excluir_obra(uuid,text) from public,anon,authenticated;
grant execute on function public.excluir_obra(uuid,text) to authenticated;
