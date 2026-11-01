import {camposImportacao,numeroImportacao,normalizarCabecalho} from './importacaoExcel.js';
const idades=[7,28,63];
export const camposEnsaios=camposImportacao.filter(c=>c.chave==='numero'||c.chave.startsWith('r')).map(c=>({...c,obrigatorio:c.chave==='numero'}));
export function previaEnsaios(aba,cabecalho,colunas,data,obra){
 const errosGerais=[],linhas=[],campos=camposEnsaios.filter(c=>colunas[c.chave]);
 if(!colunas.numero)errosGerais.push('Selecione a coluna NF.');
 if(!campos.some(c=>c.chave!=='numero'))errosGerais.push('Selecione pelo menos uma coluna de resultado.');
 if(new Set(campos.map(c=>Number(colunas[c.chave]))).size!==campos.length)errosGerais.push('Cada campo precisa de uma coluna diferente.');
 if(!data.obras.some(o=>o.id===obra))errosGerais.push('Selecione uma obra.');
 if(!aba?.linhas.some(l=>l.numero===Number(cabecalho)))errosGerais.push('Selecione uma linha de cabeçalho existente.');
 if(errosGerais.length)return {linhas,atualizacoes:[],errosGerais};
 for(const l of aba.linhas.filter(l=>l.numero>Number(cabecalho))){
  const cel=l.celulas[colunas.numero];let numero=String(cel?.valor??'').trim();
  const zeros=cel?.formato?.split(';')[0];if(typeof cel?.valor==='number'&&Number.isInteger(cel.valor)&&/^0+$/.test(zeros))numero=numero.padStart(zeros.length,'0');
  const linha={linha:l.numero,numero,alteracoes:[],status:'Ignorada',mensagem:''};linhas.push(linha);
  try{
   if(cel?.erro)throw Error(cel.erro);
   if(['total','subtotal'].includes(normalizarCabecalho(numero))){linha.mensagem='Linha de resumo.';continue}
   const resultados=Object.fromEntries(idades.map(i=>[i,[null,null]]));
   for(const i of idades)for(let r=1;r<=2;r++){
    const c=l.celulas[colunas[`r${i}_${r}`]];if(c?.erro)throw Error(c.erro);
    resultados[i][r-1]=numeroImportacao(c?.valor,true);
   }
   if(!numero)throw Error('Informe a NF.');
   const notas=data.notas.filter(n=>n.obra_id===obra&&n.numero===numero);
   if(notas.length!==1)throw Error('NF não encontrada ou ambígua nesta obra. Nenhuma nota será criada.');
   const nota=notas[0];
   if(!Object.values(resultados).flat().some(v=>v!==null)){linha.mensagem='Sem resultados preenchidos; dados preservados.';continue}
   if(nota.nao_estrutural)throw Error('Peça não estrutural: confira a classificação na aba Ensaios antes de atualizar.');
   for(const i of idades)for(let r=0;r<2;r++)if(resultados[i][r]!==null&&resultados[i][r]!==nota.ensaios[i].resultados[r])linha.alteracoes.push({idade:i,resultado:r+1,antes:nota.ensaios[i].resultados[r],depois:resultados[i][r]});
   if(!linha.alteracoes.length){linha.mensagem='Resultados iguais aos cadastrados.';continue}
   linha.status='Atualizar';linha.mensagem='Células vazias preservam os resultados existentes.';
   linha.payload={id:nota.id,numero,versao:nota.versao,resultados};
  }catch(e){linha.status='Erro';linha.mensagem=e.message}
 }
 const contagem=new Map();for(const l of linhas)if(l.numero)contagem.set(l.numero,(contagem.get(l.numero)||0)+1);
 for(const l of linhas)if(contagem.get(l.numero)>1){l.status='Erro';l.mensagem='NF repetida na planilha. Mantenha uma linha por NF.'}
 const atualizacoes=linhas.filter(l=>l.status==='Atualizar').map(l=>l.payload);
 if(atualizacoes.length>500)errosGerais.push('Limite de 500 notas por atualização. Separe o arquivo.');
 return {linhas,atualizacoes,errosGerais};
}
export async function gerarModeloImportacao(modelo){
 const {default:ExcelJS}=await import('exceljs');const livro=new ExcelJS.Workbook();
 const folha=livro.addWorksheet(modelo===1?'Base inteira':'Resultados de ensaio');
 const campos=modelo===1?camposImportacao:camposEnsaios;
 folha.columns=campos.map(c=>({header:c.nome,width:c.chave==='local'?32:23}));
 folha.views=[{state:'frozen',ySplit:1}];folha.autoFilter={from:{row:1,column:1},to:{row:1,column:campos.length}};
 folha.getRow(1).height=35;folha.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173C3F'}};c.alignment={wrapText:true,vertical:'middle'}});
 campos.forEach((c,i)=>{folha.getColumn(i+1).numFmt=c.chave==='numero'?'@':c.chave==='data'?'dd/mm/yyyy':c.chave.startsWith('r')?'0.00####':'General'});
 folha.getCell('A1').note=modelo===2?'NF exata na obra selecionada, incluindo zeros. Preenchidos substituem; vazios preservam. Não altera data, FCK, slump, volume ou local.':'Obrigatórios: data, NF, local, FCK e volume. NFs existentes preservadas. Preencha a partir da linha 2.';
 return livro.xlsx.writeBuffer();
}
export async function baixarModeloImportacao(modelo){
 const buffer=await gerarModeloImportacao(modelo);const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download=`modelo-${modelo}-${modelo===1?'base-inteira':'resultados-ensaios'}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
