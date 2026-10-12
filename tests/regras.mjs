import assert from 'node:assert/strict';import {prazo,situacao,baixo,total,validarNota} from '../src/lib/regras.js';import {podeEditar} from '../src/lib/regras.js';import {exemplos} from '../src/lib/mockData.js';
assert.equal(prazo('2026-12-29',7),'2027-01-05');assert.equal(prazo('2028-02-22',7),'2028-02-29');assert.equal(situacao({resultados:[0,0]},'2026-01-01',7,'2026-10-11'),'Preenchido');assert.equal(situacao({resultados:[20,null]},'2026-01-01',28,'2026-10-11'),'Preenchido');assert.equal(situacao({resultados:[null,null]},'2026-10-04',7,'2026-10-11'),'Vence hoje');assert.equal(baixo({esperado:null,resultados:[1,2]}),false);assert.equal(baixo({esperado:30,resultados:[29,31]}),true);const data=exemplos();assert.equal(total(data.notas.filter(n=>n.obra_id==='1')),64);assert.equal(total(data.notas.filter(n=>n.obra_id==='2')),32);assert.equal(podeEditar('Cliente'),false);assert.equal(podeEditar('Christopher'),true);assert.equal(podeEditar('Analista'),true);assert.throws(()=>validarNota({...data.notas[0],id:'different'},data.notas));console.log('Regras: datas, pendências, resistências, isolamento e perfis verificados.');

assert.equal(total([{volume:0.1},{volume:0.2}]),0.3);
const {filtrarNotas}=await import('../src/lib/regras.js');
const notasFiltro=[{id:'a',obra_id:'1',data:'2026-10-01',local_id:'l1',numero:'001234',fck:30,volume:8},{id:'b',obra_id:'1',data:'2026-10-02',local_id:'l2',numero:'1235',fck:35,volume:5},{id:'c',obra_id:'2',data:'2026-10-01',local_id:'l1',numero:'001234',fck:30,volume:9}];
assert.deepEqual(filtrarNotas(notasFiltro,{obra:'1',numero:' 123 ',fck:'30'}).map(n=>n.id),['a']);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',numero:'999'}).length,0);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',fck:'3'}).length,0,'FCK deve ser exato');
assert.equal(filtrarNotas(notasFiltro,{obra:'1',local:'l2',fck:'30'}).length,0);
assert.equal(filtrarNotas(notasFiltro,{obra:'1',de:'2026-10-02',ate:'2026-10-02'}).length,1);
assert.equal(filtrarNotas(notasFiltro,{obra:'1'}).length,2,'Filtros vazios mostram todas as notas da obra');
const {resumoLocal}=await import('../src/lib/regras.js');
const localTeorico={id:'l1',obra_id:'1',teorico:20};
const acumulado=resumoLocal([...notasFiltro,{...notasFiltro[0],id:'d',data:'2026-10-12',volume:15}],localTeorico);
assert.equal(acumulado.aplicado,23);assert.equal(acumulado.diferenca,3);assert.ok(Math.abs(acumulado.percentual-15)<0.000001);
assert.deepEqual(resumoLocal(notasFiltro,{...localTeorico,teorico:null}),{aplicado:8});
for(const idade of [7,28,63])assert.equal(situacao({resultados:[null,null]},'2020-01-01',idade,'2026-10-12',true),'Não necessário');
assert.equal(baixo({esperado:30,resultados:[1,2]},true),false);
assert.equal(situacao({resultados:[null,null]},'2020-01-01',7,'2026-10-12',false),'Vencido');
const {opcional63,situacaoNota,resumoEnsaios}=await import('../src/lib/regras.js');
const aprovada={data:'2020-01-01',fck:30,ensaios:{7:{esperado:20,resultados:[20,20]},28:{esperado:30,resultados:[30,31]},63:{esperado:35,resultados:[null,null]}}};
assert.equal(opcional63(aprovada),true,'Igualdade atinge o FCK da nota');
assert.equal(situacaoNota(aprovada,63,'2026-10-12'),'Opcional');
assert.equal(opcional63({...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:30,resultados:[29,35]}}}),false,'Média não substitui os dois resultados');
assert.equal(opcional63({...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:30,resultados:[30,null]}}}),true);
assert.equal(opcional63({...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:null,resultados:[30,31]}}}),true);
assert.equal(situacaoNota({...aprovada,nao_estrutural:true},63),'Não necessário');
const resumoIdades=resumoEnsaios([aprovada,{...aprovada,nao_estrutural:true}],'2026-10-12');
assert.equal(resumoIdades[63].obrigatorios,0);assert.equal(resumoIdades[63].opcionais,1);assert.equal(resumoIdades[63].vencidos,0);assert.equal(resumoIdades[63].dispensados,1);
assert.equal(resumoIdades[28].preenchidos,1);
const corrigida={...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:30,resultados:[29,35]}}};
assert.equal(situacaoNota(corrigida,63,'2026-10-12'),'Vencido','Correção aos 28 reativa a cobrança');
const parcial63={...aprovada,ensaios:{...aprovada.ensaios,63:{esperado:35,resultados:[36,null]}}};
assert.equal(situacaoNota(parcial63,63,'2026-10-12'),'Preenchido');
const preenchida63={...aprovada,ensaios:{...aprovada.ensaios,63:{esperado:35,resultados:[36,37]}}};
assert.equal(situacaoNota(preenchida63,63,'2026-10-12'),'Preenchido');
assert.equal(resumoEnsaios([preenchida63])[63].opcionaisPreenchidos,1);
const contagens=resumoEnsaios([aprovada,corrigida,preenchida63],'2026-10-12')[63];
assert.equal(contagens.obrigatorios,1);assert.equal(contagens.opcionais,2);assert.equal(contagens.vencidos,1);

for(const idade of [7,28,63])assert.equal(situacao({resultados:[null,30]},'2020-01-01',idade,'2026-10-12'),'Preenchido');
assert.equal(opcional63({...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:30,resultados:[null,null]}}}),false);
assert.equal(opcional63({...aprovada,ensaios:{...aprovada.ensaios,28:{esperado:30,resultados:[29,null]}}}),false);

assert.equal(opcional63({...aprovada,fck:50}),false,'Esperado manual antigo não substitui o FCK');
assert.equal(opcional63({...aprovada,fck:undefined}),false);

const {esperadoFck}=await import('../src/lib/regras.js');
assert.equal(esperadoFck(30,7),21);
assert.equal(esperadoFck(35,7),24.5);
assert.equal(esperadoFck(30,28),30);
assert.equal(esperadoFck(30,63),30);
for(const [resultado,abaixo] of [[20.99,true],[21,false],[21.01,false],[0,true]])assert.equal(baixo({esperado:esperadoFck(30,7),resultados:[resultado,null]}),abaixo);

assert.equal(esperadoFck(30.123456,7),21.086419);
