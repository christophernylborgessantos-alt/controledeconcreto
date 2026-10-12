import {createClient} from 'npm:@supabase/supabase-js@2';
import {criarHandler} from './handler.js';
const url=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(criarHandler(admin,'https://controledenotasconcreto.vercel.app/'));
