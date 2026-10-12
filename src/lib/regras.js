export const idades=[7,28,63];
export function hoje(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date())}
export function prazo(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function dataBR(d){return d.split('-').reverse().join('/')}
export function situacao(ensaio,date,age,today=hoje()){return ensaio.resultados.every(v=>v!==null)?'Preenchido':prazo(date,age)<today?'Vencido':prazo(date,age)===today?'Vence hoje':'No prazo'}
export function baixo(e){return e.esperado!==null&&e.resultados.some(v=>v!==null&&v<e.esperado)}
export function total(notes){return Number(notes.reduce((s,n)=>s+n.volume,0).toFixed(6))}
export function podeEditar(role){return ['Christopher','Analista'].includes(role)}
export function validarNota(n,notes){if(!n.obra_id||!n.data||!n.numero.trim()||!n.local_id||!(n.volume>0)||!(n.fck>0))throw Error('Preencha obra, data, nota, local, fck e volume maior que zero.');if(notes.some(x=>x.id!==n.id&&x.obra_id===n.obra_id&&x.numero===n.numero))throw Error('Esta nota já existe nesta obra.')}

export function percentual(parte,todo){return todo>0?parte/todo*100:0}
export function comparar(aplicado,teorico){return teorico===null?null:{diferenca:Number((aplicado-teorico).toFixed(6)),percentual:percentual(aplicado,teorico)-100}}

export function montarRelatorio(data,{obra,de='',ate=''}){
  if(de&&ate&&de>ate)throw Error('Confira o período: a data final deve ser igual ou posterior à inicial.');
  const notas=data.notas.filter(n=>n.obra_id===obra&&(!de||n.data>=de)&&(!ate||n.data<=ate))
    .sort((a,b)=>a.data.localeCompare(b.data)||a.numero.localeCompare(b.numero))
    .map(n=>({...n,local:data.locais.find(l=>l.id===n.local_id&&l.obra_id===obra)?.nome||'Local não encontrado'}));
  return {obra:data.obras.find(o=>o.id===obra),notas,volume:total(notas)};
}
