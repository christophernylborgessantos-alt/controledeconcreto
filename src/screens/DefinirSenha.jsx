import {useState} from 'react';
import {definirSenha} from '../lib/dados.js';

export default function DefinirSenha({concluir,sair}){
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  async function submit(e){
    e.preventDefault();if(saving)return;
    const form=new FormData(e.currentTarget),senha=String(form.get('senha'));
    if(senha!==form.get('confirmacao')){setError('As senhas precisam ser iguais.');return}
    setSaving(true);setError('');
    try{await definirSenha(senha);concluir()}
    catch(e){setError(e.message)}finally{setSaving(false)}
  }
  return <div className="authpage"><section className="card authcard"><h1>Definir sua senha</h1><p>Escolha uma senha para os próximos acessos.</p><form onSubmit={submit}><label>Nova senha<input type="password" name="senha" autoComplete="new-password" required minLength={8} disabled={saving}/></label><label>Confirmar senha<input type="password" name="confirmacao" autoComplete="new-password" required minLength={8} disabled={saving}/></label>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={saving}>{saving?'Salvando…':'Salvar senha'}</button><button type="button" disabled={saving} onClick={sair}>Sair</button></form></section></div>;
}
