import assert from 'node:assert/strict';
import * as regras from '../src/lib/regras.js';
assert.equal(typeof regras.montarRelatorio,'function');
const ensaios=Object.fromEntries([7,28,63].map(i=>[i,{esperado:null,resultados:[0,null]}]));
const data={obras:[{id:'a',nome:'Obra A'},{id:'b',nome:'Obra B'}],locais:[{id:'l',obra_id:'a',nome:'Laje'}],notas:[
 {id:'1',obra_id:'a',local_id:'l',data:'2026-10-11',numero:'1',volume:.1,ensaios},
 {id:'2',obra_id:'a',local_id:'l',data:'2026-10-11',numero:'2',volume:.2,ensaios},
 {id:'3',obra_id:'b',data:'2026-10-11',volume:50,ensaios},
 {id:'4',obra_id:'a',data:'2026-10-10',volume:20,ensaios}
]};
const r=regras.montarRelatorio(data,{obra:'a',de:'2026-10-11',ate:'2026-10-11'});
assert.equal(r.volume,.3);
assert.equal(r.notas.length,2);
assert.equal(r.notas[0].local,'Laje');
assert.deepEqual(r.notas[0].ensaios[7].resultados,[0,null]);
assert.equal(r.notas[0].ensaios[7].esperado,null);
assert.equal(regras.montarRelatorio(data,{obra:'a',de:'2026-10-12'}).notas.length,0);
assert.throws(()=>regras.montarRelatorio(data,{obra:'a',de:'2026-10-12',ate:'2026-10-11'}),/período/);
console.log('Relatórios: obra, período inclusivo, total decimal, zero e ausência verificados.');
data.notas[0].fck=30;data.notas[1].fck=35;
const filtrado=regras.montarRelatorio(data,{obra:'a',local:'l',numero:'1',fck:'30'});
assert.deepEqual(filtrado.notas.map(n=>n.id),['1']);
assert.equal(filtrado.volume,.1);
assert.equal(regras.montarRelatorio(data,{obra:'a',local:'outro'}).notas.length,0);
assert.equal(regras.montarRelatorio(data,{obra:'a',fck:'35'}).volume,.2);
data.locais[0].teorico=20;
assert.equal(regras.montarRelatorio(data,{obra:'a',local:'l'}).teorico,20,'Duas notas do mesmo local contam o teórico uma vez');
assert.equal(regras.montarRelatorio(data,{obra:'a',numero:'1',local:'l'}).teorico,20,'Filtro não rateia o teórico total do local');
assert.equal(regras.montarRelatorio(data,{obra:'a'}).teorico,null,'Local sem teórico não vira zero nem total completo');
const duasLocais={...data,locais:[...data.locais,{id:'m',obra_id:'a',nome:'Viga',teorico:10.5}],notas:[...data.notas.slice(0,2),{...data.notas[0],id:'5',numero:'5',local_id:'m'}]};
assert.equal(regras.montarRelatorio(duasLocais,{obra:'a'}).teorico,30.5);
assert.equal(regras.montarRelatorio(duasLocais,{obra:'a',local:'m'}).teorico,10.5);
