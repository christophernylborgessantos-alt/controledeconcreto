create table public.ultimo_upload_laudo (
  obra_id uuid primary key references public.obras(id) on delete cascade,
  arquivo text not null check (char_length(arquivo) between 1 and 512),
  origem text not null check (origem in ('drive', 'local')),
  confirmado_em timestamptz not null,
  notas_atualizadas integer not null check (notas_atualizadas between 1 and 500)
);

alter table public.ultimo_upload_laudo enable row level security;
revoke all on public.ultimo_upload_laudo from public, anon, authenticated;
grant select on public.ultimo_upload_laudo to authenticated;
create policy ultimo_upload_laudo_leitura on public.ultimo_upload_laudo
  for select to authenticated using (public.perfil_editor() and public.acessa_obra(obra_id));

create function public.importar_laudo(
  p_obra uuid, p_linhas jsonb, p_arquivo text, p_origem text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  resultado jsonb;
  registro public.ultimo_upload_laudo%rowtype;
begin
  resultado := public.importar_resultados_ensaios(p_obra, p_linhas);

  insert into public.ultimo_upload_laudo (obra_id, arquivo, origem, confirmado_em, notas_atualizadas)
  values (p_obra, trim(p_arquivo), p_origem, clock_timestamp(), (resultado->>'atualizadas')::integer)
  on conflict (obra_id) do update set
    arquivo = excluded.arquivo,
    origem = excluded.origem,
    confirmado_em = excluded.confirmado_em,
    notas_atualizadas = excluded.notas_atualizadas
  returning * into registro;

  return to_jsonb(registro);
end;
$$;

revoke all on function public.importar_laudo(uuid,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.importar_laudo(uuid,jsonb,text,text) to authenticated;
