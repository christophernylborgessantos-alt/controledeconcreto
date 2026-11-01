import {idades,hoje,prazo,situacaoNota,opcional63,esperadoFck,baixo,total} from './regras.js';

export function filtrosVisaoGeral(obra){return {obra,de:'',ate:'',local:'',peca:'',fcks:[],meses:[],idades:[],situacoes:[],faixas:[]}}
export function alternarFiltro(filtros,campo,valor){
 const lista=filtros[campo];return {...filtros,[campo]:lista.includes(valor)?lista.filter(v=>v!==valor):[...lista,valor]};
}
const media=valores=>valores.length?Number((valores.reduce((s,v)=>s+v,0)/valores.length).toFixed(6)):null;
const percentual=(parte,todo)=>todo?parte/todo*100:null;
const informados=(nota,idade)=>nota.nao_estrutural?[]:nota.ensaios[idade].resultados.filter(Number.isFinite);
function faixa28(nota){
 const valores=informados(nota,28);if(!valores.length||!Number.isFinite(nota.fck)||nota.fck<=0)return null;
 const melhor=Math.max(...valores);
 // Compara seis casas decimais sem erro de ponto flutuante no limite de105%.
 const acima105=BigInt(Math.round(melhor*1e6))*100n>=BigInt(Math.round(nota.fck*1e6))*105n;
 return acima105?'acima105':melhor>=nota.fck?'atingido':'abaixo';
}
function serie(nota,idade,today){
 const valores=informados(nota,idade),obrigatorio=!nota.nao_estrutural&&!(idade===63&&opcional63(nota));
 const esperado=esperadoFck(nota.fck,idade);
 return {nota,idade,resultado:media(valores),melhor:valores.length?Math.max(...valores):null,situacao:situacaoNota(nota,idade,today),abaixo:baixo({esperado,resultados:nota.ensaios[idade].resultados},nota.nao_estrutural,idade),obrigatorio,elegivel:obrigatorio&&prazo(nota.data,idade)<=today};
}
function correspondeSituacao(s,situacoes){
 return !situacoes.length||situacoes.some(v=>v==='Abaixo do esperado'?s.abaixo:v==='Atingido'?s.melhor!==null&&s.melhor>=esperadoFck(s.nota.fck,s.idade):s.situacao===v);
}
function slumpNumerico(valor){
 if(typeof valor==='number')return Number.isFinite(valor)&&valor>=0?valor:null;
 const s=String(valor??'').trim();return /^\d+(?:[.,]\d+)?$/.test(s)?Number(s.replace(',','.')):null;
}

export function obterVisaoGeral(data,opcoes,today=hoje()){
 const f={...filtrosVisaoGeral(opcoes.obra),...opcoes};
 const idadesAtivas=idades.filter(i=>!f.idades.length||f.idades.includes(i));
 const candidatas=f.de&&f.ate&&f.de>f.ate?[]:data.notas.filter(n=>n.obra_id===f.obra&&(!f.de||n.data>=f.de)&&(!f.ate||n.data<=f.ate)&&(!f.local||n.local_id===f.local)&&(!f.peca||n.peca_estrutural===f.peca)&&(!f.fcks.length||f.fcks.includes(n.fck))&&(!f.meses.length||f.meses.includes(n.data.slice(0,7)))&&(!f.faixas.length||f.faixas.includes(faixa28(n))));
 const notas=candidatas.filter(n=>!f.situacoes.length||idadesAtivas.some(i=>correspondeSituacao(serie(n,i,today),f.situacoes)));
 const series=notas.flatMap(n=>idadesAtivas.map(i=>serie(n,i,today))).filter(s=>correspondeSituacao(s,f.situacoes));
 const cobertura=idades.map(idade=>{
  const lista=series.filter(s=>s.idade===idade),elegiveis=lista.filter(s=>s.elegivel),preenchidos=elegiveis.filter(s=>s.resultado!==null).length;
  return {idade,preenchidos,elegiveis:elegiveis.length,percentual:percentual(preenchidos,elegiveis.length),opcionais:lista.filter(s=>s.idade===63&&!s.nota.nao_estrutural&&opcional63(s.nota)).length,dispensados:lista.filter(s=>s.nota.nao_estrutural).length};
 });
 const s28=series.filter(s=>s.idade===28&&s.melhor!==null),atingidas28=s28.filter(s=>s.melhor>=s.nota.fck).length;
 const local=n=>data.locais.find(l=>l.id===n.local_id&&l.obra_id===f.obra)?.nome||'Local não encontrado';
 const pendencias=series.filter(s=>s.obrigatorio&&s.resultado===null).map(s=>({nota:s.nota,id:s.nota.id+'-'+s.idade,numero:s.nota.numero,data:s.nota.data,idade:s.idade,prazo:prazo(s.nota.data,s.idade),situacao:s.situacao,fck:s.nota.fck,local:local(s.nota)})).sort((a,b)=>a.prazo.localeCompare(b.prazo)||a.numero.localeCompare(b.numero));
 const porMes=[...new Set(notas.map(n=>n.data.slice(0,7)))].sort().map(mes=>{
  const lista=notas.filter(n=>n.data.startsWith(mes));return {mes,notas:lista.length,volume:total(lista),medias:Object.fromEntries(idades.map(i=>[i,media(series.filter(s=>s.idade===i&&s.nota.data.startsWith(mes)&&s.resultado!==null).map(s=>s.resultado))]))};
 });
 const porFck=[...new Set(notas.map(n=>n.fck))].sort((a,b)=>a-b).map(fck=>({fck,notas:notas.filter(n=>n.fck===fck).length,media28:media(s28.filter(s=>s.nota.fck===fck).map(s=>s.resultado)),slump:media(notas.filter(n=>n.fck===fck).map(n=>slumpNumerico(n.slump)).filter(v=>v!==null))}));
 const faixas=[['acima105','Acima ou igual a 105%'],['atingido','De 100% a menos de 105%'],['abaixo','Abaixo de 100%']].map(([chave,nome])=>({chave,nome,quantidade:s28.filter(s=>faixa28(s.nota)===chave).length}));
 const recentes=[...notas].sort((a,b)=>b.data.localeCompare(a.data)||a.numero.localeCompare(b.numero)).map(n=>{const valores=informados(n,28),melhor=valores.length?Math.max(...valores):null;return {...n,local:local(n),resultado28:melhor,situacao28:n.nao_estrutural?'Não necessário':melhor===null?'Pendente':melhor>=n.fck?'Atingido':'Abaixo do esperado'}});
 return {notas,series,resumo:{notas:notas.length,volume:total(notas),series:series.filter(s=>s.resultado!==null).length,atingidas28,informadas28:s28.length,atingido28:percentual(atingidas28,s28.length),pendencias:pendencias.length,cobertura:Object.fromEntries(cobertura.map(c=>[c.idade,c]))},porMes,porFck,faixas,pendencias,recentes,idades:cobertura};
}
