import {createClient} from '@supabase/supabase-js';
// Capturar antes de createClient consumir e remover o hash do convite.
export const definirSenhaNoAcesso=['invite','recovery'].includes(new URLSearchParams(globalThis.location?.hash?.slice(1)).get('type'));
const env = import.meta.env ?? {};
export const supabase = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  : null;
