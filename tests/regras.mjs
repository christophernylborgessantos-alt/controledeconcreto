import assert from 'node:assert/strict';import {prazo,situacao,baixo,total,validarNota} from '../src/lib/regras.js';import {podeEditar} from '../src/lib/regras.js';import {exemplos} from '../src/lib/mockData.js';
assert.equal(prazo('2026-12-29',7),'2027-01-05');assert.equal(prazo('2028-02-22',7),'2028-02-29');assert.equal(situacao({resultados:[0,0]},'2026-01-01',7,'2026-10-11'),'Preenchido');assert.equal(situacao({resultados:[20,null]},'2026-01-01',28,'2026-10-11'),'Vencido');assert.equal(situacao({resultados:[null,null]},'2026-10-04',7,'2026-10-11'),'Vence hoje');assert.equal(baixo({esperado:null,resultados:[1,2]}),false);assert.equal(baixo({esperado:30,resultados:[29,31]}),true);const data=exemplos();assert.equal(total(data.notas.filter(n=>n.obra_id==='1')),64);assert.equal(total(data.notas.filter(n=>n.obra_id==='2')),32);assert.equal(podeEditar('Cliente'),false);assert.equal(podeEditar('Christopher'),true);assert.equal(podeEditar('Analista'),true);assert.throws(()=>validarNota({...data.notas[0],id:'different'},data.notas));console.log('Regras: datas, pendências, resistências, isolamento e perfis verificados.');

assert.equal(total([{volume:0.1},{volume:0.2}]),0.3);
const {filtrarNotas}=await import('../src/lib/regras.js');
const notasFiltro=[{id:'a',obra_id:'1',data:'2026-10-01',local_id:'l1',numero:'001234',fck:30,volume:8},{id:'b',obra_id:'1',data:'2026-10-02',local_id:'l2',numero:'1235',fck:35,volume:5},{id:'c',obra_id:'2',data:'2026-10-01',local_id:'l1',numero:'001234',fck:30,volume:9}];
assert.deepEqual(filtrarNotas(notasFiltro,{obra:'1',numero:' 123 ',fck:'30'}).map(n=>n.id),['a']);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',numero:'999'}).length,0);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',fck:'3'}).length,0,'FCK deve ser exato');
assert.equal(filtrarNotas(notasFiltro,{obra:'1',local:'l2',fck:'30'}).length,0);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',de:'2026-10-02',ate:'2026-10-02'}).length,1);
assert.equal(filtrarNotas(notasFiltro,{obra:'1'}).length,2,'Filtros vazios mostram todas as notas da obra');
