const roles=['Christopher','Analista','Cliente'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function criarHandler(admin,appUrl){
 const origem=new URL(appUrl).origin;
 const origens=[origem,'http://127.0.0.1:5175','http://localhost:5175'];
 async function todosUsuarios(){
  const users=[];
  for(let page=1;;page++){
   const {data,error}=await admin.auth.admin.listUsers({page,perPage:200});
   if(error)throw Error('Não foi possível listar usuários.');
   users.push(...data.users);
   if(data.users.length<200)return users;
  }
 }
 async function alterar(gestor,id,nome,role,ativo){
  const {error}=await admin.rpc('administrar_perfil',{p_gestor:gestor,p_id:id,p_nome:nome,p_role:role,p_ativo:ativo});
  if(error)throw Error('Não foi possível alterar o acesso. Recarregue a lista e tente novamente.');
 }
 return async req=>{
  const origemPedido=req.headers.get('Origin');
  const headers={'Access-Control-Allow-Origin':origens.includes(origemPedido)?origemPedido:origem,'Vary':'Origin','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type,x-supabase-client-platform,x-supabase-client-platform-version,x-supabase-client-runtime,x-supabase-client-runtime-version','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  const resposta=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(origemPedido&&!origens.includes(origemPedido))return resposta(403,{erro:'Origem não autorizada.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return resposta(405,{erro:'Método não permitido.'});
  try{
   const authorization=req.headers.get('Authorization')??'';
   if(!authorization.startsWith('Bearer '))return resposta(401,{erro:'Entre novamente para continuar.'});
   const {data:identidade,error:erroAuth}=await admin.auth.getUser(authorization.slice(7));
   if(erroAuth||!identidade.user)return resposta(401,{erro:'Sua sessão não é válida. Entre novamente.'});
   const gestor=identidade.user.id;
   const {data:perfil,error:erroPerfil}=await admin.from('profiles').select('ativo,gestor_usuarios').eq('id',gestor).single();
   if(erroPerfil||!perfil?.ativo||!perfil?.gestor_usuarios)return resposta(403,{erro:'Somente a conta gestora pode administrar usuários.'});
   let body;try{body=await req.json()}catch{return resposta(400,{erro:'Pedido inválido.'})}
   if(!body||typeof body!=='object')return resposta(400,{erro:'Pedido inválido.'});
   if(body.acao==='listar'){
    const users=await todosUsuarios(),lista=[];
    for(let inicio=0;inicio<users.length;inicio+=200){
     const lote=users.slice(inicio,inicio+200);
     const {data:profiles,error}=await admin.from('profiles').select('id,nome,role,ativo,gestor_usuarios').in('id',lote.map(u=>u.id));
     if(error)throw Error('Não foi possível carregar os perfis.');
     for(const u of lote){
      const p=profiles.find(p=>p.id===u.id);
      if(p)lista.push({...p,email:u.email??'',confirmado:!!u.email_confirmed_at});
     }
    }
    return resposta(200,{usuarios:lista.sort((a,b)=>a.email.localeCompare(b.email))});
   }
   if(body.acao==='alterar'){
    if(body.id===gestor)return resposta(403,{erro:'Sua própria conta não pode ser alterada nesta tela.'});
    if(!uuid.test(body.id??'')||!roles.includes(body.role)||typeof body.ativo!=='boolean'||typeof body.nome!=='string'||body.nome.length>200)return resposta(400,{erro:'Confira a categoria e os dados do usuário.'});
    await alterar(gestor,body.id,body.nome.trim(),body.role,body.ativo);
    return resposta(200,{ok:true});
   }
   if(body.acao==='link_acesso'){
    if(body.id===gestor)return resposta(403,{erro:'Use a recuperação de senha da tela de login para sua própria conta.'});
    if(!uuid.test(body.id??''))return resposta(400,{erro:'Usuário inválido.'});
    const alvo=(await todosUsuarios()).find(u=>u.id===body.id);
    const {data:perfilAlvo,error}=await admin.from('profiles').select('ativo').eq('id',body.id).single();
    if(error||!alvo?.email||!perfilAlvo?.ativo)return resposta(400,{erro:'Reative o acesso antes de gerar um link.'});
    const {data,error:erroLink}=await admin.auth.admin.generateLink({type:alvo.email_confirmed_at?'recovery':'invite',email:alvo.email,options:{redirectTo:appUrl}});
    if(erroLink||!data.properties?.action_link)return resposta(400,{erro:'Não foi possível gerar o link de acesso.'});
    return resposta(200,{email:alvo.email,link:data.properties.action_link});
   }
   if(body.acao==='convidar'){
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    const nome=typeof body.nome==='string'?body.nome.trim():'';
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||nome.length>200||!roles.includes(body.role))return resposta(400,{erro:'Informe e-mail válido e categoria.'});
    const existente=(await todosUsuarios()).find(u=>u.email?.toLowerCase()===email);
    if(existente?.email_confirmed_at)return resposta(409,{erro:'Essa pessoa já possui conta. Altere o acesso na lista.'});
    const {data,error}=await admin.auth.admin.generateLink({type:'invite',email,options:{redirectTo:appUrl}});
    if(error||!data.user||!data.properties?.action_link)return resposta(400,{erro:'Não foi possível gerar o convite. Confira o e-mail e tente novamente.'});
    try{await alterar(gestor,data.user.id,nome,body.role,true)}
    catch{return resposta(500,{erro:'A conta foi criada, mas não foi liberada. Recarregue a lista para conferir o acesso.'})}
    return resposta(200,{id:data.user.id,email,link:data.properties.action_link});
   }
   return resposta(400,{erro:'Operação não reconhecida.'});
  }catch(error){
   return resposta(500,{erro:error.message==='Não foi possível alterar o acesso. Recarregue a lista e tente novamente.'?error.message:'Não foi possível concluir a gestão de usuários. Tente novamente.'});
  }
 };
}
