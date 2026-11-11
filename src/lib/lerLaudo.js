import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {createWorker, PSM} from 'tesseract.js';
import ocrWorker from 'tesseract.js/dist/worker.min.js?url';
import ocrCore from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import idioma from '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url';
import {extrairPagina} from './laudoLayout.js';

function criarCanvas(width, height) {
  return Object.assign(document.createElement('canvas'), {width, height});
}

export async function lerLaudo(arquivo, progresso) {
  if (!arquivo.size || arquivo.size > 20 * 1024 * 1024) throw Error('Selecione um PDF de até 20 MB.');
  GlobalWorkerOptions.workerSrc = pdfWorker;
  const tarefa = getDocument({data:await arquivo.arrayBuffer(), isEvalSupported:false});
  let worker;
  try {
    const pdf = await tarefa.promise;
    if (pdf.numPages > 30) throw Error('O laudo deve ter até 30 páginas.');
    const langPath = new URL('.', new URL(idioma, document.baseURI)).href;
    const falha = () => Error('Não foi possível iniciar o leitor de laudos. Recarregue a página e tente novamente.');
    let prazo;
    let expirou = false;
    try {
      worker = await new Promise((resolve, reject) => {
        prazo = setTimeout(() => { expirou = true; reject(falha()); }, 45000);
        createWorker('eng', 1, {
          workerPath:ocrWorker, corePath:ocrCore, langPath, cacheMethod:'none',
          workerBlobURL:false, errorHandler:() => reject(falha())
        }).then(iniciado => {
          if (expirou) return iniciado.terminate();
          resolve(iniciado);
        }, () => reject(falha()));
      });
    } finally {
      clearTimeout(prazo);
    }
    async function reconhecer(canvas, numerico) {
      await worker.setParameters({
        tessedit_pageseg_mode:numerico ? PSM.SPARSE_TEXT : PSM.SINGLE_BLOCK,
        tessedit_char_whitelist:numerico ? '0123456789,.' : ''
      });
      return (await worker.recognize(canvas, {}, {blocks:numerico, text:true})).data;
    }
    const notas = [];
    for (let numero = 1; numero <= pdf.numPages; numero++) {
      progresso(numero, pdf.numPages);
      const pagina = await pdf.getPage(numero);
      const base = pagina.getViewport({scale:1});
      if (Math.abs(base.width / base.height - 1.414) > 0.045) throw Error('O laudo deve estar no formato paisagem do formulário FOR 017 02.');
      const viewport = pagina.getViewport({scale:3000 / base.width});
      const canvas = criarCanvas(3000, Math.ceil(viewport.height));
      await pagina.render({canvas, viewport}).promise;
      notas.push(...await extrairPagina(canvas, numero, criarCanvas, reconhecer));
      pagina.cleanup();
    }
    return notas;
  } finally {
    await Promise.all([worker?.terminate(), tarefa.destroy()]);
  }
}
