import {useState} from 'react';
import {importarNotas} from '../lib/dados.js';
import {podeEditar,dataBR,opcional63} from '../lib/regras.js';
import {lerExcelImportacao,camposImportacao,colunasImportacao,sugerirColunas,previaImportacao,nomeLocalImportacao} from '../lib/importacaoExcel.js';
import {Stats} from '../components/index.jsx';
import '../importacao.css';

export default function Importar({data,obra,setObra,role,commit,importador=importarNotas}){
 const [abas,setAbas]=useState([]),[indice,setIndice]=useState(0),[cabecalho,setCabecalho]=useState(1),[colunas,setColunas]=useState({}),[arquivo,setArquivo]=useState('');
 const [busy,setBusy]=useState(false),[erro,setErro]=useState(''),[confirmando,setConfirmando]=useState(false),[resultado,setResultado]=useState(null),[pagina,setPagina]=useState(1);
 const aba=abas[indice];
 const previa=aba?previaImportacao(aba,cabecalho,colunas,data,obra):{linhas:[],novas:[],errosGerais:[],volume:0};
 const ignoradas=previa.linhas.filter(l=>l.status==='Ignorada').length,erros=previa.linhas.filter(l=>l.status==='Erro').length;
 const obraNome=data.obras.find(o=>o.id===obra)?.nome||'';
 const locaisNovos=new Set(previa.novas.filter(n=>!data.locais.some(l=>l.obra_id===obra&&nomeLocalImportacao(l.nome)===nomeLocalImportacao(n.local))).map(n=>nomeLocalImportacao(n.local))).size;
 const podeImportar=!busy&&previa.novas.length>0&&!erros&&!previa.errosGerais.length;
 function selecionarAba(n,lista=abas){setIndice(n);const h=lista[n].cabecalho;setCabecalho(h);setColunas(sugerirColunas(lista[n],h));setPagina(1);setResultado(null)}
 async function carregar(event){
  const file=event.target.files[0];event.target.value='';if(!file)return;
  setErro('');setResultado(null);setAbas([]);setArquivo('');
  if(!/\.xlsx$/i.test(file.name)||file.size>10*1024*1024){setErro('Selecione um arquivo Excel .xlsx de até 10 MB. Para arquivos .xls, salve uma cópia como .xlsx no Excel.');return}
  setBusy(true);
  try{const lista=await lerExcelImportacao(await file.arrayBuffer());setAbas(lista);setArquivo(file.name);selecionarAba(0,lista)}
  catch{setErro('Não foi possível ler o Excel. Use um .xlsx válido, sem senha, e confira se foi salvo corretamente.')}
  finally{setBusy(false)}
 }
 async function confirmar(){
  if(!podeImportar)return;setBusy(true);setErro('');
  try{
   const r=await commit(()=>importador(obra,previa.novas),`Importação concluída na obra ${obraNome}.`);
   if(r){setResultado({...r,obra:obraNome});setConfirmando(false)}
  }catch(e){setConfirmando(false);setErro(e.message+' Não foi possível confirmar o lote. Recarregue os dados antes de tentar novamente; NFs já cadastradas serão ignoradas.')}
  finally{setBusy(false)}
 }
 if(!podeEditar(role))return <section className="card"><h2>Importar dados</h2><p>Seu perfil permite consulta. Apenas Engenheiro e Analista podem importar notas.</p></section>;
 return <div className="importacao">
  <h2>Importar dados</h2><p className="notice">Importe notas e ensaios de uma aba do Excel. NFs já cadastradas na obra serão preservadas. O arquivo é lido neste navegador; somente as notas confirmadas são enviadas ao banco.</p>
  <section className="card"><div className="formgrid"><label>Obra de destino<select value={obra} disabled={busy} onChange={e=>setObra(e.target.value)}><option value="">Selecione a obra</option>{data.obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label><label>Planilha Excel (.xlsx)<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy||!obra} onChange={carregar}/></label></div><p className="notice">Selecione a obra antes de carregar o arquivo. Obrigatórios: data de aplicação, NF, local, FCK e volume. Opcionais: slump, peça estrutural, observações, classificação não estrutural e R1/R2 de 7, 28 e 63 dias. Fórmulas usam o resultado salvo no Excel; abra e salve o arquivo antes de importar. Use a coluna NF como texto para preservar zeros à esquerda. Todas as linhas da aba escolhida são consideradas, inclusive linhas ocultas.</p><p className="notice">Até 500 notas novas por importação. Locais novos serão criados sem volume teórico. Teóricos já cadastrados serão preservados; colunas de teórico da planilha não são importadas.</p></section>
  {busy&&<p role="status">Aguarde, processando…</p>}{erro&&<p role="alert" className="badge critical">{erro}</p>}
  {resultado&&<section className="card" role="status"><h3>Importação concluída · {resultado.obra}</h3><p>{resultado.criadas} notas criadas · {resultado.ignoradas} NFs ignoradas no banco · {resultado.locais_criados} locais criados.</p>{resultado.nfs_ignoradas?.length>0&&<p>NFs preservadas: {resultado.nfs_ignoradas.map(n=>n.numero).join(', ')}</p>}<p>As notas e ensaios já podem ser consultados nas demais abas. Nenhuma nota existente foi alterada.</p></section>}
  {aba&&<><section className="card"><h3>{arquivo}</h3><div className="formgrid"><label>Aba da planilha<select disabled={busy} value={indice} onChange={e=>selecionarAba(Number(e.target.value))}>{abas.map((a,i)=><option value={i} key={a.nome}>{a.nome}</option>)}</select></label><label>Linha do cabeçalho<input type="number" min="1" step="1" disabled={busy} value={cabecalho} onChange={e=>{const h=Number(e.target.value);setCabecalho(h);setColunas(sugerirColunas(aba,h));setPagina(1)}}/></label></div><details><summary>Conferir ou ajustar as colunas</summary><div className="import-column-grid">{camposImportacao.map(c=><label key={c.chave}>{c.nome}{c.obrigatorio?' *':''}<select disabled={busy} value={colunas[c.chave]||''} onChange={e=>{setColunas({...colunas,[c.chave]:e.target.value?Number(e.target.value):''});setPagina(1)}}><option value="">{c.obrigatorio?'Selecione a coluna':'Não importar este campo'}</option>{colunasImportacao(aba,cabecalho).map(v=><option value={v.coluna} key={v.coluna}>{v.coluna} · {v.nome}</option>)}</select></label>)}</div></details>{colunasImportacao(aba,cabecalho).some(c=>!Object.values(colunas).map(Number).includes(c.coluna))&&<p className="notice">Colunas não importadas: {colunasImportacao(aba,cabecalho).filter(c=>!Object.values(colunas).map(Number).includes(c.coluna)).map(c=>c.nome).join(', ')}. Confira os ajustes se contiverem dados de notas ou ensaios.</p>}{previa.errosGerais.map(e=><p role="alert" key={e}>{e}</p>)}</section>
   <div className="importacao-stats"><Stats items={[["Notas novas",previa.novas.length,'Serão criadas'],['Linhas ignoradas',ignoradas,'NFs existentes e linhas de resumo'],['Linhas com erro',erros,'Corrija antes de importar'],['Volume novo',previa.volume.toLocaleString('pt-BR')+' m³','Somente as notas novas']]}/></div>
   <section className="card"><div className="sectionhead"><h3>Prévia · {obraNome}</h3><button className="primary" disabled={!podeImportar} onClick={()=>setConfirmando(true)}>Revisar e importar</button></div>{erros>0&&<p role="alert">Corrija as linhas com erro no Excel e carregue o arquivo novamente. O lote não será importado enquanto houver erros.</p>}<div className="import-table-wrap"><table className="import-table"><thead><tr><th>Linha</th><th>NF</th><th>Aplicação</th><th>Local / peça</th><th>FCK · MPa</th><th>Volume · m³</th><th>Ensaios · MPa</th><th>Situação</th></tr></thead><tbody>{previa.linhas.slice((pagina-1)*100,pagina*100).map(l=><tr key={l.linha}><td>{l.linha}</td><td>{l.numero||'—'}</td><td>{l.nota?dataBR(l.nota.data):'—'}</td><td>{l.local||'—'}{l.nota?.peca_estrutural&&<small>Peça: {l.nota.peca_estrutural}</small>}</td><td>{l.nota?.fck??'—'}{l.nota?.slump&&<small>Slump: {l.nota.slump}</small>}</td><td>{l.nota?.volume??'—'}</td><td>{l.nota?<>{l.nota.nao_estrutural&&<small>Peça não estrutural</small>}{[7,28,63].map(i=><small key={i}>{i} dias: {l.nota.ensaios[i].resultados.map(v=>v===null?(i===63&&opcional63(l.nota)?'Opcional':'—'):v.toLocaleString('pt-BR')).join(' / ')}</small>)}</>:'—'}</td><td><b className={l.status==='Erro'?'import-error':''}>{l.status}</b><small>{l.mensagem}</small></td></tr>)}</tbody></table></div>{!previa.linhas.length&&<p>Nenhuma linha para importar. Confira a aba, o cabeçalho e as colunas.</p>}{previa.linhas.length>100&&<div className="cadastro-actions"><button disabled={busy||pagina===1} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina} de {Math.ceil(previa.linhas.length/100)}</span><button disabled={busy||pagina*100>=previa.linhas.length} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div>}</section>
  </>}
  {confirmando&&<div className="modalback"><section className="modal" role="dialog" aria-modal="true" aria-label="Confirmar importação"><h2>Importar para {obraNome}?</h2><p>{previa.novas.length} notas novas · {previa.volume.toLocaleString('pt-BR')} m³ · {locaisNovos} novos locais.</p><p>{ignoradas} linhas serão ignoradas na prévia. O banco confere novamente as NFs; notas já existentes não serão sobrescritas. Resultados disponíveis de 7, 28 e 63 dias serão incluídos.</p><p>Confira a obra e a prévia antes de confirmar.</p><div className="cadastro-actions"><button autoFocus disabled={busy} onClick={()=>setConfirmando(false)}>Cancelar</button><button className="primary" disabled={!podeImportar} onClick={confirmar}>{busy?'Importando…':'Confirmar importação'}</button></div></section></div>}
 </div>;
}
