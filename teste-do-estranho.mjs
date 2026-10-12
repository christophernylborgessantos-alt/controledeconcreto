import {loadEnvFile} from 'node:process';
import {randomUUID} from 'node:crypto';
loadEnvFile('.env.local');
const url=process.env.VITE_SUPABASE_URL;
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!url||!key)throw Error('Faltam URL e chave pública.');
const id=randomUUID(),obra=randomUUID(),usuario=randomUUID();
const registros={
  profiles:{id:usuario,nome:'AUDITORIA',role:'Cliente',ativo:false},
  obras:{id:obra,nome:'AUDITORIA TEMPORARIA',tipo:''},
  acessos_obras:{usuario_id:usuario,obra_id:obra},
  locais:{id,obra_id:obra,nome:'AUDITORIA',teorico:null},
  notas:{id,obra_id:obra,local_id:randomUUID(),numero:'AUDITORIA-'+id,data:'2026-10-11',fck:30,volume:1},
  ensaios:{id,obra_id:obra,nota_id:randomUUID(),idade:7}
};
let falhas=0;
for(const [tabela,registro] of Object.entries(registros)){
  for(const [operacao,method] of [['LER','GET'],['INSERIR','POST'],['APAGAR','DELETE']]){
    // Exclusão sempre limitada a UUID aleatório deste teste; nunca apaga negócios.
    const filtro=tabela==='acessos_obras'?`usuario_id=eq.${usuario}&obra_id=eq.${obra}`:`id=eq.${registro.id}`;
    const endpoint=`${url}/rest/v1/${tabela}${method==='GET'?'?select=*&limit=1':method==='DELETE'?'?'+filtro:''}`;
    try{
      const res=await fetch(endpoint,{method,headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=representation'},body:method==='POST'?JSON.stringify(registro):undefined,signal:AbortSignal.timeout(15000)});
      const texto=await res.text();let body;try{body=JSON.parse(texto)}catch{body=null}
      if([401,403].includes(res.status)&&body?.code==='42501')console.log(`🔒 PORTA FECHADA | ${tabela} | ${operacao}`);
      else if(res.ok&&((method==='GET'&&body?.length>0)||(method==='POST'&&body?.length>0)||(method==='DELETE'&&body?.length>0))){console.log(`🚨 PORTA ABERTA | ${tabela} | ${operacao}`);falhas++}
      else{console.log(`⚠️ INCONCLUSIVO | ${tabela} | ${operacao} | HTTP ${res.status} | ${body?.code??'sem código'}`);falhas++}
    }catch{console.log(`⚠️ INCONCLUSIVO | ${tabela} | ${operacao} | conexão falhou`);falhas++}
  }
}
const settings=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
if(!settings.ok)throw Error('Não foi possível conferir cadastro público.');
const config=await settings.json();
console.log(config.disable_signup?'🔒 PORTA FECHADA | Auth | cadastro público':'🚨 PORTA ABERTA | Auth | cadastro público');
if(!config.disable_signup)falhas++;
process.exitCode=falhas?1:0;
