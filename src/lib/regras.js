export const idades=[7,28,63];
export function esperadoFck(fck,idade){return idade===7?Number((Number(fck)*0.7).toFixed(6)):Number(fck)}
export function hoje(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date())}
export function prazo(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function dataBR(d){return d.split('-').reverse().join('/')}
export function situacao(ensaio,date,age,today=hoje(),naoEstrutural=false){if(naoEstrutural)return 'Não necessário';return ensaio.resultados.some(v=>v!==null)?'Preenchido':prazo(date,age)<today?'Vencido':prazo(date,age)===today?'Vence hoje':'No prazo'}
export function baixo(e,naoEstrutural=false){return !naoEstrutural&& e.esperado!==null&&e.resultados.some(v=>v!==null&&v<e.esperado)}
export function opcional63(nota){
  const e=nota.ensaios[28];
  const informados=e.resultados.filter(v=>v!==null);
  return !nota.nao_estrutural&&Number.isFinite(nota.fck)&&informados.length>0&&informados.every(v=>Number.isFinite(v)&&v>=nota.fck);
}
export function situacaoNota(nota,idade,today=hoje()){
  const estado=situacao(nota.ensaios[idade],nota.data,idade,today,nota.nao_estrutural);
  return idade===63&&opcional63(nota)&&estado!=='Preenchido'?'Opcional':estado;
}
export function resumoEnsaios(notas,today=hoje()){
  return Object.fromEntries(idades.map(idade=>{
    const resumo={obrigatorios:0,preenchidos:0,vencidos:0,opcionais:0,opcionaisPreenchidos:0,dispensados:0};
    for(const nota of notas){
      if(nota.nao_estrutural){resumo.dispensados++;continue}
      const estado=situacaoNota(nota,idade,today);
      if(idade===63&&opcional63(nota)){resumo.opcionais++;if(estado==='Preenchido')resumo.opcionaisPreenchidos++;continue}
      resumo.obrigatorios++;
      if(estado==='Preenchido')resumo.preenchidos++;
      if(estado==='Vencido')resumo.vencidos++;
    }
    return [idade,resumo];
  }));
}
export function total(notes){return Number(notes.reduce((s,n)=>s+n.volume,0).toFixed(6))}
export function podeEditar(role){return ['Christopher','Analista'].includes(role)}
export function filtrarNotas(notas,{obra,de='',ate='',local='',numero='',fck='',peca=''}){
  const busca=numero.trim().toLocaleLowerCase('pt-BR');
  return notas.filter(n=>n.obra_id===obra&&(!de||n.data>=de)&&(!ate||n.data<=ate)&&(!local||n.local_id===local)&&(!busca||n.numero.toLocaleLowerCase('pt-BR').includes(busca))&&(fck===''||n.fck===Number(fck))&&(!peca||n.peca_estrutural===peca));
}
export function validarNota(n,notes){if(!n.obra_id||!n.data||!n.numero.trim()||!n.local_id||!(n.volume>0)||!(n.fck>0))throw Error('Preencha obra, data, nota, local, fck e volume maior que zero.');if(notes.some(x=>x.id!==n.id&&x.obra_id===n.obra_id&&x.numero===n.numero))throw Error('Esta nota já existe nesta obra.')}

export function percentual(parte,todo){return todo>0?parte/todo*100:0}
export function comparar(aplicado,teorico){return teorico===null?null:{diferenca:Number((aplicado-teorico).toFixed(6)),percentual:percentual(aplicado,teorico)-100}}
export function resumoLocal(notas,local){
  const aplicado=total(notas.filter(n=>n.obra_id===local.obra_id&&n.local_id===local.id));
  return {aplicado,...comparar(aplicado,local.teorico)};
}

export function montarRelatorio(data,{obra,de='',ate='',local='',numero='',fck='',peca=''}){
  if(de&&ate&&de>ate)throw Error('Confira o período: a data final deve ser igual ou posterior à inicial.');
  const notas=filtrarNotas(data.notas,{obra,de,ate,local,numero,fck,peca})
    .sort((a,b)=>a.data.localeCompare(b.data)||a.numero.localeCompare(b.numero))
    .map(n=>({...n,local:data.locais.find(l=>l.id===n.local_id&&l.obra_id===obra)?.nome||'Local não encontrado'}));
  const locaisSelecionados=[...new Set(notas.map(n=>n.local_id))].map(id=>data.locais.find(l=>l.id===id&&l.obra_id===obra));
  const teorico=locaisSelecionados.length&&locaisSelecionados.every(l=>l&&Number.isFinite(l.teorico))
    ?Number(locaisSelecionados.reduce((s,l)=>s+l.teorico,0).toFixed(6)):null;
  return {obra:data.obras.find(o=>o.id===obra),notas,volume:total(notas),teorico};
}

export function duracaoConcretagem(inicio,termino){
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(termino))return null;
 const minutos=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const duracao=(minutos(termino)-minutos(inicio)+1440)%1440;
 return String(Math.floor(duracao/60)).padStart(2,'0')+':'+String(duracao%60).padStart(2,'0');
}
export function linhasMapa(data,mapa){
 let acumulado=0;
 return filtrarNotas(data.notas,{obra:mapa.obra_id,local:mapa.local_id,de:mapa.desde,ate:mapa.ate}).sort((a,b)=>a.data.localeCompare(b.data)||a.numero.localeCompare(b.numero, 'pt-BR',{numeric:true})||a.id.localeCompare(b.id)).map((n,i)=>{
  acumulado=Number((acumulado+n.volume).toFixed(6));
  const extra=mapa.itens?.find(item=>item.nota_id===n.id)||{};
  return {...n,item:i+1,acumulado,betoneira:extra.betoneira||'',inicio:extra.inicio||'',termino:extra.termino||'',duracao:duracaoConcretagem(extra.inicio,extra.termino)};
 });
}
