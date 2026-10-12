import {useState} from 'react';
import {esperadoFck,montarRelatorio,idades,hoje,dataBR,situacaoNota,opcional63} from '../lib/regras.js';
import '../relatorios.css';

const numero=v=>v===null?'Não informado':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:6}).format(v);
export default function Relatorios({data,obra}){
  const [de,setDe]=useState('');
  const [ate,setAte]=useState('');
  const [local,setLocal]=useState('');
  const [nota,setNota]=useState('');
  const [fck,setFck]=useState('');
  const [conteudo,setConteudo]=useState('ambos');
  const [idade,setIdade]=useState('');
  const [exportando,setExportando]=useState(false);
  const [erroExcel,setErroExcel]=useState('');
  const locais=data.locais.filter(l=>l.obra_id===obra);
  const notasObra=data.notas.filter(n=>n.obra_id===obra);
  const idadesSelecionadas=idade?[Number(idade)]:idades;
  const tituloRelatorio=conteudo==='notas'?'Relatório de notas e volumes':conteudo==='ensaios'?'Relatório de ensaios':'Relatório de notas e ensaios';
  function limpar(){setDe('');setAte('');setLocal('');setNota('');setFck('');setConteudo('ambos');setIdade('')}
  let relatorio,error;
  try{relatorio=montarRelatorio(data,{obra,de,ate,local,numero:nota,fck})}catch(e){error=e.message}
  const hojeRelatorio=hoje();
  const periodo=de&&ate?`${dataBR(de)} a ${dataBR(ate)}`:de?`A partir de ${dataBR(de)}`:ate?`Até ${dataBR(ate)}`:'Todas as datas de aplicação';
  async function exportarExcel(){
    if(exportando||error||!relatorio?.notas.length)return;
    setExportando(true);setErroExcel('');
    try{
      const {gerarExcelRelatorio}=await import('../lib/relatorioExcel.js');
      const buffer=await gerarExcelRelatorio(relatorio);
      const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link=document.createElement('a');
      link.href=url;
      link.download='Concreto-'+relatorio.obra.nome.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,60)+'-'+hojeRelatorio+'.xlsx';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch{setErroExcel('Não foi possível gerar o Excel. Tente novamente.')}finally{setExportando(false)}
  }
  function imprimir(){
    const titulo=document.title;
    document.title=`Relatório de concreto — ${relatorio.obra.nome} — ${hojeRelatorio}`;
    try{window.print()}finally{document.title=titulo}
  }
  return <><div className="report-controls"><div className="sectionhead"><h2>{tituloRelatorio}</h2><button onClick={limpar}>Limpar filtros</button><button className="primary" disabled={!!error||!relatorio?.notas.length} onClick={imprimir}>Imprimir / salvar como PDF</button><button disabled={exportando||!!error||!relatorio?.notas.length} onClick={exportarExcel}>{exportando?'Gerando Excel…':'Exportar Excel'}</button></div>{erroExcel&&<p role="alert">{erroExcel}</p>}<div className="filters report-filters"><label>Aplicação desde<input type="date" value={de} onChange={e=>setDe(e.target.value)}/></label><label>Aplicação até<input type="date" min={de||undefined} value={ate} onChange={e=>setAte(e.target.value)}/></label><label>Local<select value={local} onChange={e=>setLocal(e.target.value)}><option value="">Todos os locais</option>{locais.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></label><label>Número da nota<input type="search" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Todo ou parte do número"/></label><label>FCK · MPa<select value={fck} onChange={e=>setFck(e.target.value)}><option value="">Todos os FCKs</option>{[...new Set(notasObra.map(n=>n.fck))].sort((a,b)=>a-b).map(v=><option key={v} value={v}>{v} MPa</option>)}</select></label><label>Conteúdo para impressão<select value={conteudo} onChange={e=>setConteudo(e.target.value)}><option value="ambos">Notas, volumes e ensaios</option><option value="notas">Somente notas e volumes</option><option value="ensaios">Somente ensaios</option></select></label><label>Idade dos ensaios<select value={idade} disabled={conteudo==='notas'} onChange={e=>setIdade(e.target.value)}><option value="">Todas as idades</option>{idades.map(i=><option key={i} value={i}>{i} dias</option>)}</select></label></div><p className="notice">Selecione a obra acima. O período filtra pela aplicação do concreto. A prévia abaixo mostra exatamente as notas e o conteúdo que serão impressos. O Excel inclui as notas filtradas com todos os resultados de 7, 28 e 63 dias; as escolhas de conteúdo e idade se aplicam à impressão/PDF. O volume teórico aparece só no Total, contado uma vez por local das notas exportadas. Para gerar PDF, escolha “Salvar como PDF” na janela de impressão.</p></div>{error?<p role="alert">{error}</p>:!relatorio.notas.length?<section className="card"><h3>Nenhuma nota para os filtros selecionados</h3><p>Ajuste os filtros ou selecione outra obra.</p></section>:<article className="card relatorio-impressao"><header className="report-heading"><p className="report-brand">CONTROLE DE CONCRETO</p><h1>{tituloRelatorio}</h1><h2>{relatorio.obra.nome}</h2><p>Período: {periodo}<br/>Local: {local?locais.find(l=>l.id===local)?.nome:'Todos'} · FCK: {fck?fck+' MPa':'Todos'}<br/>Busca por nota: {nota.trim()||'Todas'}{conteudo!=='notas'&&<> · Ensaios: {idade?idade+' dias':'Todas as idades'}</>}<br/>Emitido em {dataBR(hojeRelatorio)} · America/Sao_Paulo</p><div className="report-summary"><b>{relatorio.notas.length} notas</b>{conteudo!=='ensaios'&&<b>Volume total: {numero(relatorio.volume)} m³</b>}</div></header><div className="report-table-wrap"><table className="report-table report-unified"><thead><tr><th>Aplicação</th><th>NF</th><th>Local</th><th>FCK (MPa)</th>{conteudo!=='ensaios'&&<><th>Slump</th><th>Volume (m³)</th></>}{conteudo!=='notas'&&idadesSelecionadas.flatMap(a=>[<th key={a+'r1'}>{a} dias R1</th>,<th key={a+'r2'}>{a} dias R2</th>])}</tr></thead><tbody>{relatorio.notas.map(n=><tr key={n.id}><td>{dataBR(n.data)}</td><td>{n.numero}{n.nao_estrutural&&<small className="report-piece">Peça não estrutural</small>}</td><td>{n.local}</td><td className="report-number">{numero(n.fck)}</td>{conteudo!=='ensaios'&&<><td>{n.slump||'Não informado'}</td><td className="report-number">{numero(n.volume)}</td></>}{conteudo!=='notas'&&idadesSelecionadas.flatMap(a=>{
 const e=n.ensaios[a];
 return e.resultados.map((v,i)=><td key={a+'r'+i} title={n.nao_estrutural?'Não necessário':situacaoNota(n,a,hojeRelatorio)} className={!n.nao_estrutural&&v!==null&&v<esperadoFck(n.fck,a)?'report-low report-number':typeof v==='number'?'report-number':''}>{n.nao_estrutural?'Não necessário':v!==null?numero(v):a===63&&opcional63(n)?'Opcional':e.resultados.some(r=>r!==null)?'Não informado':'Pendente'}</td>);
})}</tr>)}</tbody>{conteudo!=='ensaios'&&<tfoot><tr><th colSpan={5}>Total das notas selecionadas</th><td className="report-number">{numero(relatorio.volume)}</td>{conteudo!=='notas'&&<td colSpan={idadesSelecionadas.length*2}/>}</tr></tfoot>}</table></div>{conteudo!=='notas'&&<p className="report-explanation">Resultados em MPa; o esperado é 70% do FCK aos 7 dias e 100% aos 28 e 63 dias. Um resultado já preenche a idade, inclusive zero. Pendente: idade sem resultados. Opcional: 63 dias dispensados porque os resultados informados de 28 dias atingiram o FCK. Peças não estruturais não exigem ensaios. Valores abaixo do esperado para a idade são destacados; isso não representa aceitação estrutural.</p>}{relatorio.notas.some(n=>n.observacoes?.trim())&&<section className="report-observacoes"><h2>Observações</h2>{relatorio.notas.filter(n=>n.observacoes?.trim()).map(n=><p key={n.id}><b>NF {n.numero}:</b> {n.observacoes}</p>)}</section>}</article>}</>;
}
