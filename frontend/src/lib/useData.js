import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from '../api';
export const EMPTY_PAGE={data:[],pagination:{page:1,pageSize:20,total:0,totalPages:1}};
export function useData(path,initial=[]){
 const initialRef=useRef(initial);
 const [result,setResult]=useState({path:null,data:initialRef.current,error:''});
 const [fetching,setFetching]=useState(false);
 const [version,setVersion]=useState(0);
 useEffect(()=>{
  if(!path){setFetching(false);return undefined}
  let active=true;
  setFetching(true);
  api(path)
   .then(d=>{if(active)setResult({path,data:d,error:''})})
   .catch(e=>{if(active)setResult(current=>({path,data:current.path===path?current.data:initialRef.current,error:e.message||'Request failed'}))})
   .finally(()=>{if(active)setFetching(false)});
  return ()=>{active=false};
 },[path,version]);
 const reload=useCallback(()=>setVersion(v=>v+1),[]);
 const current=Boolean(path)&&result.path===path;
 return {
  data:current?result.data:initialRef.current,
  loading:Boolean(path)&&(fetching||!current),
  error:current?result.error:'',
  reload
 };
}
export function usePagedData(basePath,filters={},pageSize=20){
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(filters))if(value!==undefined&&value!==null&&value!=='')params.set(key,String(value));
 params.set('pageSize',String(pageSize));
 const key=`${basePath}?${params}`;
 const [state,setState]=useState({key,page:1});
 const page=state.key===key?state.page:1;
 params.set('page',String(page));
 const result=useData(basePath?`${basePath}?${params}`:null,EMPTY_PAGE);
 const rows=Array.isArray(result.data?.data)?result.data.data:[];
 const pagination=result.data?.pagination?{...result.data.pagination}:{...EMPTY_PAGE.pagination,pageSize};
 const setPage=useCallback(next=>setState(current=>{
  const base=current.key===key?current.page:1;
  return {key,page:Math.max(1,typeof next==='function'?next(base):next)};
 }),[key]);
 return {...result,rows,pagination,page,setPage};
}
