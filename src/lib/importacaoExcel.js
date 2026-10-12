import {idades,esperadoFck,total} from './regras.js';

export const normalizarCabecalho=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const nomeLocalImportacao=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
export const camposImportacao=[
 {chave:'data',nome:'Data de aplicação',obrigatorio:true,aliases:['data','aplicacao','datadeaplicacao','dataaplicacao','datadaconcretagem']},
 {chave:'numero',nome:'NF',obrigatorio:true,aliases:['nf','nota','notafiscal','numerodanota','numerodanf','numeronf','numeronota','nonf','nnf']},
 {chave:'local',nome:'Local',obrigatorio:true,aliases:['local','localdeaplicacao','localaplicacao']},
 {chave:'fck',nome:'FCK · MPa',obrigatorio:true,aliases:['fck','fckmpa','resistencia','resistenciampa']},
 {chave:'volume',nome:'Volume · m³',obrigatorio:true,aliases:['volume','volumem3','vol','volm3']},
 {chave:'slump',nome:'Slump',aliases:['slump','slumpcm','abatimento','abatimentocm']},
 {chave:'peca_estrutural',nome:'Peça estrutural',aliases:['peca','pecaestrutural']},
 {chave:'observacoes',nome:'Observações',aliases:['observacoes','observacao','obs']},
 {chave:'nao_estrutural',nome:'Peça não estrutural',aliases:['naoestrutural','pecanaoestrutural']},
 ...idades.flatMap(idade=>[1,2].map(r=>({chave:`r${idade}_${r}`,nome:`${idade} dias R${r}`,aliases:[`${idade}diasr${r}`,`r${r}${idade}dias`,`${idade}dr${r}`,`r${r}${idade}d`,`resultado${r}${idade}dias`]})))
];

function valorCelula(celula){
 let valor=celula.value,erro='';
 if(valor&&typeof valor==='object'&&!(valor instanceof Date)){
  if('formula' in valor||'sharedFormula' in valor){if(valor.result===undefined||valor.result===null)erro='Fórmula sem resultado salvo. Abra e salve o arquivo no Excel.';valor=valor.result}
  else if(valor.richText)valor=valor.richText.map(t=>t.text).join('');
  else if('text' in valor)valor=valor.text;
  else if(valor.error){erro='A célula contém erro do Excel.';valor=null}
 }
 if(valor&&typeof valor==='object'&&'error' in valor){erro='A célula contém erro do Excel.';valor=null}
 return {valor:valor??null,formato:celula.numFmt||'',erro};
}

export async function lerExcelImportacao(buffer){
 const {default:ExcelJS}=await import('exceljs');
 const livro=new ExcelJS.Workbook();await livro.xlsx.load(buffer);
 const abas=livro.worksheets.filter(a=>a.state==='visible').map(a=>{
  const linhas=[];
  a.eachRow(linha=>{
   if(linhas.length>=5000)throw Error('A aba ultrapassa 5.000 linhas. Separe a planilha em arquivos menores.');
   const celulas={};linha.eachCell((celula,coluna)=>{if(coluna>200)throw Error('A aba ultrapassa 200 colunas.');celulas[coluna]=valorCelula(celula)});
   if(Object.values(celulas).some(c=>c.valor!==null||c.erro))linhas.push({numero:linha.number,celulas});
  });
  const melhor=linhas.slice(0,25).map(l=>({linha:l.numero,pontos:camposImportacao.filter(c=>c.obrigatorio&&Object.values(l.celulas).some(v=>c.aliases.includes(normalizarCabecalho(v.valor)))).length})).sort((a,b)=>b.pontos-a.pontos)[0];
  return {nome:a.name,linhas,cabecalho:melhor?.linha||1,date1904:!!livro.properties.date1904};
 });
 if(!abas.length)throw Error('O arquivo não contém abas visíveis.');
 return abas;
}

