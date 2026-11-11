const api = 'https://www.googleapis.com/drive/v3/files';
const oauth = 'https://oauth2.googleapis.com/token';
const pdf = 'application/pdf';
const limite = 20 * 1024 * 1024;
const idDrive = /^[\w-]{10,100}$/;
const idObra = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const dominio = 'https://controledenotasconcreto.vercel.app';
const local = /^http:\/\/(?:localhost|127\.0\.0\.1):51(?:7[3-9]|8\d)$/;

const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const encode = value => new TextEncoder().encode(value);

export async function criarDrive(credencial, buscar = fetch) {
  if (credencial.type !== 'service_account' || !credencial.client_email || !credencial.private_key) {
    throw Error('Credencial do Drive indisponível.');
  }
  const iat = Math.floor(Date.now() / 1000);
  const json = value => base64url(encode(JSON.stringify(value)));
  const jwt = json({alg:'RS256',typ:'JWT'}) + '.' + json({
    iss:credencial.client_email, scope:'https://www.googleapis.com/auth/drive.readonly', aud:oauth, iat, exp:iat+600
  });
  const pem = credencial.private_key.replace(/-----[^-]+-----|\s/g, '');
  const chave = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const assinatura = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, encode(jwt)));
  const resposta = await buscar(oauth, {
    method:'POST', signal:AbortSignal.timeout(15000),
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt+'.'+base64url(assinatura)})
  });
  if (!resposta.ok) throw Error('Falha ao autenticar no Google Drive.');
  const {access_token} = await resposta.json();
  if (!access_token) throw Error('Google Drive não retornou acesso.');
  return async (path, params) => {
    const res = await buscar(api + path + '?' + new URLSearchParams(params), {
      headers:{Authorization:'Bearer '+access_token},signal:AbortSignal.timeout(25000)
    });
    if (!res.ok) throw Error('Google Drive indisponível.');
    return res;
  };
}

export function criarHandler({cliente,pasta,drive}) {
  return async req => {
    const origin = req.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin':local.test(origin) ? origin : dominio,
      'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type',
      'Access-Control-Allow-Methods':'POST, OPTIONS', 'Cache-Control':'no-store', Vary:'Origin'
    };
    const resposta = (data,status=200) => Response.json(data,{status,headers:cors});
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (req.method !== 'POST') return resposta({erro:'Método indisponível.'},405);
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return resposta({erro:'Entre novamente no sistema.'},401);
    try {
      const c = cliente(auth);
      const {data:identidade,error:falha} = await c.auth.getUser();
      if (falha || !identidade?.user) return resposta({erro:'Sessão inválida.'},401);
      const pedido = await req.json().catch(()=>null);
      if (!pedido || typeof pedido.obra !== 'string' || !idObra.test(pedido.obra) || !['listar','baixar'].includes(pedido.acao)
          || (pedido.acao === 'baixar' && (typeof pedido.id !== 'string' || !idDrive.test(pedido.id)))) {
        return resposta({erro:'Pedido inválido.'},400);
      }
      const [perfil,obra] = await Promise.all([
        c.from('profiles').select('ativo,role').eq('id',identidade.user.id).maybeSingle(),
        c.from('obras').select('id').eq('id',pedido.obra).maybeSingle()
      ]);
      if (!perfil.data?.ativo || !['Christopher','Analista'].includes(perfil.data.role) || !obra.data) {
        return resposta({erro:'Sem acesso de importação nesta obra.'},403);
      }
      const folder = pasta(pedido.obra);
      if (typeof folder !== 'string' || !idDrive.test(folder)) return resposta({erro:'Pasta do Drive ainda não configurada para esta obra.'},409);
      const google = await drive();
      if (pedido.acao === 'listar') {
        const arquivos = [];
        let pageToken;
        let paginas = 0;
        do {
          const res = await google('',{
            q:`'${folder}' in parents and trashed = false and mimeType = '${pdf}'`,
            fields:'nextPageToken,files(id,name,size,modifiedTime)',pageSize:'100',orderBy:'modifiedTime desc',
            ...(pageToken?{pageToken}:{})
          });
          const page = await res.json();
          arquivos.push(...(page.files ?? []));
          pageToken = page.nextPageToken;
          paginas++;
        } while (pageToken && arquivos.length < 500 && paginas < 10);
        return resposta({arquivos:arquivos.slice(0,500),limitado:arquivos.length>500||!!pageToken});
      }
      const meta = await (await google('/'+pedido.id,{fields:'parents,mimeType,trashed,size'})).json();
      if (!Array.isArray(meta.parents) || !meta.parents.includes(folder) || meta.mimeType !== pdf ||
          meta.trashed !== false || !(Number(meta.size)>0 && Number(meta.size)<=limite)) {
        return resposta({erro:'PDF indisponível nesta pasta ou acima de 20 MB.'},403);
      }
      const arquivo = await google('/'+pedido.id,{alt:'media'});
      const bytes = await arquivo.arrayBuffer();
      if (bytes.byteLength > limite || new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') {
        return resposta({erro:'Arquivo inválido ou acima de 20 MB.'},422);
      }
      return new Response(bytes,{headers:{...cors,'Content-Type':pdf}});
    } catch {
      return resposta({erro:'Não foi possível acessar a pasta de relatórios no Google Drive.'},502);
    }
  };
}
