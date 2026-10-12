import assert from 'node:assert/strict';
import * as modulo from '../src/lib/dados.js';
assert.equal(typeof modulo.criarDados, 'function', 'Camada assíncrona deve aceitar cliente controlado para testar falhas');
const resposta = {data: null, error: {code: '40001', message: 'conflito'}};
const cliente = {rpc: async () => resposta};
const dados = modulo.criarDados(cliente);
await assert.rejects(dados.salvarNota({id:'n',obra_id:'o',local_id:'l',numero:'1',data:'2026-10-11',volume:1,fck:30,versao:1}), /Recarregue/);
await assert.rejects(dados.salvarEnsaios({id:'n',versao:1,ensaios:{7:{esperado:null,resultados:[-1,0]}}}), /resistências/);
const tabelas = {
  obras: [], locais: [], notas: [{id:'n',obra_id:'o',local_id:'l',numero:'1',volume:'0.1',fck:'30',versao:2,ensaios:[7,28,63].map(idade=>({idade,esperado:null,resultado_1:idade===7?0:null,resultado_2:null}))}],
  ensaios: [7,28,63].map(idade => ({nota_id:'n',idade,esperado:null,resultado_1:idade===7?0:null,resultado_2:null}))
};
// As resistências antigas não podem ser combinadas com a versão nova da nota.
tabelas.ensaios[0].resultado_1=99;
function consulta(lista,error=null){return {
  then:(resolve,reject)=>Promise.resolve({data:lista?.slice(0,1000)??null,error}).then(resolve,reject),
  order(){return this},range(inicio,fim){return Promise.resolve({data:lista?.slice(inicio,fim+1)??null,error})}
}}
const leitura = modulo.criarDados({from: tabela => ({select: () => consulta(tabelas[tabela])})});
const resultado = await leitura.carregar();
assert.equal(resultado.notas[0].volume,0.1);
assert.deepEqual(resultado.notas[0].ensaios[7],{esperado:30,resultados:[0,null]});
const falha = modulo.criarDados({from: () => ({select: () => consulta(null,{message:'rede'})})});
await assert.rejects(falha.carregar(), /Não foi possível/);
console.log('Dados: conflito, erros de leitura, zero e null verificados.');
const senha=modulo.criarDados({auth:{updateUser:async()=>({data:null,error:{message:'falhou'}})}});
assert.equal(typeof senha.definirSenha,'function','Convite precisa permitir definir senha');
await assert.rejects(senha.definirSenha('senha-de-teste'),/Não foi possível/);
// O cliente pode limpar o hash antes de o React montar a tela do convite.
globalThis.location={hash:'#type=invite'};
const convite=await import('../src/lib/supabase.js?teste=convite');
delete globalThis.location;
assert.equal(convite.definirSenhaNoAcesso,true,'Tipo de convite deve ser capturado antes da inicialização do cliente');
const recuperacao=modulo.criarDados({auth:{resetPasswordForEmail:async()=>({data:{},error:null})}});
assert.equal(typeof recuperacao.recuperarSenha,'function','Convite consumido precisa de recuperação de acesso');
await recuperacao.recuperarSenha('teste@example.invalid');
// INSERT RETURNING é avaliado antes do gatilho AFTER que concede o vínculo.
const insercao=Promise.resolve({data:null,error:null});
insercao.select=()=>({single:async()=>({data:null,error:{code:'42501'}})});
const cadastro=modulo.criarDados({from:()=>({insert:()=>insercao})});
await cadastro.salvarObra({nome:'TESTE',tipo:''});
const muitasNotas=Array.from({length:1001},(_,i)=>({...tabelas.notas[0],id:String(i)}));
const paginado=modulo.criarDados({from:t=>({select:()=>consulta(t==='notas'?muitasNotas:tabelas[t])})});
assert.equal((await paginado.carregar()).notas.length,1001,'Relatório não pode perder notas no limite de 1000 linhas');
assert.equal(typeof dados.excluirNota,'function');
await assert.rejects(dados.excluirNota({id:'n',versao:1}),/Recarregue/);
let localInserido;
const locaisCadastro=modulo.criarDados({from:()=>({insert:campos=>{localInserido=campos;return {select:()=>({single:async()=>({data:{id:'local'},error:null})})}}})});
await locaisCadastro.salvarLocal({nome:'Laje',obra_id:'obra',teorico:100});
assert.deepEqual(localInserido,{nome:'Laje',obra_id:'obra',teorico:100});
await assert.rejects(locaisCadastro.salvarLocal({nome:'Laje',obra_id:'obra',teorico:0}),/teórico/);
await locaisCadastro.salvarLocal({nome:'Laje',obra_id:'obra'});
assert.equal(localInserido.teorico,null,'Ausência não é zero');
let camposRenomeados;
const renomear=modulo.criarDados({from:()=>({update:campos=>{camposRenomeados=campos;return {eq:()=>({select:()=>({single:async()=>({data:{id:'local'},error:null})})})}}})});
await renomear.salvarLocal({id:'local',nome:'Novo nome',obra_id:'obra',teorico:100});
assert.equal(Object.hasOwn(camposRenomeados,'teorico'),false,'Renomear não altera o teórico do local');
let enviado;
const classificacao=modulo.criarDados({rpc:async(_nome,args)=>{enviado=args;return {data:'n',error:null}}});
await classificacao.salvarEnsaios({id:'n',fck:30,versao:1,nao_estrutural:true,observacoes:'',ensaios:Object.fromEntries([7,28,63].map(i=>[i,{esperado:1,resultados:[null,null]}]))});
assert.equal(enviado.p_ensaios.nao_estrutural,true);
for(const idade of [7,28,63])assert.equal(enviado.p_ensaios[idade].esperado,30);
assert.equal(typeof dados.excluirObra,'function');
await assert.rejects(dados.excluirObra({id:'o',nome:'Obra'}),/Recarregue/);
await classificacao.excluirObra({id:'o',nome:'Obra'});
assert.deepEqual(enviado,{p_id:'o',p_nome:'Obra'});