export function colunasImportacao(aba,cabecalho){
 const linha=aba?.linhas.find(l=>l.numero===Number(cabecalho));
 return Object.entries(linha?.celulas||{}).map(([coluna,c])=>({coluna:Number(coluna),nome:String(c.valor??'').trim()||`Coluna ${coluna}`}));
}
export function sugerirColunas(aba,cabecalho){
 const colunas=colunasImportacao(aba,cabecalho);
 return Object.fromEntries(camposImportacao.map(c=>{const encontradas=colunas.filter(v=>c.aliases.includes(normalizarCabecalho(v.nome)));return [c.chave,encontradas.length===1?encontradas[0].coluna:'']}));
}

function texto(c){if(c?.erro)throw Error(c.erro);return String(c?.valor??'').trim()}
function numeroNF(c){
 const v=texto(c);
 const zeros=c?.formato?.split(';')[0];
 return typeof c?.valor==='number'&&Number.isInteger(c.valor)&&/^0+$/.test(zeros)?v.padStart(zeros.length,'0'):v;
}
export function numeroImportacao(v,opcional=false){
 if(typeof v==='string')v=v.trim();
 if(v===null||v===undefined||v===''){if(opcional)return null;throw Error('Valor obrigatório não informado.')}
 let n=v;
 if(typeof v==='string'){
  const s=v.trim();
  if(/^-?\d+\.\d{3}$/.test(s)&&!/^[-]?0\./.test(s))throw Error('Número ambíguo. Use célula numérica ou vírgula decimal.');
  if(s.includes(',')){
   if(!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(s))throw Error('Número inválido.');
   n=Number(s.replaceAll('.','').replace(',','.'));
  }else{if(!/^-?\d+(?:\.\d+)?$/.test(s))throw Error('Número inválido.');n=Number(s)}
 }
 if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>=1e9)throw Error('Use número finito entre zero e 1 bilhão.');
 const arredondado=Number(n.toFixed(6));
 if(Math.abs(n-arredondado)>Number.EPSILON*Math.max(1,n)*4)throw Error('Use no máximo seis casas decimais.');
 return arredondado;
}
export function dataImportacao(v,date1904=false){
 let data;
 if(v instanceof Date){if(!Number.isFinite(v.getTime()))throw Error('Data inválida.');data=v.toISOString().slice(0,10)}
 else if(typeof v==='number'){
  if(!Number.isFinite(v)||v<0||v>2950000||(!date1904&&Math.floor(v)===60))throw Error('Data numérica inválida.');
  data=new Date(Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:30)+(Math.floor(v)+(!date1904&&v<60?1:0))*86400000).toISOString().slice(0,10);
 }else{
  const s=String(v??'').trim();const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  data=br?`${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`:s;
 }
 const calendario=new Date(data+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data)||!Number.isFinite(calendario.getTime())||calendario.toISOString().slice(0,10)!==data)throw Error('Use data válida, como 12/10/2026.');
 return data;
}
function resistencia(c){
 if(c?.erro)throw Error(c.erro);
 if(['opcional','naoinformado','pendente','naonecessario'].includes(normalizarCabecalho(c?.valor)))return null;
 return numeroImportacao(c?.valor,true);
}

