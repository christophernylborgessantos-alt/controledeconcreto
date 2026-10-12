import {useState} from 'react';
import {total,percentual,resumoLocal,filtrarNotas,resumoEnsaios,idades} from '../lib/regras.js';
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
  const days=[...new Set(notes.map(n=>n.data))].sort();
  const ensaios=resumoEnsaios(notes);
  const parcial=!!(ativos.de||ativos.ate||ativos.fck);
  return <>
    <div className="sectionhead"><h2>Dashboard de concreto</h2><button onClick={()=>setFiltros({obra,de:'',ate:'',local:'',fck:''})}>Limpar filtros</button></div>
    <p className="notice">Obra: <b>{data.obras.find(o=>o.id===obra)?.nome||'Selecione uma obra'}</b>. Para trocar, use o seletor de obra no topo.</p>
    <div className="filters">
      <label>Desde<input type="date" value={ativos.de} onChange={e=>selecionar('de',e.target.value)}/></label>
      <label>Até<input type="date" min={ativos.de} value={ativos.ate} onChange={e=>selecionar('ate',e.target.value)}/></label>
      <label>Local<select value={ativos.local} onChange={e=>selecionar('local',e.target.value)}><option value="">Todos os locais</option>{locaisObra.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
      <label>FCK · MPa<select value={ativos.fck} onChange={e=>selecionar('fck',e.target.value)}><option value="">Todos os FCKs</option>{[...new Set(todas.map(n=>n.fck))].sort((a,b)=>a-b).map(v=><option key={v} value={v}>{v} MPa</option>)}</select></label>
    </div>
    {invalido&&<p role="alert">A data final deve ser igual ou posterior à inicial.</p>}
    <Stats items={[["Volume aplicado",total(notes)+' m³','Notas que atendem aos filtros'],['Notas',notes.length,'Resultados selecionados'],['Locais com teórico',locais.filter(l=>l.teorico!==null).length,'Locais selecionados, independente do período/FCK']]}/>
    {parcial&&<p className="notice">Os volumes abaixo consideram o período e o FCK selecionados. O teórico permanece sendo o volume total cadastrado do local; ele não é reduzido pelos filtros. O acumulado completo aparece como referência.</p>}
    <section className="card"><h2>Acompanhamento dos ensaios</h2><p className="notice">Notas que atendem aos filtros. O preenchimento considera apenas ensaios obrigatórios; os opcionais de 63 dias e peças não estruturais ficam separados.</p>{idades.map(idade=>{const e=ensaios[idade];return <div className="comparison" key={idade}><b>{idade} dias</b><div className="track"><span style={{width:percentual(e.preenchidos,e.obrigatorios)+'%'}}/></div><p>{e.preenchidos} de {e.obrigatorios} obrigatórios preenchidos · {e.vencidos} vencidos</p>{e.opcionais>0&&<p>{e.opcionais} opcionais · {e.opcionaisPreenchidos} preenchidos</p>}{e.dispensados>0&&<p>{e.dispensados} dispensados por peça não estrutural</p>}{!e.obrigatorios&&<p>Sem ensaios obrigatórios nesta seleção.</p>}</div>})}</section>
    <div className="grid2"><div className="card"><h2>Volume aplicado por dia</h2>{days.map(d=><div className="comparison" key={d}><b>{d.split('-').reverse().join('/')}</b><div className="track"><span style={{width:Math.min(100,percentual(total(notes.filter(n=>n.data===d)),total(notes)))+'%'}}/></div><strong>{total(notes.filter(n=>n.data===d))} m³</strong></div>)}{!days.length&&<p>Nenhuma nota encontrada para os filtros selecionados.</p>}</div>
    <div className="card"><h2>{parcial?'Aplicado na seleção × teórico total':'Aplicado × teórico'}</h2>{locais.map(l=>{
      const resumo=resumoLocal(notes,l);
      const completo=resumoLocal(todas,l);
      return <div className="comparison" key={l.id}><b>{l.nome}</b><div className="value">{resumo.aplicado} <small>m³{parcial?' na seleção':''}</small></div>{l.teorico===null?<p className="label">Teórico não informado</p>:<><span className={'badge '+(resumo.aplicado>l.teorico?'warn':'ok')}>Teórico total: {l.teorico} m³</span><p>Diferença{parcial?' da seleção':''}: {resumo.diferenca.toFixed(1)} m³ ({resumo.percentual.toFixed(1)}%)</p></>}{parcial&&<p>Acumulado completo do local: {completo.aplicado} m³{l.teorico!==null&&<> · diferença: {completo.diferenca.toFixed(1)} m³ ({completo.percentual.toFixed(1)}%)</>}</p>}</div>;
    })}{!locais.length&&<p>Nenhum local cadastrado nesta obra.</p>}</div></div>
  </>;
}
