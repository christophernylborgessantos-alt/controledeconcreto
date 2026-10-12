import {useEffect,useRef,useState} from 'react';
import {carregar,observarSessao,perfil,sair,definirSenhaNoAcesso} from './lib/dados.js';
import {idades,situacaoNota,podeEditar} from './lib/regras.js';
import Notas from './screens/Notas.jsx';
import Ensaios from './screens/Ensaios.jsx';
import Dashboards from './screens/Dashboards.jsx';
import Mapeamento from './screens/Mapeamento.jsx';
import Obras from './screens/Obras.jsx';
import Relatorios from './screens/Relatorios.jsx';
import Usuarios from './screens/Usuarios.jsx';
import Login from './screens/Login.jsx';
import DefinirSenha from './screens/DefinirSenha.jsx';

const menu=[['notas','▤','Notas'],['dashboards','▥','Dashboards'],['ensaios','◷','Ensaios'],['obras','⌂','Obras'],['relatorios','▧','Relatórios'],['mapeamento','▦','Mapeamento']];
const vazio=()=>({obras:[],locais:[],notas:[]});

export default function App(){
  const [session,setSession]=useState(undefined);
  const [novaSenha,setNovaSenha]=useState(definirSenhaNoAcesso);
  const [usuario,setUsuario]=useState(null);
  const [data,setData]=useState(vazio);
  const [obra,setObra]=useState('');
  const [page,setPage]=useState('notas');
  const [selected,setSelected]=useState(null);
  const [feedback,setFeedback]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [reload,setReload]=useState(0);
  const epoch=useRef(0);
  const identity=useRef(undefined);
  const userId=session?.user?.id;
  useEffect(()=>{
    try{
      const subscription=observarSessao((s,evento)=>{if(identity.current!==s?.user?.id){epoch.current++;identity.current=s?.user?.id}if(evento==='PASSWORD_RECOVERY')setNovaSenha(true);setSession(s)});
      return ()=>{epoch.current++;subscription.unsubscribe()};
    }catch(e){setError(e.message);setLoading(false);setSession(null)}
  },[]);
  useEffect(()=>{
    let cancelled=false;
    const atual=epoch.current;
    setUsuario(null);setData(vazio());setSelected(null);setFeedback('');setError('');setLoading(true);
    if(!userId){setLoading(false);return}
    (async()=>{
      try{
        const u=await perfil(userId);
        const d=await carregar();
        if(cancelled||atual!==epoch.current)return;
        setUsuario(u);setData(d);setPage(p=>p==='usuarios'&&!u.gestor_usuarios?'notas':p);setObra(o=>d.obras.some(x=>x.id===o)?o:d.obras[0]?.id??'');
      }catch(e){if(!cancelled&&atual===epoch.current)setError(e.message)}
      finally{if(!cancelled&&atual===epoch.current)setLoading(false)}
    })();
    return ()=>{cancelled=true};
  },[userId,reload]);
  async function logout(){try{await sair();epoch.current++;setSession(null);setUsuario(null);setData(vazio());setError('')}catch(e){setFeedback(e.message)}}
  async function commit(operacao,mensagem='Salvo no banco.'){
    const atual=epoch.current;
    setFeedback('');
    const resultado=await operacao();
    if(atual!==epoch.current)return;
    setFeedback(mensagem);
    try{
      const d=await carregar();
      if(atual===epoch.current){setData(d);setObra(o=>d.obras.some(x=>x.id===o)?o:d.obras[0]?.id??'')}
    }catch{if(atual===epoch.current)setFeedback(mensagem+' A atualização da tela falhou. Recarregue os dados.')}
    return resultado;
  }
  function goto(p){setSelected(null);setFeedback('');setPage(p)}
  if(session===undefined)return <div className="authpage"><p role="status">Conferindo sua sessão…</p></div>;
  if(!session)return <Login initialError={error}/>;
  if(novaSenha)return <DefinirSenha concluir={()=>setNovaSenha(false)} sair={logout}/>;
  if(loading||!usuario||usuario.id!==userId)return <div className="authpage"><section className="card authcard"><h1>Concreto</h1>{loading?<p role="status">Carregando seu acesso…</p>:<><p role="alert">{error||'Não foi possível carregar seu acesso.'}</p><button onClick={()=>setReload(v=>v+1)}>Tentar novamente</button></>}<button onClick={logout}>Sair</button>{feedback&&<p role="alert">{feedback}</p>}</section></div>;
  const role=usuario.role;
  const nomeAcesso=role==='Christopher'?'Engenheiro':role;
  const menuDisponivel=usuario.gestor_usuarios?[...menu,['usuarios','♙','Usuários']]:menu;
  const pending=data.notas.filter(n=>n.obra_id===obra).reduce((s,n)=>s+idades.filter(a=>situacaoNota(n,a)==='Vencido').length,0);
  const props={data,obra,role,commit,setObra};
  return <><aside className="sidebar"><div className="brand"><span>▦</span> Concreto</div><small>Controle de notas e ensaios</small><nav className="nav" aria-label="Principal">{menuDisponivel.map(([p,icon,label])=><button key={p} className={page===p?'active':''} onClick={()=>goto(p)}><span className="symbol">{icon}</span>{label}</button>)}</nav><div className="user">{usuario.nome||nomeAcesso}<br/><small>{nomeAcesso} · {data.obras.length} obras</small><button onClick={logout}>Sair</button></div></aside><main><header className="header"><div className="topline"><div><h1>{menuDisponivel.find(m=>m[0]===page)?.[2]} de concreto</h1><p>{data.obras.find(o=>o.id===obra)?.nome||'Cadastre a primeira obra'}</p></div><span className="previewtag">Dados no banco<br/>Acesso: {nomeAcesso}</span></div></header><div className="content"><div className="toolbar">{data.obras.length>0&&page!=='usuarios'&&<label>Obra<select value={obra} onChange={e=>{setObra(e.target.value);setSelected(null)}}>{data.obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label>}<button onClick={()=>setReload(v=>v+1)}>Recarregar dados e formulários</button><button className="mobile-logout" onClick={logout}>Sair</button></div>{pending>0&&page!=='usuarios'&&<div className="alertbox"><b>{pending} ensaios vencidos nesta obra</b><p>Faltam resultados para completar o acompanhamento.</p><button onClick={()=>goto('ensaios')}>Consultar pendências</button></div>}{feedback&&<p role="status">{feedback}</p>}{!data.obras.length&&page!=='obras'&&page!=='usuarios'?<section className="card"><h2>Nenhuma obra cadastrada</h2><p>{podeEditar(role)?'Comece cadastrando uma obra e seus locais de aplicação.':'As obras aparecerão aqui após o cadastro pela equipe.'}</p>{podeEditar(role)&&<button className="primary" onClick={()=>goto('obras')}>Cadastrar primeira obra</button>}</section>:<>{page==='notas'&&<Notas key={obra+role+reload} {...props} verEnsaios={id=>{setPage('ensaios');setSelected(id)}}/>}{page==='ensaios'&&<Ensaios key={obra+role+reload} {...props} selected={selected} onSelect={setSelected}/>} {page==='dashboards'&&<Dashboards key={obra} {...props}/>} {page==='mapeamento'&&<Mapeamento key={obra+role+reload} {...props}/>} {page==='obras'&&<Obras key={reload} {...props} goto={goto}/>} {page==='relatorios'&&<Relatorios key={obra+reload} {...props}/>} {page==='usuarios'&&usuario.gestor_usuarios&&<Usuarios usuario={usuario}/>}</>}</div></main><nav className={'bottom '+(usuario.gestor_usuarios?'admin-nav':'')} aria-label="Principal no celular">{menuDisponivel.map(([p,icon,label])=><button key={p} className={page===p?'active':''} onClick={()=>goto(p)}><span className="symbol">{icon}</span>{label}</button>)}</nav></>;
}
