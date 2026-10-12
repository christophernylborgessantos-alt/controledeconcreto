import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const schema=JSON.parse(readFileSync(new URL('./_schema-snapshot.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../src/lib/dados.js',import.meta.url),'utf8');
let consultas=0;
for(const m of source.matchAll(/\.from\('([^']+)'\)\.select\('([^']+)'\)/g)){
  const [,tabela,colunas]=m;
  assert.ok(schema[tabela],`Tabela ausente: ${tabela}`);
  const simples=colunas.replace(/(\w+)\(([^)]+)\)/g,(_texto,relacao,campos)=>{
    assert.ok(schema[relacao],`Relação ausente: ${relacao}`);
    for(const campo of campos.split(','))assert.ok(schema[relacao].includes(campo),`Coluna ausente: ${relacao}.${campo}`);
    return '';
  });
  for(const coluna of simples.split(',').filter(Boolean))assert.ok(schema[tabela].includes(coluna),`Coluna ausente: ${tabela}.${coluna}`);
  consultas++;
}
assert.ok(consultas>=4,'Conferência deve cobrir todas as consultas de leitura da camada.');
console.log('Schema: leituras conferidas contra snapshot do banco.');
