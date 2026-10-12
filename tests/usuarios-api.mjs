import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
const arquivo=new URL('../supabase/functions/usuarios/handler.js',import.meta.url);
let existe=true;try{await access(arquivo)}catch{existe=false}
assert.ok(existe,'API administrativa precisa validar a identidade no servidor');
const {criarHandler}=await import(arquivo.href);
function cliente(perfil){return {
 auth:{getUser:async()=>({data:{user:{id:'gestor'}},error:null}),admin:{listUsers:async()=>({data:{users:[]},error:null})}},
 from:()=>({select:()=>({eq:()=>({single:async()=>({data:perfil,error:null})})})})
}}
const request=body=>new Request('https://teste.invalid',{method:'POST',headers:{Authorization:'Bearer jwt-teste','Content-Type':'application/json'},body:JSON.stringify(body)});
const comum=criarHandler(cliente({ativo:true,gestor_usuarios:false}),'http://127.0.0.1:5175');
assert.equal((await comum(request({acao:'listar'}))).status,403);
const pendente=criarHandler(cliente({ativo:false,gestor_usuarios:true}),'http://127.0.0.1:5175');
assert.equal((await pendente(request({acao:'listar'}))).status,403);
const gestor=criarHandler(cliente({ativo:true,gestor_usuarios:true}),'http://127.0.0.1:5175');
assert.equal((await gestor(new Request('https://teste.invalid',{method:'POST'}))).status,401);
assert.equal((await gestor(request({acao:'alterar',id:'gestor',role:'Cliente',ativo:false}))).status,403);
assert.equal((await gestor(request({acao:'alterar',id:'outro',role:'administrador',ativo:true}))).status,400);
assert.equal((await gestor(request({acao:'convidar',email:'invalido',role:'Cliente'}))).status,400);
console.log('Usuários API: identidade, gestão exclusiva, inativo, auto-desativação e entrada inválida verificados.');
const alvo='00000000-0000-4000-8000-000000000099';
const rpcCalls=[];
const sucesso={
 auth:{getUser:async()=>({data:{user:{id:'gestor'}},error:null}),admin:{
  listUsers:async()=>({data:{users:[{id:alvo,email:'teste@example.invalid',email_confirmed_at:null}]},error:null}),
  generateLink:async()=>({data:{user:{id:alvo},properties:{action_link:'https://exemplo.invalid/convite'}},error:null})
 }},
 from:()=>({select:()=>({eq:()=>({single:async()=>({data:{ativo:true,gestor_usuarios:true},error:null})}),in:async()=>({data:[{id:alvo,nome:'Teste',role:'Cliente',ativo:false,gestor_usuarios:false}],error:null})})}),
 rpc:async(_nome,args)=>{rpcCalls.push(args);return {data:alvo,error:null}}
};
const autorizada=criarHandler(sucesso,'http://127.0.0.1:5175');
const lista=await autorizada(request({acao:'listar'}));
assert.equal(lista.status,200);
assert.equal((await lista.json()).usuarios[0].role,'Cliente');
const atualizado=await autorizada(request({acao:'alterar',id:alvo,nome:'Teste',role:'Analista',ativo:false,p_gestor:'intruso'}));
assert.equal(atualizado.status,200);
assert.equal(rpcCalls[0].p_gestor,'gestor','Identidade administrativa vem do token validado, nunca do body');
const novo=await autorizada(request({acao:'convidar',email:'teste@example.invalid',nome:'Teste',role:'Cliente'}));
assert.equal(novo.status,200);
assert.equal((await novo.json()).link,'https://exemplo.invalid/convite');
sucesso.rpc=async()=>({data:null,error:{message:'falha'}});
const parcial=await autorizada(request({acao:'convidar',email:'teste@example.invalid',nome:'Teste',role:'Cliente'}));
assert.equal(parcial.status,500);
assert.equal((await parcial.json()).link,undefined,'Não divulgar link antes de liberar o perfil');
sucesso.auth.getUser=async()=>({data:{user:null},error:{message:'jwt invalido'}});
assert.equal((await autorizada(request({acao:'listar'}))).status,401);
console.log('Usuários API: listagem, alteração, convite autorizado, identidade confiável e falha parcial verificados.');
const publico='https://controledenotasconcreto.vercel.app/';
let linkArgs;
sucesso.auth.getUser=async()=>({data:{user:{id:'gestor'}},error:null});
sucesso.auth.admin.listUsers=async()=>({data:{users:[{id:alvo,email:'teste@example.invalid',email_confirmed_at:'2026-10-11'}]},error:null});
sucesso.auth.admin.generateLink=async args=>{linkArgs=args;return {data:{properties:{action_link:'https://exemplo.invalid/acesso'}},error:null}};
const acesso=criarHandler(sucesso,publico);
const pedidoAcesso=new Request('https://teste.invalid',{method:'POST',headers:{Authorization:'Bearer jwt-teste',Origin:'http://127.0.0.1:5175','Content-Type':'application/json'},body:JSON.stringify({acao:'link_acesso',id:alvo})});
const renovado=await acesso(pedidoAcesso);
assert.equal(renovado.status,200,'Gestor local pode gerar acesso no endereço público');
assert.equal(linkArgs.type,'recovery');
assert.equal(linkArgs.options.redirectTo,publico,'Nunca usar a origem do navegador nos links');
assert.equal(renovado.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:5175');
assert.equal((await acesso(new Request('https://teste.invalid',{method:'OPTIONS',headers:{Origin:'https://intruso.invalid'}}))).status,403);
assert.equal((await acesso(request({acao:'link_acesso',id:'gestor'}))).status,403);
console.log('Links de acesso: endereço público fixo, recuperação e origem permitida verificados.');
sucesso.from=()=>({select:()=>({eq:(_campo,id)=>({single:async()=>({data:id==='gestor'?{ativo:true,gestor_usuarios:true}:{ativo:false},error:null})})})});
linkArgs=undefined;
assert.equal((await acesso(request({acao:'link_acesso',id:alvo}))).status,400);
assert.equal(linkArgs,undefined,'Alvo desativado não recebe link');
sucesso.from=()=>({select:()=>({eq:()=>({single:async()=>({data:{ativo:true,gestor_usuarios:true},error:null})})})});
sucesso.auth.admin.listUsers=async()=>({data:{users:[{id:alvo,email:'teste@example.invalid',email_confirmed_at:null}]},error:null});
const antes=rpcCalls.length;
assert.equal((await acesso(request({acao:'link_acesso',id:alvo}))).status,200);
assert.equal(linkArgs.type,'invite');
assert.equal(rpcCalls.length,antes,'Gerar link não altera perfil');
