import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const pasta=new URL('../supabase/migrations/',import.meta.url);
const sql=readdirSync(pasta).filter(n=>n.endsWith('.sql')).sort().map(n=>readFileSync(new URL(n,pasta),'utf8')).join('\n').toLowerCase();
assert.ok(!/grant\s+all\b/.test(sql),'GRANT ALL não permitido.');
assert.ok(!/grant[^;]*\bdelete\b[^;]*\bto authenticated\b/.test(sql),'DELETE não permitido.');
assert.ok(!/grant[^;]*\bto\s+(?:public|anon)\b/.test(sql),'Grant público não permitido.');
assert.ok(!/using\s*\(\s*true\s*\)/.test(sql),'Policy provisória liberada não permitida.');
for(const [,tabela] of sql.matchAll(/create table public\.(\w+)/g)){
  assert.ok(sql.includes(`alter table public.${tabela} enable row level security`),`RLS ausente: ${tabela}`);
  const grants=[...sql.matchAll(/grant\s+select\s+on\s+([^;]+?)\s+to authenticated\s*;/g)];
  assert.ok(grants.some(m=>m[1].split(',').map(x=>x.trim()).includes(`public.${tabela}`)),`SELECT GRANT ausente: ${tabela}`);
}
console.log('GRANT: migrations sem acesso anônimo, DELETE ou policy liberada.');
