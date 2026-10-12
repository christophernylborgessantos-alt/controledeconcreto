create or replace function public.esperado_fck_nota() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 select round(n.fck * case when new.idade=7 then 0.7 else 1 end,6) into new.esperado
 from public.notas n where n.id=new.nota_id and n.obra_id=new.obra_id;
 if not found then raise exception 'Nota do ensaio não encontrada.' using errcode='23503'; end if;
 return new;
end $$;

drop trigger esperado_fck_nota on public.ensaios;
create trigger esperado_fck_nota before insert or update of esperado,nota_id,obra_id,idade on public.ensaios
for each row execute function public.esperado_fck_nota();

create or replace function public.atualizar_esperado_fck() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.ensaios set esperado=round(new.fck * case when idade=7 then 0.7 else 1 end,6)
 where nota_id=new.id and obra_id=new.obra_id
 and esperado is distinct from round(new.fck * case when idade=7 then 0.7 else 1 end,6);
 return new;
end $$;

update public.ensaios e set esperado=round(n.fck * case when e.idade=7 then 0.7 else 1 end,6)
from public.notas n where e.nota_id=n.id and e.obra_id=n.obra_id
and e.esperado is distinct from round(n.fck * case when e.idade=7 then 0.7 else 1 end,6);
revoke all on function public.esperado_fck_nota(),public.atualizar_esperado_fck() from public,anon,authenticated;
