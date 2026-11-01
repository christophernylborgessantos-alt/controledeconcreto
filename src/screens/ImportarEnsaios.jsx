import {useState} from 'react';
import {importarEnsaios} from '../lib/dados.js';
import {lerExcelImportacao,sugerirColunas,colunasImportacao} from '../lib/importacaoExcel.js';
import {camposEnsaios,previaEnsaios} from '../lib/importacaoEnsaios.js';

export default function ImportarEnsaios({data,obra,setObra,commit,importador=importarEnsaios}){
 const [abas,setAbas]=useState([]),[indice,setIndice]=useState(0),[cabecalho,setCabecalho]=useState(1),[colunas,setColunas]=useState({}),[arquivo,setArquivo]=useState('');
 const [busy,setBusy]=useState(false),[erro,setErro]=useState(''),[confirmando,setConfirmando]=useState(false),[resultado,setResultado]=useState(null),[pagina,setPagina]=useState(1);
 const aba=abas[indice],nome=data.obras.find(o=>o.id===obra)?.nome||'';
 const previa=aba?previaEnsaios(aba,cabecalho,colunas,data,obra):{linhas:[],atualizacoes:[],errosGerais:[]};
 const erros=previa.linhas.filter(l=>l.status==='Erro').length;
 const pode=!busy&&!resultado&&previa.atualizacoes.length>0&&!erros&&!previa.errosGerais.length;
 function selecionar(i,lista=abas){setIndice(i);const h=lista[i].cabecalho;setCabecalho(h);setColunas(sugerirColunas(lista[i],h));setPagina(1);setResultado(null)}
 async function carregar(e){
  const f=e.target.files[0];e.target.value='';if(!f)return;
  setErro('');setAbas([]);setResultado(null);setArquivo('');setConfirmando(false);
  if(!/\.xlsx$/i.test(f.name)||f.size>10*1024*1024){setErro('Selecione um .xlsx de até 10 MB.');return}
  setBusy(true);try{const lista=await lerExcelImportacao(await f.arrayBuffer());setAbas(lista);setArquivo(f.name);selecionar(0,lista)}catch{setErro('Não foi possível ler o Excel. Confira o arquivo .xlsx, sem senha.')}finally{setBusy(false)}
 }
 async function confirmar(){
  if(!pode)return;setBusy(true);setErro('');
  try{const r=await commit(()=>importador(obra,previa.atualizacoes),`Ensaios atualizados na obra ${nome}.`);if(r){setResultado(r);setAbas([])}setConfirmando(false)}
  catch(e){setConfirmando(false);setErro(e.message+' O lote é atômico. Recarregue os dados e confira a prévia antes de tentar novamente.')}
  finally{setBusy(false)}
 }
 return <div className="importacao"><p className="notice">Modelo 2 atualiza apenas resultados dos ensaios. NF deve corresponder exatamente à nota na obra selecionada, incluindo zeros à esquerda. Valores preenchidos substituem os cadastrados, inclusive zero; células vazias preservam. Data, FCK, slump, volume, local, observações e classificação não são alterados.</p>
  <section className="card"><div className="formgrid"><label>Obra de destino<select value={obra} disabled={busy} onChange={e=>{setObra(e.target.value);setAbas([]);setResultado(null);setErro('');setConfirmando(false)}}><option value="">Selecione a obra</option>{data.obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label><label>Planilha de resultados (.xlsx)<input type="file" accept=".xlsx" disabled={busy||!obra} onChange={carregar}/></label></div><p>Até 500 notas por atualização. Obrigatórios: NF e pelo menos uma coluna de resultado. Pode usar sua planilha com data, FCK e slump; essas colunas serão ignoradas. Fórmulas precisam ter resultado salvo no Excel.</p></section>
  {busy&&<p role="status">Processando…</p>}{erro&&<p role="alert">{erro}</p>}{resultado&&<section className="card" role="status">{resultado.atualizadas} notas com ensaios atualizados. Demais dados preservados.</section>}
  {aba&&<><section className="card"><h3>{arquivo}</h3><div className="formgrid"><label>Aba<select disabled={busy} value={indice} onChange={e=>selecionar(Number(e.target.value))}>{abas.map((a,i)=><option key={a.nome} value={i}>{a.nome}</option>)}</select></label><label>Linha do cabeçalho<input type="number" min="1" step="1" disabled={busy} value={cabecalho} onChange={e=>{const h=Number(e.target.value);setCabecalho(h);setColunas(sugerirColunas(aba,h));setPagina(1)}}/></label></div><details><summary>Conferir ou ajustar as colunas</summary><div className="import-column-grid">{camposEnsaios.map(c=><label key={c.chave}>{c.nome}{c.obrigatorio?' *':''}<select disabled={busy} value={colunas[c.chave]||''} onChange={e=>{setColunas({...colunas,[c.chave]:e.target.value?Number(e.target.value):''});setPagina(1)}}><option value="">Não importar</option>{colunasImportacao(aba,cabecalho).map(v=><option key={v.coluna} value={v.coluna}>{v.nome}</option>)}</select></label>)}</div></details>{previa.errosGerais.map(e=><p role="alert" key={e}>{e}</p>)}</section>
  <section className="card"><div className="sectionhead"><h3>Prévia · {nome}</h3><button className="primary" disabled={!pode} onClick={()=>setConfirmando(true)}>Revisar atualização de ensaios</button></div><p>{previa.atualizacoes.length} notas a atualizar · {erros} linhas com erro · {previa.linhas.filter(l=>l.status==='Ignorada').length} linhas preservadas.</p>{erros>0&&<p role="alert">Corrija as linhas com erro antes de confirmar. Nenhuma atualização será feita enquanto houver erros.</p>}<div className="import-table-wrap"><table className="import-table"><thead><tr><th>Linha</th><th>NF</th><th>Resultados: atual → novo (MPa)</th><th>Situação</th></tr></thead><tbody>{previa.linhas.slice((pagina-1)*100,pagina*100).map(l=><tr key={l.linha}><td>{l.linha}</td><td>{l.numero||'—'}</td><td>{l.alteracoes.map(a=><small key={`${a.idade}-${a.resultado}`}>{a.idade} dias R{a.resultado}: {a.antes??'vazio'} → {a.depois}</small>)}</td><td><b>{l.status}</b><small>{l.mensagem}</small></td></tr>)}</tbody></table></div>{previa.linhas.length>100&&<div className="cadastro-actions"><button disabled={busy||pagina===1} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina} de {Math.ceil(previa.linhas.length/100)}</span><button disabled={busy||pagina*100>=previa.linhas.length} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div>}</section></>}
  {confirmando&&<div className="modalback"><section className="modal" role="dialog" aria-modal="true" aria-label="Confirmar atualização de ensaios"><h2>Atualizar ensaios de {nome}?</h2><p>{previa.atualizacoes.length} notas terão resultados atualizados. Valores preenchidos substituirão os existentes. Células vazias preservarão os resultados atuais.</p><p>Nenhuma nota ou local será criado. Os demais dados das notas serão preservados.</p><div className="cadastro-actions"><button autoFocus disabled={busy} onClick={()=>setConfirmando(false)}>Cancelar</button><button className="primary" disabled={!pode} onClick={confirmar}>Confirmar atualização dos ensaios</button></div></section></div>}
 </div>;
}
