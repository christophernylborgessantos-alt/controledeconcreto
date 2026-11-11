import {camposEnsaios, previaEnsaios} from './importacaoEnsaios.js';

const colunas = Object.fromEntries(camposEnsaios.map(({chave}, i) => [chave, i + 1]));

export function previaLaudo(notas, data, obra) {
  const linhas = notas.map((nota, i) => ({
    numero:i + 2,
    celulas:Object.fromEntries([nota.numero, ...nota.resultados].map((valor, j) => [
      j + 1, {valor, erro:j === 0 && nota.erros.length ? nota.erros.join(', ') : undefined}
    ]))
  }));
  const previa = previaEnsaios({linhas:[{numero:1, celulas:{}}, ...linhas]}, 1, colunas, data, obra);
  return {
    ...previa,
    linhas:previa.linhas.map((linha, i) => ({
      ...linha, pagina:notas[i].pagina, resultados:notas[i].resultados,
      mensagem:linha.mensagem.replace('repetida na planilha. Mantenha uma linha por NF.', 'repetida no laudo. Confira o PDF.')
    }))
  };
}
