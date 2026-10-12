import assert from 'node:assert/strict';
import {linhasMapa,duracaoConcretagem} from '../src/lib/regras.js';
import {criarDados} from '../src/lib/dados.js';
assert.equal(duracaoConcretagem('08:10','09:45'),'01:35');
assert.equal(duracaoConcretagem('23:50','00:20'),'00:30');
assert.equal(duracaoConcretagem('08:10','08:10'),'00:00');
assert.equal(duracaoConcretagem('','09:45'),null);
assert.equal(duracaoConcretagem('25:00','09:45'),null);
const notas=[
 {id:'b',obra_id:'o',local_id:'l',data:'2026-10-12',numero:'10',volume:0.2},
 {id:'a',obra_id:'o',local_id:'l',data:'2026-10-12',numero:'2',volume:0.1},
 {id:'c',obra_id:'outra',local_id:'l',data:'2026-10-12',numero:'3',volume:10},
 {id:'d',obra_id:'o',local_id:'outro',data:'2026-10-12',numero:'4',volume:20},
 {id:'e',obra_id:'o',local_id:'l',data:'2026-10-13',numero:'5',volume:30}
];
const mapa={obra_id:'o',local_id:'l',peca:'Laje',desde:'2026-10-12',ate:'2026-10-12',itens:[{nota_id:'b',betoneira:'B1',inicio:'23:50',termino:'00:20'}]};
const rows=linhasMapa({notas},mapa);
assert.deepEqual(rows.map(r=>r.id),['a','b']);
assert.deepEqual(rows.map(r=>r.acumulado),[0.1,0.3]);
assert.equal(rows[1].duracao,'00:30');
assert.equal(rows[1].betoneira,'B1');
assert.deepEqual(notas.map(n=>n.id),['b','a','c','d','e']);
assert.equal(linhasMapa({notas}, {...mapa,ate:'2026-10-13'}).at(-1).acumulado,30.3);
let enviado;
const dados=criarDados({rpc:async(nome,args)=>{enviado={nome,args};return {data:'id',error:null}}});
await dados.salvarMapa(mapa);
assert.equal(enviado.nome,'salvar_mapa');assert.equal(enviado.args.p_versao,null);
await dados.excluirMapa({id:'id',versao:2});assert.equal(enviado.args.p_versao,2);
await assert.rejects(dados.salvarMapa({...mapa,ate:'2026-10-11'}),/período/);
await assert.rejects(dados.salvarMapa({...mapa,imagem:'data:image/svg+xml;base64,abc'}),/imagem/);
await assert.rejects(dados.salvarMapa({...mapa,imagem:'data:image/png;base64,'+'A'.repeat(2800001)}),/2 MB/);
console.log('Mapeamento: isolamento por obra/local/período, ordem de NF, acumulado decimal, duração, validações e versão verificados.');

function clienteMapa(versaoAtual){return {from:tabela=>({select:campos=>({
 eq(){return this},order(){return this},
 single:async()=>({data:campos==='versao'?{versao:versaoAtual}:{id:'id',obra_id:'o',versao:1,imagem:null},error:null}),
 range:async()=>({data:[{nota_id:'a',betoneira:'ANTIGA',inicio:'',termino:''}],error:null})
})})}}
await assert.rejects(criarDados(clienteMapa(2)).obterMapa('id'),/Recarregue/);
assert.equal((await criarDados(clienteMapa(1)).obterMapa('id')).itens[0].betoneira,'ANTIGA');
console.log('Mapeamento: leitura interrompida quando outro usuário salva durante o carregamento.');
