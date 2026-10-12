-- Executar via MCP antes/depois da migration: falha se faltar uma tranca.
do $$
declare t text;
begin
  foreach t in array array['profiles','obras','acessos_obras','locais','notas','ensaios'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relrowsecurity) then
      raise exception 'RLS ausente: %',t;
    end if;
    if has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'anon possui privilégio: %',t;
    end if;
    if has_table_privilege('authenticated','public.'||t,'DELETE') then
      raise exception 'authenticated pode excluir: %',t;
    end if;
  end loop;
end $$;
