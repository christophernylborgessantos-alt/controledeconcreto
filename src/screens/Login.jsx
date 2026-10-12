import {useState} from 'react';
import {entrar,recuperarSenha} from '../lib/dados.js';

export default function Login({initialError=''}) {
  const [error,setError]=useState(initialError);
  const [saving,setSaving]=useState(false);
  const [recovery,setRecovery]=useState(false);
  const [feedback,setFeedback]=useState('');
  async function submit(e){
    e.preventDefault();
    if(saving)return;
    const form=new FormData(e.currentTarget);
    setSaving(true);setError('');setFeedback('');
    try{
      if(recovery){await recuperarSenha(String(form.get('email')).trim());setFeedback('Se o envio estiver disponível para sua conta, você receberá um link por e-mail. Caso não chegue, solicite um novo link de acesso ao gestor.')}
      else await entrar(String(form.get('email')).trim(),String(form.get('senha')))
    }
    catch(e){setError(e.message)}
    finally{setSaving(false)}
  }
  return <div className="authpage"><section className="card authcard"><div className="brand">▦ Concreto</div><h1>{recovery?'Definir ou recuperar senha':'Entrar no controle de concreto'}</h1><p>Use a conta liberada pelo gestor.</p>{recovery&&<p className="notice">Pessoas convidadas devem solicitar ao gestor um novo link de acesso na aba Usuários. A recuperação por e-mail está disponível para a conta gestora.</p>}<form onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="username" required disabled={saving}/></label>{!recovery&&<label>Senha<input name="senha" type="password" autoComplete="current-password" required disabled={saving}/></label>}{error&&<p role="alert">{error}</p>}{feedback&&<p role="status">{feedback}</p>}<button className="primary" disabled={saving}>{saving?'Aguarde…':recovery?'Enviar link por e-mail':'Entrar'}</button><button type="button" disabled={saving} onClick={()=>{setRecovery(v=>!v);setError('');setFeedback('')}}>{recovery?'Voltar para entrar':'Definir ou recuperar senha'}</button></form><p className="notice">Acesso somente por convite. Para liberar sua conta, fale com Christopher.</p></section></div>;
}
