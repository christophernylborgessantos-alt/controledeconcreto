import {useState} from 'react';
import {total,resumoLocal,filtrarNotas,resumoEnsaios,idades,hoje,dataBR} from '../lib/regras.js';
import {Stats} from '../components/index.jsx';

export default function Dashboards({data,obra}){
  const [filtros,setFiltros]=useState({obra,de:'',ate:'',local:'',fck:''});
  const ativos=filtros.obra===obra?filtros:{obra,de:'',ate:'',local:'',fck:''};
  const selecionar=(campo,valor)=>setFiltros({...ativos,[campo]:valor});
  const todas=data.notas.filter(n=>n.obra_id===obra);
  const locaisObra=data.locais.filter(l=>l.obra_id===obra);
  const locais=locaisObra.filter(l=>!ativos.local||l.id===ativos.local);
  const invalido=ativos.de&&ativos.ate&&ativos.de>ativos.ate;
  const notes=invalido?[]:filtrarNotas(todas,{...ativos,obra});
  const comTeorico=locais.filter(l=>Number.isFinite(l.teorico));
  const aplicadoComparavel=total(notes.filter(n=>comTeorico.some(l=>l.id===n.local_id)));
  const teorico=comTeorico.reduce((s,l)=>s+l.teorico,0);
  const desvio=comTeorico.length?Number((aplicadoComparavel-teorico).toFixed(6)):null;
  const formatar=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:6});
  const ensaios=resumoEnsaios(notes);
  const parcial=!!(ativos.de||ativos.ate||ativos.fck);
  return <article className="dashboard-print">
    <header className="dashboard-print-heading"><h1>Dashboard de concreto</h1><h2>{data.obras.find(o=>o.id===obra)?.nome}</h2><p>Aplicação: {ativos.de?dataBR(ativos.de):'Desde o início'} até {ativos.ate?dataBR(ativos.ate):'Todas as datas'}<br/>Local: {ativos.local?locaisObra.find(l=>l.id===ativos.local)?.nome:'Todos'} · FCK: {ativos.fck?ativos.fck+' MPa':'Todos'}<br/>Emitido em {dataBR(hoje())} · America/Sao_Paulo</p></header>
    <div className="dashboard-controls">
    <div className="sectionhead"><h2>Dashboard de concreto</h2><button disabled={!!invalido} className="primary" onClick={()=>window.print()}>Imprimir / salvar como PDF</button><button onClick={()=>setFiltros({obra,de:'',ate:'',local:'',fck:''})}>Limpar filtros</button></div>
    <p className="notice">Obra: <b>{data.obras.find(o=>o.id===obra)?.nome||'Selecione uma obra'}</b>. Para trocar, use o seletor de obra no topo.</p>
    <div className="filters">
      <label>Desde<input type="date" value={ativos.de} onChange={e=>selecionar('de',e.target.value)}/></label>
      <label>Até<input type="date" min={ativos.de} value={ativos.ate} onChange={e=>selecionar('ate',e.target.value)}/></label>
      <label>Local<select value={ativos.local} onChange={e=>selecionar('local',e.target.value)}><option value="">Todos os locais</option>{locaisObra.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
      <label>FCK · MPa<select value={ativos.fck} onChange={e=>selecionar('fck',e.target.value)}><option value="">Todos os FCKs</option>{[...new Set(todas.map(n=>n.fck))].sort((a,b)=>a-b).map(v=><option key={v} value={v}>{v} MPa</option>)}</select></label>
    </div>
    </div>
    {invalido&&<p role="alert">A data final deve ser igual ou posterior à inicial.</p>}
    <div className="dashboard-stats"><Stats items={[["Volume aplicado",formatar(total(notes))+' m³','Notas que atendem aos filtros'],['Desvio de volume',desvio===null?'Não informado':(desvio>0?'+':'')+formatar(desvio)+' m³','Aplicado menos teórico; somente locais com teórico'],['Notas',notes.length,'Notas selecionadas'],['Locais com valor teórico',comTeorico.length,'Locais selecionados com teórico cadastrado']]}/></div>
    {parcial&&<p className="notice">O aplicado segue o período e o FCK selecionados. O teórico é o total cadastrado do local. O desvio desta seleção não representa o saldo final da obra.</p>}
    <section className="card dashboard-comparison"><h2>Aplicado × teórico</h2><p className="notice">Desvio positivo: acima do teórico. Negativo: abaixo. Locais sem teórico não entram no indicador de desvio.</p><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Local</th><th>Aplicado (m³)</th><th>Teórico (m³)</th><th>Desvio (m³)</th>{parcial&&<th>Acumulado completo (m³)</th>}</tr></thead><tbody>{locais.map(l=>{const r=resumoLocal(notes,l);return <tr key={l.id}><th scope="row">{l.nome}</th><td>{formatar(r.aplicado)}</td><td>{l.teorico===null?'Não informado':formatar(l.teorico)}</td><td>{r.diferenca===undefined?'Não informado':<span className={'badge '+(r.diferenca>0?'warn':'info')}>{r.diferenca>0?'+':''}{formatar(r.diferenca)}</span>}</td>{parcial&&<td>{formatar(resumoLocal(todas,l).aplicado)}</td>}</tr>})}</tbody></table></div>{!locais.length&&<p>Nenhum local cadastrado nesta obra.</p>}</section>
    <section className="card dashboard-assays"><h2>Acompanhamento dos ensaios</h2><p className="notice">Resumo das notas filtradas. Pendentes inclui os vencidos; opcionais e peças não estruturais ficam fora dessa contagem.</p><div className="dashboard-age-summary">{idades.map(idade=>{const e=ensaios[idade];return <div className="dashboard-age-card" key={idade}><h3>{idade} dias</h3><strong>{e.preenchidos} / {e.obrigatorios}</strong><small>obrigatórios preenchidos</small><p>{e.obrigatorios-e.preenchidos} pendentes <span className={'badge '+(e.vencidos?'critical':'info')}>{e.vencidos} vencidos</span></p>{e.opcionais>0&&<small>{e.opcionais} opcionais ({e.opcionaisPreenchidos} preenchidos)</small>}</div>})}</div>{notes.some(n=>n.nao_estrutural)&&<p className="notice">{notes.filter(n=>n.nao_estrutural).length} notas de peças não estruturais dispensadas.</p>}{!notes.length&&<p>Nenhuma nota encontrada para os filtros selecionados.</p>}</section>
  </article>;
}
