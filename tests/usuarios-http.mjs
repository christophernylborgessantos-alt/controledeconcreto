import {loadEnvFile} from 'node:process';
import assert from 'node:assert/strict';
loadEnvFile('.env.local');
const response=await fetch(process.env.VITE_SUPABASE_URL+'/functions/v1/usuarios',{method:'POST',headers:{apikey:process.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({acao:'listar'}),signal:AbortSignal.timeout(15000)});
assert.equal(response.status,401,'Visitante não pode invocar gestão de usuários');
console.log('🔒 PORTA FECHADA | gestão de usuários | visitante sem login (HTTP 401)');