export function previaImportacao(aba,cabecalho,mapeamento,data,obra){
 const errosGerais=[];
 const usadas=Object.values(mapeamento).filter(Boolean).map(Number);
 if(new Set(usadas).size!==usadas.length)errosGerais.push('Cada campo precisa de uma coluna diferente.');
 for(const campo of camposImportacao.filter(c=>c.obrigatorio))if(!mapeamento[campo.chave])errosGerais.push(`Selecione a coluna de ${campo.nome}.`);
 if(!aba?.linhas.some(l=>l.numero===Number(cabecalho)))errosGerais.push('Selecione uma linha de cabeçalho existente.');
 if(!data.obras.some(o=>o.id===obra))errosGerais.push('Selecione uma obra.');
 if(errosGerais.length)return {linhas:[],errosGerais,novas:[],volume:0};
 const existentes=new Set(data.notas.filter(n=>n.obra_id===obra).map(n=>n.numero));
 const locais=data.locais.filter(l=>l.obra_id===obra);
 const nomesLocais=new Map();for(const l of locais){const nome=nomeLocalImportacao(l.nome);nomesLocais.set(nome,(nomesLocais.get(nome)||0)+1)}
 const linhas=aba.linhas.filter(l=>l.numero>Number(cabecalho)).map(l=>{
  const c=campo=>l.celulas[mapeamento[campo]];
  let numero='',local='';
  try{
   numero=numeroNF(c('numero'));
   if((['total','subtotal'].includes(normalizarCabecalho(c('data')?.valor))&&!numero)||(!texto(c('data'))&&['total','subtotal'].includes(normalizarCabecalho(numero))))return {linha:l.numero,numero,status:'Ignorada',mensagem:'Linha de total/resumo.'};
   if(existentes.has(numero))return {linha:l.numero,numero,status:'Ignorada',mensagem:'NF já cadastrada nesta obra.'};
   if(!numero||numero.length>120)throw Error('Informe a NF, com até 120 caracteres.');
   local=texto(c('local')).replace(/\s+/g,' ');
   if(!local||local.length>300)throw Error('Informe o local, com até 300 caracteres.');
   const correspondentes=nomesLocais.get(nomeLocalImportacao(local))||0;
   if(correspondentes>1)throw Error('Local ambíguo: há nomes repetidos no cadastro da obra.');
   if(c('fck')?.erro||c('volume')?.erro)throw Error(c('fck')?.erro||c('volume')?.erro);
   const fck=numeroImportacao(c('fck')?.valor),volume=numeroImportacao(c('volume')?.valor);
   if(fck===0||volume===0)throw Error('FCK e volume precisam ser maiores que zero.');
   if(c('data')?.erro)throw Error(c('data').erro);
   const dataNota=dataImportacao(c('data')?.valor,aba.date1904);
   const peca=texto(c('peca_estrutural'));
   if(peca.length>160)throw Error('Peça estrutural: máximo de 160 caracteres.');
   const ensaios=Object.fromEntries(idades.map(i=>[i,{esperado:esperadoFck(fck,i),resultados:[resistencia(c(`r${i}_1`)),resistencia(c(`r${i}_2`))]}]));
   const dispensado=idades.some(i=>[1,2].some(r=>normalizarCabecalho(c(`r${i}_${r}`)?.valor)==='naonecessario'));
   const flag=normalizarCabecalho(texto(c('nao_estrutural')));
   if(flag&&!['sim','nao','true','false','1','0'].includes(flag))throw Error('Peça não estrutural: use Sim ou Não.');
   if(dispensado&&['nao','false','0'].includes(flag))throw Error('Classificação contradiz os ensaios dispensados.');
   const nota={linha:l.numero,numero,local,data:dataNota,fck,volume,slump:texto(c('slump')),peca_estrutural:peca,observacoes:texto(c('observacoes')),nao_estrutural:dispensado||['sim','true','1'].includes(flag),ensaios};
   return {linha:l.numero,numero,local,status:'Nova',mensagem:correspondentes?'Local cadastrado.':'Novo local será cadastrado.',nota};
  }catch(e){return {linha:l.numero,numero,local,status:'Erro',mensagem:e.message}}
 });
 const contagem=new Map();for(const l of linhas)if(l.numero&&l.status!=='Ignorada')contagem.set(l.numero,(contagem.get(l.numero)||0)+1);
 for(const l of linhas)if(contagem.get(l.numero)>1&&l.status!=='Ignorada'){l.status='Erro';l.mensagem='NF repetida na planilha. Mantenha uma única linha por NF.'}
 const novas=linhas.filter(l=>l.status==='Nova').map(l=>l.nota);
 if(novas.length>500)errosGerais.push('Limite de 500 notas novas por importação. Separe o arquivo.');
 if(new TextEncoder().encode(JSON.stringify(novas)).length>1900000)errosGerais.push('Lote muito grande. Separe o arquivo em importações menores.');
 return {linhas,errosGerais,novas,volume:total(novas)};
}
