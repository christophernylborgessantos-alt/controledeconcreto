import assert from 'node:assert/strict';
import {criarDados} from '../src/lib/dados.js';
import {previaLaudo} from '../src/lib/previaLaudo.js';
import {criarHandler} from '../supabase/functions/relatorios-drive/handler.js';

const obra = '11111111-1111-4111-8111-111111111111';
const arquivo = 'arquivo-ficticio';
const pasta = 'pasta-ficticia';
const resultados = [0, null, 34.5, null, null, 38];
const nota = {numero:'00001', pagina:2, resultados, erros:[]};
const dados = {
  obras:[{id:obra}],
  notas:[{id:'nota', obra_id:obra, numero:'00001', versao:8, ensaios:{
    7:{resultados:[31,32]}, 28:{resultados:[null,null]}, 63:{resultados:[null,null]}
  }}]
};
const previa = previaLaudo([nota], dados, obra);
assert.equal(previa.linhas[0].pagina, 2);
assert.deepEqual(previa.atualizacoes[0], {id:'nota', numero:'00001', versao:8, resultados:{
  7:[0,null], 28:[34.5,null], 63:[null,38]
}});
assert.equal(previaLaudo([{...nota, erros:['NF ilegível']}], dados, obra).linhas[0].status, 'Erro');
assert.equal(previaLaudo([nota, nota], dados, obra).atualizacoes.length, 0);
assert.equal(previaLaudo([{...nota, numero:'1'}], dados, obra).linhas[0].status, 'Erro');

const blob = new Blob(['%PDF-exemplo'], {type:'application/pdf'});
const cliente = criarDados({functions:{invoke:async (nome,{body}) => {
  assert.equal(nome, 'relatorios-drive');
  assert.equal(body.obra, obra);
  return {data:body.acao === 'baixar' ? blob : {arquivos:[{id:arquivo}]}};
}}});
assert.equal((await cliente.listarRelatoriosDrive(obra)).arquivos[0].id, arquivo);
assert.equal(await cliente.baixarRelatorioDrive(obra, arquivo), blob);

let role = 'Analista', vinculo = true, pai = pasta, downloads = 0;
const handler = criarHandler({
  cliente: () => ({
    auth:{getUser:async () => ({data:{user:{id:'usuario'}}})},
    from: tabela => ({select:() => ({eq:() => ({maybeSingle:async () => ({
      data:tabela === 'profiles' ? {ativo:true, role} : vinculo ? {id:obra} : null
    })})})})
  }),
  pasta: () => pasta,
  drive: async () => async (path, params) => {
    if (!path) {
      assert.match(params.q, /pasta-ficticia/);
      return Response.json({files:[{id:arquivo}]});
    }
    if (!params.alt) return Response.json({parents:[pai], trashed:false, size:12, mimeType:'application/pdf'});
    downloads++;
    return new Response(blob);
  }
});
const req = (acao, id = arquivo) => new Request('http://example.test', {
  method:'POST', headers:{Authorization:'Bearer teste'}, body:JSON.stringify({acao, obra, id})
});
assert.equal((await handler(req('listar'))).status, 200);
assert.equal((await handler(req('baixar', [arquivo]))).status, 400);
pai = 'outra-pasta';
assert.equal((await handler(req('baixar'))).status, 403);
pai = pasta;
vinculo = false;
assert.equal((await handler(req('baixar'))).status, 403);
vinculo = true;
role = 'Cliente';
assert.equal((await handler(req('baixar'))).status, 403);
assert.equal(downloads, 0);
role = 'Analista';
const resposta = await handler(req('baixar'));
assert.equal(resposta.headers.get('Content-Type'), 'application/pdf');
assert.equal(await resposta.text(), '%PDF-exemplo');
console.log('Laudos: prévia, permissões e escopo do Drive verificados.');
