import {exemplos} from './mockData.js';import {podeEditar,validarNota} from './regras.js';
const key='controlenotasconcreto-demo-v1';
export function carregar(){try{const data=JSON.parse(localStorage.getItem(key));if(data?.obras&&data?.locais&&data?.notas)return data}catch{ /* Recuperação de dados de exemplo inválidos. */ }return exemplos()}
export function salvarNota(data,n,role){if(!podeEditar(role))throw Error('Cliente possui acesso somente à consulta.');validarNota(n,data.notas);return {...data,notas:[...data.notas.filter(x=>x.id!==n.id),n]}}
export function salvarEnsaios(data,id,ensaios,observacoes,role){if(!podeEditar(role))throw Error('Cliente possui acesso somente à consulta.');for(const e of Object.values(ensaios)){if([e.esperado,...e.resultados].some(v=>v!==null&&(!Number.isFinite(v)||v<0)))throw Error('Use resistências iguais ou maiores que zero.')}return {...data,notas:data.notas.map(n=>n.id===id?{...n,ensaios,observacoes}:n)}}
export function salvarTeorico(data,id,value,role){if(!podeEditar(role))throw Error('Cliente possui acesso somente à consulta.');if(value!==null&&(!Number.isFinite(value)||value<=0))throw Error('O volume teórico deve ser maior que zero, ou ficar vazio.');return {...data,locais:data.locais.map(l=>l.id===id?{...l,teorico:value}:l)}}
export function persistir(data){localStorage.setItem(key,JSON.stringify(data))}
