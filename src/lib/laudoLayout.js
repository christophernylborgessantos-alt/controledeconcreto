const larguraModelo = 1850;
const colunas = [[99,193], [1493,1548], [1628,1683], [1763,1817]];
const formato = 'Formato de laudo não reconhecido. Use o formulário FOR 017 02, com todas as páginas legíveis.';

export async function extrairPagina(pagina, numero, criarCanvas, reconhecer) {
  const escala = pagina.width / larguraModelo;
  const px = n => Math.round(n * escala);
  const contexto = pagina.getContext('2d');
  const altura = Math.min(pagina.height, px(1060));
  const {data} = contexto.getImageData(0, 0, pagina.width, altura);
  const escuro = (x, y) => data[(y * pagina.width + x) * 4] < 135;
  const linhas = [];
  for (let y = px(190); y < altura; y++) {
    let pontos = 0;
    for (let x = px(108); x < px(183); x += 2) pontos += Number(escuro(x, y));
    if (pontos > (px(183) - px(108)) * 0.38 && y - (linhas.at(-1) ?? 0) > px(4)) linhas.push(y);
  }
  const sequencias = [];
  let sequencia = [];
  for (const y of linhas) {
    const distancia = (y - sequencia.at(-1)) / escala;
    if (distancia < 49 || distancia > 57) {
      if (sequencia.length >= 2) sequencias.push(sequencia);
      sequencia = [];
    }
    sequencia.push(y);
  }
  if (sequencia.length >= 2) sequencias.push(sequencia);
  if (sequencias.length !== 1) throw Error(`Página ${numero}. ${formato}`);
  const limites = sequencias[0];

  function recortar(destino, x, y, w, h, dx, dy) {
    destino.drawImage(pagina, x, y, w, h, dx, dy, w, h);
  }
  const cabecalho = criarCanvas(px(180), px(45));
  recortar(cabecalho.getContext('2d'), px(195), px(36), cabecalho.width, cabecalho.height, 0, 0);
  const identificacao = await reconhecer(cabecalho, false);
  if (!/FOR01702/i.test(identificacao.text.replace(/[^a-z0-9]/gi, ''))) {
    throw Error(`Página ${numero}. ${formato}`);
  }

  const passoX = px(160);
  const passoY = px(60);
  const imagem = criarCanvas(passoX * 4, passoY * (limites.length - 1) * 2);
  const destino = imagem.getContext('2d');
  destino.fillStyle = '#fff';
  destino.fillRect(0, 0, imagem.width, imagem.height);
  const celulas = new Map();
  const notas = [];
  for (let i = 0; i < limites.length - 1; i++) {
    const topo = limites[i];
    const fim = limites[i + 1];
    const meio = Math.round((topo + fim) / 2);
    const nota = {pagina:numero, numero:'', resultados:Array(6).fill(null), erros:[]};
    notas.push(nota);
    for (const [coluna, [esquerda, direita]] of colunas.entries()) {
      for (let amostra = 0; amostra < (coluna === 0 ? 1 : 2); amostra++) {
        const x = px(esquerda + 4);
        const w = px(direita - esquerda - 8);
        const y = (amostra === 0 ? topo : meio) + px(4);
        const h = (coluna === 0 || amostra === 1 ? fim : meio) - px(4) - y;
        let primeiro = h, ultimo = -1;
        for (let j = 0; j < h; j++) {
          for (let k = 0; k < w; k++) {
            if (escuro(x + k, y + j)) {
              primeiro = Math.min(primeiro, j);
              ultimo = j;
            }
          }
        }
        // O formulário marca resultados ausentes com um traço horizontal.
        if (coluna > 0 && ultimo - primeiro < px(3)) continue;
        const linha = i * 2 + amostra;
        const dx = coluna * passoX + px(25);
        const dy = linha * passoY + Math.floor((passoY - h) / 2);
        recortar(destino, x, y, w, h, dx, dy);
        celulas.set(`${linha}:${coluna}`, {nota, coluna, amostra, palavras:[]});
      }
    }
  }
  const leitura = await reconhecer(imagem, true);
  for (const bloco of leitura.blocks ?? []) {
    for (const paragrafo of bloco.paragraphs) {
      for (const linha of paragrafo.lines) {
        for (const palavra of linha.words) {
          const {x0, x1, y0, y1} = palavra.bbox;
          const linhaCelula = Math.floor((y0 + y1) / 2 / passoY);
          const coluna = Math.floor((x0 + x1) / 2 / passoX);
          celulas.get(`${linhaCelula}:${coluna}`)?.palavras.push(palavra);
        }
      }
    }
  }
  for (const {nota, coluna, amostra, palavras} of celulas.values()) {
    const valor = palavras.map(p => p.text).join('').trim();
    const valido = palavras.length > 0 && palavras.every(p => p.confidence >= 55);
    if (coluna === 0 && valido && /^\d{1,20}$/.test(valor)) nota.numero = valor;
    else if (coluna > 0 && valido && /^\d{1,3}[.,]\d{2}$/.test(valor)) {
      nota.resultados[(coluna - 1) * 2 + amostra] = Number(valor.replace(',', '.'));
    } else {
      nota.erros.push(coluna === 0 ? 'NF ilegível' : `${[7,28,63][coluna - 1]} dias, R${amostra + 1} ilegível`);
    }
  }
  return notas;
}
