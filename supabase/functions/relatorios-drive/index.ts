import {createClient} from 'npm:@supabase/supabase-js@2';
import {criarHandler, criarDrive} from './handler.js';

Deno.serve(criarHandler({
  cliente: (authorization: string) => createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {global:{headers:{Authorization:authorization}}, auth:{persistSession:false,autoRefreshToken:false}}
  ),
  pasta: (obra: string) => JSON.parse(Deno.env.get('DRIVE_PASTAS_POR_OBRA') ?? '{}')[obra],
  drive: () => criarDrive(JSON.parse(Deno.env.get('DRIVE_CONTA_SERVICO') ?? '{}')),
}));
