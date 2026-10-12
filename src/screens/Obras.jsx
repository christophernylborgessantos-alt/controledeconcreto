import {useState} from 'react';
import {podeEditar,total} from '../lib/regras.js';
import {salvarTeorico,salvarObra,salvarLocal} from '../lib/dados.js';

export default function Obras({data,role,commit,setObra,goto}){
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const [editing,setEditing]=useState(null);
  const can=podeEditar(role);
  async function executar(op,fecha=false){
    if(saving)return;
    setSaving(true);setError('');
    try{await commit(op);if(fecha)setEditing(null)}
    catch(e){setError(e.message)}
    finally{setSaving(false)}
  }
  function save(e,l){
    e.preventDefault();
    const v=new FormData(e.currentTarget).get('teorico');
    executar(()=>salvarTeorico(l.id,v===''?null:Number(v)));
  }
  function salvarCadastro(e){
    e.preventDefault();
    executar(()=>editing.entidade==='obra'?salvarObra(editing):salvarLocal(editing),true);
  }
  return <><div className="sectionhead"><h2>Obras e locais</h2>{can&&<button className="primary" disabled={saving} onClick={()=>{setError('');setEditing({entidade:'obra',nome:'',tipo:''})}}>+ Nova obra</button>}</div><p className="notice">Cada obra possui seus próprios locais. O volume teórico é opcional.</p>{error&&<p role="alert">{error}</p>}{!data.obras.length&&<div className="card"><p>{can?'Cadastre a primeira obra e depois seus locais de aplicação.':'Ainda não existem obras cadastradas pela equipe.'}</p></div>}<div className="works">{data.obras.map(o=><article className="card" key={o.id}><h3>{o.nome}</h3><p className="label">{o.tipo}</p><div className="value">{total(data.notas.filter(n=>n.obra_id===o.id))} <small>m³</small></div><button onClick={()=>{setObra(o.id);goto('notas')}}>Ver notas desta obra</button>{can&&<div className="cadastro-actions"><button disabled={saving} onClick={()=>{setError('');setEditing({...o,entidade:'obra'})}}>Editar obra</button><button disabled={saving} onClick={()=>{setError('');setEditing({entidade:'local',obra_id:o.id,nome:''})}}>+ Novo local</button></div>}{data.locais.filter(l=>l.obra_id===o.id).map(l=><form className="comparison" key={l.id} onSubmit={e=>save(e,l)}><label>{l.nome} · teórico em m³<input key={String(l.teorico)} disabled={!can||saving} name="teorico" type="number" step="any" min="0.000001" defaultValue={l.teorico??''} placeholder="Opcional"/></label>{can&&<div className="cadastro-actions"><button disabled={saving}>Salvar teórico</button><button type="button" disabled={saving} onClick={()=>{setError('');setEditing({...l,entidade:'local'})}}>Editar local</button></div>}</form>)}</article>)}</div>{editing&&<div className="modalback"><section className="modal" role="dialog" aria-modal="true" aria-label={editing.entidade==='obra'?'Cadastro de obra':'Cadastro de local'}><form onSubmit={salvarCadastro}><div className="sectionhead"><h2>{editing.id?'Editar':'Cadastrar'} {editing.entidade==='obra'?'obra':'local'}</h2><button type="button" disabled={saving} onClick={()=>setEditing(null)}>Fechar</button></div><label>Nome<input autoFocus required disabled={saving} value={editing.nome} onChange={e=>setEditing({...editing,nome:e.target.value})}/></label>{editing.entidade==='obra'&&<label>Tipo de estrutura<input disabled={saving} value={editing.tipo} placeholder="Ex.: concreto armado" onChange={e=>setEditing({...editing,tipo:e.target.value})}/></label>}{error&&<p role="alert">{error}</p>}<button className="primary" disabled={saving}>{saving?'Salvando…':'Salvar cadastro'}</button></form></section></div>}</>;
}
