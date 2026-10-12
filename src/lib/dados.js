import {supabase} from './supabase.js';
export {definirSenhaNoAcesso} from './supabase.js';
import {idades,validarNota} from './regras.js';

function erroBanco(error) {
  if (error.code==='40001') return 'Esta nota foi alterada por outra pessoa. Recarregue antes de continuar.';
  if (error.code==='23505') return 'Já existe um registro com esses dados nesta obra.';
  if (error.code==='42501') return 'Seu perfil não possui autorização para esta operação.';
  if (['23514','23503','22P02','22003'].includes(error.code)) return 'Confira os valores e o local da obra. Use números finitos, menores que 1 bilhão, com até seis casas decimais.';
  return 'Não foi possível concluir a operação. Confira sua conexão e tente novamente.';
}
async function conferir(promise) {
  const {data,error} = await promise;
  if (error) throw Error(erroBanco(error));
  return data;
}
async function todos(query){
  const linhas=[];
  for(let inicio=0;;inicio+=500){
    const pagina=await conferir(query.order('id').range(inicio,inicio+499));
    linhas.push(...pagina);
    if(pagina.length<500)return linhas;
  }
}
function validarResistencias(ensaios) {
  for (const idade of idades) {
    const e=ensaios[idade];
    if (!e || e.resultados?.length!==2 || [e.esperado,...e.resultados].some(v=>v!==null&&(!Number.isFinite(v)||v<0))) {
      throw Error('Use resistências iguais ou maiores que zero; o segundo resultado de cada idade é opcional.');
    }
  }
}
export function criarDados(cliente) {
  function conectar() {
    if (!cliente) throw Error('Configure a conexão Supabase para entrar no sistema.');
    return cliente;
  }
  async function gestao(body){
    const {data,error}=await conectar().functions.invoke('usuarios',{body});
    if(error){
      let mensagem='Não foi possível concluir a gestão de usuários. Entre novamente ou tente recarregar.';
      if(error.context?.json){try{mensagem=(await error.context.json()).erro||mensagem}catch{/* Resposta de erro sem JSON. */}}
      throw Error(mensagem);
    }
    return data;
  }
  return {
    async listarUsuarios(){return (await gestao({acao:'listar'})).usuarios},
    async gerarLinkAcesso(usuario){return gestao({acao:'link_acesso',id:usuario.id})},
    async convidarUsuario(usuario){return gestao({acao:'convidar',nome:usuario.nome,email:usuario.email,role:usuario.role})},
    async alterarUsuario(usuario){return gestao({acao:'alterar',id:usuario.id,nome:usuario.nome,role:usuario.role,ativo:usuario.ativo})},
    async entrar(email,senha) {
      const {data,error}=await conectar().auth.signInWithPassword({email,password:senha});
      if (error) throw Error('Não foi possível entrar. Confira e-mail e senha ou solicite seu convite.');
      return data.session;
    },
    async sair() { await conferir(conectar().auth.signOut()); },
    async definirSenha(senha) {
      if(senha.length<8)throw Error('Use uma senha com pelo menos oito caracteres.');
      await conferir(conectar().auth.updateUser({password:senha}));
    },
    async recuperarSenha(email) {
      await conferir(conectar().auth.resetPasswordForEmail(email,{redirectTo:globalThis.location?.origin}));
    },
    async sessaoAtual() { return (await conferir(conectar().auth.getSession())).session; },
    observarSessao(callback) { return conectar().auth.onAuthStateChange((evento,sessao)=>callback(sessao,evento)).data.subscription; },
    async perfil(id) {
      const perfil=await conferir(conectar().from('profiles').select('id,nome,role,ativo,gestor_usuarios').eq('id',id).single());
      if (!perfil.ativo) throw Error('Seu acesso aguarda liberação de Christopher.');
      return perfil;
    },
    async carregar() {
      const c=conectar();
      const [obras,locais,notas]=await Promise.all([
        todos(c.from('obras').select('id,nome,tipo')),
        todos(c.from('locais').select('id,obra_id,nome,teorico')),
        todos(c.from('notas').select('id,obra_id,local_id,numero,data,fck,slump,volume,observacoes,versao,nao_estrutural,ensaios(idade,esperado,resultado_1,resultado_2)'))
      ]);
      return {obras:obras.sort((a,b)=>a.nome.localeCompare(b.nome)),locais:locais.map(l=>({...l,teorico:l.teorico===null?null:Number(l.teorico)})),notas:notas.map(n=>{
        const porIdade=Object.fromEntries(n.ensaios.map(e=>[e.idade,{esperado:e.esperado===null?null:Number(e.esperado),resultados:[e.resultado_1,e.resultado_2].map(v=>v===null?null:Number(v))}]));
        if (idades.some(i=>!porIdade[i])) throw Error('Esta nota está sem uma idade de ensaio. Solicite a conferência do cadastro.');
        return {...n,volume:Number(n.volume),fck:Number(n.fck),ensaios:porIdade};
      })};
    },
    async salvarNota(nota) {
      validarNota(nota,[]);
      return conferir(conectar().rpc('salvar_nota',{p_nota:{id:nota.id,obra_id:nota.obra_id,local_id:nota.local_id,numero:nota.numero.trim(),data:nota.data,fck:nota.fck,slump:nota.slump,volume:nota.volume},p_versao:nota.versao??null}));
    },
    async salvarEnsaios(nota) {
      validarResistencias(nota.ensaios);
      return conferir(conectar().rpc('salvar_ensaios',{p_id:nota.id,p_versao:nota.versao,p_ensaios:{...nota.ensaios,nao_estrutural:nota.nao_estrutural===true},p_observacoes:nota.observacoes}));
    },
    async excluirNota(nota){
      return conferir(conectar().rpc('excluir_nota',{p_id:nota.id,p_versao:nota.versao}));
    },
    async salvarTeorico(id,value) {
      if(value!==null&&(!Number.isFinite(value)||value<=0)) throw Error('O volume teórico deve ser maior que zero, ou ficar vazio.');
      return conferir(conectar().from('locais').update({teorico:value,updated_at:new Date().toISOString()}).eq('id',id).select('id').single());
    },
    async salvarObra(obra) {
      const campos={nome:obra.nome.trim(),tipo:obra.tipo.trim()};
      if(!campos.nome) throw Error('Informe o nome da obra.');
      const q=obra.id?conectar().from('obras').update({...campos,updated_at:new Date().toISOString()}).eq('id',obra.id):conectar().from('obras').insert(campos);
      // Na criação, o vínculo de leitura só existe após o gatilho AFTER INSERT.
      return conferir(obra.id?q.select('id').single():q);
    },
    async salvarLocal(local) {
      const nome=local.nome.trim();
      if(!nome||!local.obra_id) throw Error('Informe o nome do local e sua obra.');
      const teorico=local.teorico??null;
      if(!local.id&&teorico!==null&&(!Number.isFinite(teorico)||teorico<=0))throw Error('O volume teórico deve ser maior que zero, ou ficar vazio.');
      const q=local.id?conectar().from('locais').update({nome,updated_at:new Date().toISOString()}).eq('id',local.id):conectar().from('locais').insert({nome,obra_id:local.obra_id,teorico});
      return conferir(q.select('id').single());
    }
  };
}
export const {entrar,sair,definirSenha,recuperarSenha,sessaoAtual,observarSessao,perfil,carregar,salvarNota,salvarEnsaios,excluirNota,salvarTeorico,salvarObra,salvarLocal,listarUsuarios,convidarUsuario,alterarUsuario,gerarLinkAcesso}=criarDados(supabase);
