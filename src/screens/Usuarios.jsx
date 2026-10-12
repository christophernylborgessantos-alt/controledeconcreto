import {useEffect,useState} from 'react';
import {listarUsuarios,convidarUsuario,alterarUsuario,gerarLinkAcesso} from '../lib/dados.js';
import '../usuarios.css';

const categorias=[['Christopher','Engenheiro'],['Analista','Analista'],['Cliente','Cliente']];
const nomeRole=role=>categorias.find(c=>c[0]===role)?.[1]||role;
export default function Usuarios({usuario,api={listarUsuarios,convidarUsuario,alterarUsuario,gerarLinkAcesso}}){
  const [usuarios,setUsuarios]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [feedback,setFeedback]=useState('');
  const [editing,setEditing]=useState(null);
  const [confirmacao,setConfirmacao]=useState(null);
  const [convite,setConvite]=useState(null);
  const [busca,setBusca]=useState('');
  const [reload,setReload]=useState(0);
  useEffect(()=>{
    let cancelado=false;
    setLoading(true);setError('');
    api.listarUsuarios().then(d=>{if(!cancelado)setUsuarios(d)}).catch(e=>{if(!cancelado)setError(e.message)}).finally(()=>{if(!cancelado)setLoading(false)});
    return ()=>{cancelado=true};
  },[reload]);
  function preparar(e){e.preventDefault();setError('');setConfirmacao({...editing})}
  async function confirmar(){
    if(saving)return;
    setSaving(true);setError('');setFeedback('');
    try{
      if(confirmacao.linkAcesso){
        setConvite(await api.gerarLinkAcesso(confirmacao));
        setFeedback("Link de acesso gerado. Compartilhe somente com esta pessoa.");
      }else if(confirmacao.novo){
        const gerado=await api.convidarUsuario(confirmacao);
        setConvite(gerado);setFeedback('Convite gerado. Compartilhe o link apenas com a pessoa indicada.');
      }else{
        await api.alterarUsuario(confirmacao);
        setFeedback(confirmacao.ativo?'Acesso atualizado.':'Acesso desativado. Novas consultas e alterações ficam bloqueadas.');
      }
      setEditing(null);setConfirmacao(null);setReload(r=>r+1);
    }catch(e){setError(e.message)}finally{setSaving(false)}
  }
  async function copiar(){
    try{await navigator.clipboard.writeText(convite.link);setFeedback('Link copiado. Envie somente à pessoa convidada.')}
    catch{setFeedback('Selecione o link abaixo e copie manualmente.')}
  }
  const filtrados=usuarios.filter(u=>(u.nome+' '+u.email).toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  return <><div className="sectionhead"><h2>Gestão de usuários</h2><button className="primary" disabled={saving||loading} onClick={()=>{setError('');setEditing({novo:true,nome:'',email:'',role:'Cliente',ativo:true})}}>+ Convidar pessoa</button></div><p className="notice">Somente sua conta administra acessos. Engenheiro e Analista lançam e excluem notas; Cliente consulta todas as obras. Classificar alguém como Engenheiro não libera esta gestão.</p><div className="users-toolbar"><label>Buscar por nome ou e-mail<input type="search" value={busca} onChange={e=>setBusca(e.target.value)}/></label><button disabled={saving||loading} onClick={()=>setReload(r=>r+1)}>Atualizar lista</button></div>{error&&<p role="alert">{error}</p>}{feedback&&<p role="status">{feedback}</p>}{loading?<p role="status">Carregando usuários…</p>:<div className="users-grid">{filtrados.map(u=><article className="card user-card" key={u.id}><div><h3>{u.nome||u.email}</h3><p className="user-email">{u.email}</p><span className="badge info">{nomeRole(u.role)}</span><span className={'badge '+(u.ativo?'ok':'warn')}>{u.ativo?'Ativo':'Desativado'}</span>{!u.confirmado&&<span className="badge warn">Convite pendente</span>}</div>{u.id===usuario.id?<p className="notice">Sua conta · gestão protegida</p>:<div className="cadastro-actions"><button disabled={saving} onClick={()=>{setError('');setEditing({...u})}}>Alterar acesso</button><button disabled={saving||!u.ativo} onClick={()=>{setError('');setConfirmacao({...u,linkAcesso:true})}}>Gerar link de acesso</button><button disabled={saving} className={u.ativo?'danger':''} onClick={()=>{setError('');setConfirmacao({...u,ativo:!u.ativo})}}>{u.ativo?'Desativar':'Reativar'}</button></div>}</article>)}{!filtrados.length&&<p>Nenhum usuário encontrado.</p>}</div>}{editing&&<div className="modalback"><section className="modal users-modal" role="dialog" aria-modal="true" aria-labelledby="usuario-titulo"><form onSubmit={preparar}><div className="sectionhead"><h2 id="usuario-titulo">{editing.novo?'Convidar pessoa':'Alterar acesso'}</h2><button type="button" disabled={saving} onClick={()=>setEditing(null)}>Fechar</button></div><label>Nome<input maxLength={200} disabled={saving} value={editing.nome} onChange={e=>setEditing({...editing,nome:e.target.value})}/></label><label>E-mail<input required type="email" maxLength={254} disabled={!editing.novo||saving} value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})}/></label><label>Categoria<select disabled={saving} value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value})}>{categorias.map(([id,nome])=><option key={id} value={id}>{nome}</option>)}</select></label>{!editing.novo&&<label>Situação<select disabled={saving} value={String(editing.ativo)} onChange={e=>setEditing({...editing,ativo:e.target.value==='true'})}><option value="true">Ativo</option><option value="false">Desativado</option></select></label>}{error&&<p role="alert">{error}</p>}<button className="primary" disabled={saving}>{editing.novo?'Preparar convite':'Revisar alteração'}</button></form></section></div>}{confirmacao&&<div className="modalback confirm-user"><section className="modal users-modal" role="dialog" aria-modal="true" aria-labelledby="confirmar-usuario"><h2 id="confirmar-usuario">{confirmacao.linkAcesso?'Gerar novo link de acesso?':confirmacao.novo?'Gerar convite para esta pessoa?':'Confirmar alteração de acesso?'}</h2><p><b>{confirmacao.email}</b><br/>Categoria: {nomeRole(confirmacao.role)}<br/>Acesso: {confirmacao.ativo?'Ativo':'Desativado'}</p><p>{confirmacao.linkAcesso?'Este link permitirá definir uma nova senha. A categoria e a situação de acesso permanecem as mesmas.':confirmacao.novo?'O link permitirá que essa pessoa defina sua senha e acesse todas as obras nesta categoria.':confirmacao.ativo?'A pessoa poderá acessar todas as obras com a categoria indicada.':'A conta permanecerá cadastrada, mas não poderá fazer novas consultas ou alterações.'}</p>{error&&<p role="alert">{error}</p>}<div className="cadastro-actions"><button disabled={saving} onClick={()=>setConfirmacao(null)}>Cancelar</button><button className="primary" disabled={saving} onClick={confirmar}>{saving?'Aguarde…':confirmacao.linkAcesso||confirmacao.novo?'Confirmar e gerar link':'Confirmar alteração'}</button></div></section></div>}{convite&&<div className="modalback"><section className="modal users-modal" role="dialog" aria-modal="true" aria-labelledby="link-convite"><h2 id="link-convite">Convite gerado</h2><p>Para: <b>{convite.email}</b></p><label>Link individual<input readOnly value={convite.link} onFocus={e=>e.target.select()}/></label><p className="notice">Compartilhe somente com esta pessoa. O link não fica salvo nesta tela depois que você fechar. Abra o link em qualquer computador ou celular. Ele usa o endereço público do app e permite definir a senha. Links antigos para 127.0.0.1 precisam ser substituídos.</p><div className="cadastro-actions"><button className="primary" onClick={copiar}>Copiar link</button><button onClick={()=>setConvite(null)}>Fechar convite</button></div>{feedback&&<p role="status">{feedback}</p>}</section></div>}</>;
}
