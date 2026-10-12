import {useEffect,useState} from 'react';
import * as dados from '../lib/dados.js';
import {hoje,dataBR,podeEditar,linhasMapa} from '../lib/regras.js';
import '../mapeamento.css';

export default function Mapeamento({data,obra,role,commit, repositorio=dados}){
 const {listarMapas,obterMapa,salvarMapa,excluirMapa}=repositorio;
 const [mapas,setMapas]=useState([]),[mapa,setMapa]=useState(null),[erro,setErro]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[exclusao,setExclusao]=useState(false);
 const can=podeEditar(role),locais=data.locais.filter(l=>l.obra_id===obra);
 const rows=mapa?.local_id&&mapa.desde&&mapa.ate&&mapa.desde<=mapa.ate?linhasMapa(data,mapa):[];
 useEffect(()=>{let atual=true;setBusy(true);listarMapas(obra).then(m=>{if(atual)setMapas(m)}).catch(e=>{if(atual)setErro(e.message)}).finally(()=>{if(atual)setBusy(false)});return()=>{atual=false}},[obra,listarMapas]);
 function podeTrocar(){return !dirty||window.confirm('Descartar as alterações ainda não salvas deste mapa?')}
 async function abrir(id){if(!podeTrocar())return;setBusy(true);setErro('');try{setMapa(await obterMapa(id));setDirty(false)}catch(e){setErro(e.message)}finally{setBusy(false)}}
 function novo(){if(!podeTrocar())return;setErro('');setMapa({obra_id:obra,local_id:'',peca:'',desde:hoje(),ate:hoje(),imagem:null,itens:[]});setDirty(true)}
 function alterar(campos){setMapa({...mapa,...campos});setDirty(true)}
 function item(nota_id,campo,valor){const itens=mapa.itens.filter(i=>i.nota_id!==nota_id);const anterior=mapa.itens.find(i=>i.nota_id===nota_id)||{nota_id,betoneira:'',inicio:'',termino:''};alterar({itens:[...itens,{...anterior,[campo]:valor}]})}
 async function imagem(event){const arquivo=event.target.files[0];event.target.value='';if(!arquivo)return;setErro('');if(!['image/jpeg','image/png','image/webp'].includes(arquivo.type)||arquivo.size>2*1024*1024){setErro('Use uma imagem JPG, PNG ou WebP de até 2 MB.');return}setBusy(true);try{
  const conteudo=await new Promise((resolve,reject)=>{const leitor=new FileReader();leitor.onload=()=>resolve(leitor.result);leitor.onerror=()=>reject(Error('Não foi possível ler a imagem.'));leitor.readAsDataURL(arquivo)});
  await new Promise((resolve,reject)=>{const foto=new Image();foto.onload=resolve;foto.onerror=()=>reject(Error('O arquivo não é uma imagem válida.'));foto.src=conteudo});
  alterar({imagem:conteudo});
 }catch(e){setErro(e.message)}finally{setBusy(false)}}
 async function salvar(){setBusy(true);setErro('');try{
  const payload={...mapa,itens:rows.map(r=>({nota_id:r.id,betoneira:r.betoneira,inicio:r.inicio,termino:r.termino}))};
  const id=await commit(()=>salvarMapa(payload),'Mapa salvo no banco.');
  setMapa({...payload,id,versao:(mapa.versao||0)+1});setDirty(false);
  setMapa(await obterMapa(id));setMapas(await listarMapas(obra));
 }catch(e){setErro(e.message)}finally{setBusy(false)}}
 async function apagar(){setBusy(true);setErro('');try{await commit(()=>excluirMapa(mapa),'Mapa excluído. As notas foram preservadas.');setMapa(null);setDirty(false);setExclusao(false);setMapas(await listarMapas(obra))}catch(e){setErro(e.message)}finally{setBusy(false)}}
 const numero=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:6});
 return <div className="mapeamento">
  <div className="map-controls"><div className="sectionhead"><h2>Mapeamento de concreto</h2>{can&&<button className="primary" disabled={busy} onClick={novo}>Novo mapa</button>}</div>
  <label>Mapas desta obra<select disabled={busy} value={mapa?.id||''} onChange={e=>e.target.value&&abrir(e.target.value)}><option value="">Selecione um mapa</option>{mapas.map(m=><option key={m.id} value={m.id}>{m.peca} · {dataBR(m.desde)} a {dataBR(m.ate)}</option>)}</select></label>
  {!mapas.length&&!busy&&<p>Nenhum mapa cadastrado nesta obra.{can?' Clique em Novo mapa para começar.':''}</p>}
  {busy&&<p role="status">Aguarde…</p>}{erro&&<p role="alert">{erro}</p>}</div>
  {mapa&&<article className="card map-sheet"><h1>MAPEAMENTO DE CONCRETO</h1><p className="map-work">{data.obras.find(o=>o.id===obra)?.nome}</p>
   <div className="map-controls formgrid"><label>Peça concretada<input maxLength={160} list="map-pecas" disabled={!can||busy} value={mapa.peca} onChange={e=>alterar({peca:e.target.value})}/><datalist id="map-pecas">{locais.map(l=><option key={l.id} value={l.nome}/>)}</datalist></label>
    <label>Local das notas<select disabled={!can||busy} value={mapa.local_id} onChange={e=>alterar({local_id:e.target.value,peca:mapa.peca||locais.find(l=>l.id===e.target.value)?.nome||''})}><option value="">Selecione o local</option>{locais.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
    <label>Aplicação desde<input type="date" disabled={!can||busy} value={mapa.desde} onChange={e=>alterar({desde:e.target.value})}/></label><label>Aplicação até<input type="date" min={mapa.desde} disabled={!can||busy} value={mapa.ate} onChange={e=>alterar({ate:e.target.value})}/></label>
   </div>
   <div className="map-print-only map-identification"><b>PEÇA: {mapa.peca}</b><b>LOCAL: {locais.find(l=>l.id===mapa.local_id)?.nome}</b></div><p className="map-print-only">Aplicação: {mapa.desde&&dataBR(mapa.desde)} a {mapa.ate&&dataBR(mapa.ate)}</p>
   {can&&<div className="map-controls map-image-controls"><label>Imagem de rastreabilidade<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={imagem}/></label>{mapa.imagem&&<button disabled={busy} onClick={()=>alterar({imagem:null})}>Remover imagem</button>}<small>JPG, PNG ou WebP, até 2 MB. A imagem é salva junto com o mapa.</small></div>}
   {mapa.imagem?<img className="map-image" src={mapa.imagem} alt={'Rastreabilidade da peça '+mapa.peca}/>:<p className="map-image-empty">Imagem de rastreabilidade não inserida.</p>}
   <p className="notice">Data, NF e volumes vêm das notas do local e período selecionados. O acumulado soma apenas estas notas, em ordem de data e NF. Horários são informados por nota; término anterior ao início conta como dia seguinte.</p>
   <div className="map-table-wrap"><table className="map-table"><thead><tr>{['ITEM','DATA','NF','BETONEIRA','INÍCIO','TÉRMINO','DURAÇÃO','VOL. (m³)','VOL. ACUMULADO (m³)'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.item}</td><td>{dataBR(r.data)}</td><td>{r.numero}</td>{['betoneira','inicio','termino'].map(c=><td key={c}><span className="map-print-only">{r[c]||'—'}</span><input aria-label={(c==='betoneira'?'Betoneira':c==='inicio'?'Início':'Término')+' da NF '+r.numero} type={c==='betoneira'?'text':'time'} maxLength={c==='betoneira'?100:undefined} disabled={!can||busy} className="map-controls" value={r[c]} onChange={e=>item(r.id,c,e.target.value)}/></td>)}<td>{r.duracao||'—'}</td><td>{numero(r.volume)}</td><td>{numero(r.acumulado)}</td></tr>)}</tbody><tfoot><tr><th colSpan={7}>Total do mapa</th><td>{numero(rows.at(-1)?.acumulado||0)}</td><td>{numero(rows.at(-1)?.acumulado||0)}</td></tr></tfoot></table></div>
   {!rows.length&&<p>Nenhuma nota para este local e período. É possível salvar o mapa e preencher as notas depois.</p>}
   <div className="map-controls cadastro-actions">{can&&<button className="primary" disabled={busy} onClick={salvar}>Salvar mapa</button>}<button disabled={busy||dirty||!mapa.id} onClick={()=>window.print()}>Imprimir / salvar como PDF</button>{can&&mapa.id&&<button disabled={busy} onClick={()=>setExclusao(true)}>Excluir mapa</button>}</div>{dirty&&<p className="map-controls notice">Há alterações não salvas. Salve para confirmar e imprimir.</p>}
  </article>}
  {exclusao&&<div className="modalback"><section className="modal" role="dialog" aria-modal="true" aria-label="Excluir mapa"><h2>Excluir mapa “{mapa.peca}”?</h2><p>O mapa, a imagem e os dados de betoneira e horários serão removidos definitivamente. As notas fiscais e ensaios serão preservados.</p><div className="cadastro-actions"><button autoFocus disabled={busy} onClick={()=>setExclusao(false)}>Cancelar</button><button disabled={busy} onClick={apagar}>Excluir mapa definitivamente</button></div>{erro&&<p role="alert">{erro}</p>}</section></div>}
 </div>;
}
