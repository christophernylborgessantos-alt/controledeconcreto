import assert from 'node:assert/strict';
import {previaEnsaios,gerarModeloImportacao} from '../src/lib/importacaoEnsaios.js';
import {lerExcelImportacao,sugerirColunas} from '../src/lib/importacaoExcel.js';
import {criarDados} from '../src/lib/dados.js';
import JSZip from 'jszip';
const nota={id:'n',obra_id:'o',numero:'001',versao:3,nao_estrutural:false,ensaios:{7:{resultados:[20,21]},28:{resultados:[30,null]},63:{resultados:[null,null]}}};
const data={obras:[{id:'o'}],notas:[nota]};
const aba={linhas:[{numero:1,celulas:{1:{valor:'NF'},2:{valor:'7 dias R1'},3:{valor:'28 dias R2'}}},{numero:2,celulas:{1:{valor:'001'},2:{valor:0},3:{valor:35}}}]};
const col=sugerirColunas(aba,1);
let p=previaEnsaios(aba,1,col,data,'o');
assert.equal(p.atualizacoes.length,1);assert.deepEqual(p.atualizacoes[0].resultados,{'7':[0,null],'28':[null,35],'63':[null,null]});
assert.equal(p.linhas[0].alteracoes[0].antes,20);
assert.equal(previaEnsaios(aba,1,col,data,'outra').atualizacoes.length,0);
assert.equal(previaEnsaios(aba,1,col,{...data,notas:[{...nota,nao_estrutural:true}]},'o').linhas[0].status,'Erro');
assert.equal(previaEnsaios({...aba,linhas:[...aba.linhas,{...aba.linhas[1],numero:3}]},1,col,data,'o').atualizacoes.length,0);
assert.equal(previaEnsaios({...aba,linhas:[aba.linhas[0],{numero:2,celulas:{1:{valor:'inexistente'},2:{valor:4}}}]},1,col,data,'o').linhas[0].status,'Erro');
for(const modelo of [1,2]){const buffer=await gerarModeloImportacao(modelo);const abas=await lerExcelImportacao(buffer);const cols=sugerirColunas(abas[0],1);assert.ok(cols.numero&&cols.r7_1&&cols.r63_2);if(modelo===1)assert.ok(cols.local&&cols.volume);assert.equal(abas[0].linhas.length,1,'Modelo vazio, sem dados reais');}
const zip=await JSZip.loadAsync(await gerarModeloImportacao(2));
for(const nome of Object.keys(zip.files).filter(n=>/^xl\/.*\.xml$/.test(n))){let xml=await zip.file(nome).async('string');if(xml.includes('xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')){xml=xml.replace(/(<\/?)([A-Za-z][\w.-]*)(?=[\s/>])/g,'$1x:$2').replace('xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"','xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"');zip.file(nome,xml)}}
const prefixado=await lerExcelImportacao(await zip.generateAsync({type:'nodebuffer'}));assert.ok(sugerirColunas(prefixado[0],1).r28_2,'XLSX com namespace prefixado é aceito');
const calls=[];const dados=criarDados({rpc:async(...args)=>{calls.push(args);return {data:{atualizadas:1},error:null}}});
await dados.importarEnsaios('o',p.atualizacoes);assert.equal(calls[0][0],'importar_resultados_ensaios');
console.log('Importação de ensaios: zero, vazios, isolamento, duplicadas, não estrutural, modelos XLSX e RPC verificados.');
