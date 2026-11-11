import assert from 'node:assert/strict';
import {extrairPagina} from '../src/lib/laudoLayout.js';

function laudo(idades, unidade = 'MPa') {
  const width = 1850;
  const height = 1060;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const rotulos = new Map();
  const escurecer = (x,y) => { data[(y * width + x) * 4] = 0; };
  const horizontal = (y,inicio,fim) => {
    for (let x = inicio; x <= fim; x++) escurecer(x,y);
  };
  const vertical = (x,inicio,fim) => {
    for (let y = inicio; y <= fim; y++) escurecer(x,y);
  };
  for (const y of [350,403]) horizontal(y,99,193);
  const fim = 1819;
  const passo = idades.length === 4 ? 135 : 170;
  const inicio = fim - passo * idades.length;
  for (const y of [250,280,315,350]) horizontal(y,inicio,fim);
  vertical(fim,250,350);
  for (const [i,idade] of idades.entries()) {
    const x = inicio + i * passo;
    const mpa = x + Math.round(passo * 0.57);
    vertical(x,250,350);
    vertical(mpa,315,350);
    rotulos.set(`${x + 4}:254`,`${idade} dias`);
    rotulos.set(`${mpa + 4}:319`, idade === 7 ? unidade : 'MPa');
    if (idade === 7) vertical(mpa + 12,359,368);
  }
  const pagina = {width,height,getContext:() => ({getImageData:() => ({data})})};
  const criarCanvas = (width,height) => {
    const recortes = [];
    return {width,height,recortes,getContext:() => ({
      fillRect() {},
      drawImage(_pagina,x,y) { recortes.push([x,y]); }
    })};
  };
  const reconhecer = async (canvas,numerico) => {
    if (!numerico) {
      const [x,y] = canvas.recortes[0];
      return {text:rotulos.get(`${x}:${y}`) ?? (y === 36 ? 'FOR 017 02' : '')};
    }
    const [nf,resultado] = canvas.recortes;
    assert.equal(nf[0],103);
    assert.equal(resultado[0],inicio + idades.indexOf(7) * passo + Math.round(passo * 0.57) + 4);
    const words = [
      {text:'001', confidence:99, bbox:{x0:27,x1:58,y0:20,y1:32}},
      {text:'40.63', confidence:99, bbox:{x0:187,x1:225,y0:20,y1:32}}
    ];
    return {blocks:[{paragraphs:[{lines:[{words}]}]}]};
  };
  return extrairPagina(pagina,1,criarCanvas,reconhecer);
}

for (const idades of [[7,28,63],[3,7,28,63]]) {
  assert.deepEqual(await laudo(idades),[
    {pagina:1,numero:'001',resultados:[40.63,null,null,null,null,null],erros:[]}
  ]);
}
await assert.rejects(laudo([7,28,63],'Carga (ton)'),/identificar as colunas de MPa/);
console.log('Laudos: colunas de MPa identificadas com e sem a idade de 3 dias.');
