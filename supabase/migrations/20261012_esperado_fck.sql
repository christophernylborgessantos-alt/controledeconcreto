create function public.esperado_fck_nota() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 select n.fck into new.esperado from public.notas n where n.id=new.nota_id and n.obra_id=new.obra_id;
 if not found then raise exception 'Nota do ensaio não encontrada.' using errcode='23503'; end if;
 return new;
end $$;
create trigger esperado_fck_nota before insert or update of esperado,nota_id,obra_id on public.ensaios
for each row execute function public.esperado_fck_nota();

create function public.atualizar_esperado_fck() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.ensaios set esperado=new.fck where nota_id=new.id and obra_id=new.obra_id and esperado is distinct from new.fck;
 return new;
end $$;
create trigger atualizar_esperado_fck after update of fck on public.notas
for each row when (old.fck is distinct from new.fck) execute function public.atualizar_esperado_fck();

update public.ensaios e set esperado=n.fck from public.notas n
where e.nota_id=n.id and e.obra_id=n.obra_id and e.esperado is distinct from n.fck;
revoke all on function public.esperado_fck_nota(),public.atualizar_esperado_fck() from public,anon,authenticated;
