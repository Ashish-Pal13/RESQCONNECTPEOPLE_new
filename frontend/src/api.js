export const TOKEN_KEY='resq_token';
export const UNAUTHORIZED_EVENT='resq:unauthorized';
export function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)}catch{return null}}
export function setToken(token){try{sessionStorage.setItem(TOKEN_KEY,token)}catch{}}
export function clearToken(){try{sessionStorage.removeItem(TOKEN_KEY)}catch{}}
export async function api(path,options={}){
 const token=getToken();
 let response;
 try{
  response=await fetch('/api'+path,{...options,headers:{...(options.body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{}),...options.headers},body:options.body!==undefined?JSON.stringify(options.body):undefined});
 }catch{
  const error=new Error('Cannot reach the server. Check your connection and try again.');error.status=0;throw error;
 }
 const data=response.status===204?{}:await response.json().catch(()=>({error:'Unexpected server response'}));
 if(!response.ok){
  if(response.status===401&&token&&!path.startsWith('/auth/login')&&!path.startsWith('/auth/admin-login')&&!path.startsWith('/auth/register')){clearToken();window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))}
  const error=new Error(data.error||'Request failed');error.status=response.status;error.details=data.details;throw error;
 }
 return data;
}
