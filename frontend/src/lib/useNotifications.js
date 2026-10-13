import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from '../api';
export const NOTIFICATION_POLL_MS=15000;
const sameId=(a,b)=>String(a)===String(b);
export function useNotifications(open){
 const [unread,setUnread]=useState(0);
 const [items,setItems]=useState([]);
 const [loading,setLoading]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const mounted=useRef(true);
 const listSeq=useRef(0);
 const countSeq=useRef(0);
 const epoch=useRef(0);
 const mutations=useRef(0);
 const listInFlight=useRef(false);
 const controllers=useRef(new Set());
 const openRef=useRef(open);
 openRef.current=open;
 useEffect(()=>{
  mounted.current=true;
  const pending=controllers.current;
  return ()=>{mounted.current=false;pending.forEach(c=>c.abort());pending.clear()};
 },[]);
 const request=useCallback(async(path,options={})=>{
  const controller=new AbortController();
  controllers.current.add(controller);
  try{return await api(path,{...options,signal:controller.signal})}
  finally{controllers.current.delete(controller)}
 },[]);
 const loadList=useCallback(async({quiet=false,force=false}={})=>{
  if(quiet&&!force&&(listInFlight.current||mutations.current>0))return;
  const seq=++listSeq.current;
  const started=epoch.current;
  countSeq.current++;
  listInFlight.current=true;
  if(!quiet){setLoading(true);setError('')}
  const current=()=>mounted.current&&seq===listSeq.current&&started===epoch.current&&mutations.current===0;
  try{
   const d=await request('/notifications?limit=20');
   if(!current())return;
   setItems(Array.isArray(d.data)?d.data:[]);
   if(typeof d.unread_count==='number')setUnread(d.unread_count);
   setLoaded(true);
   setError('');
  }catch(e){
   if(current()&&!quiet)setError(e.message);
  }finally{
   if(seq===listSeq.current){listInFlight.current=false;if(mounted.current)setLoading(false)}
  }
 },[request]);
 const refreshCount=useCallback(async({force=false}={})=>{
  if(!force&&(listInFlight.current||mutations.current>0))return;
  const seq=++countSeq.current;
  const started=epoch.current;
  try{
   const d=await request('/notifications/unread-count');
   if(!mounted.current||seq!==countSeq.current||started!==epoch.current||mutations.current>0)return;
   if(typeof d.unread_count==='number')setUnread(d.unread_count);
  }catch{
   return;
  }
 },[request]);
 const sync=useCallback(()=>{
  if(!mounted.current||mutations.current>0)return;
  if(openRef.current)loadList({quiet:true,force:true});
  else refreshCount({force:true});
 },[loadList,refreshCount]);
 const poll=useCallback(()=>{
  if(document.hidden||mutations.current>0)return;
  if(openRef.current)loadList({quiet:true});
  else refreshCount();
 },[loadList,refreshCount]);
 useEffect(()=>{
  refreshCount();
  const timer=setInterval(poll,NOTIFICATION_POLL_MS);
  const onVisible=()=>{if(!document.hidden)poll()};
  document.addEventListener('visibilitychange',onVisible);
  window.addEventListener('focus',onVisible);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',onVisible)};
 },[poll,refreshCount]);
 useEffect(()=>{if(open)loadList()},[open,loadList]);
 const beginMutation=useCallback(()=>{mutations.current++;epoch.current++},[]);
 const endMutation=useCallback(()=>{mutations.current--;epoch.current++;sync()},[sync]);
 const markRead=useCallback(async id=>{
  beginMutation();
  try{
   const d=await request(`/notifications/${id}/read`,{method:'PATCH'});
   if(!mounted.current)return d;
   const row=d&&d.data&&sameId(d.data.id,id)?d.data:null;
   setItems(list=>list.map(n=>sameId(n.id,id)?(row?{...n,...row}:{...n,is_read:true,read_at:n.read_at||new Date().toISOString()}):n));
   if(mutations.current===1&&typeof d.unread_count==='number')setUnread(d.unread_count);
   return d;
  }finally{
   endMutation();
  }
 },[request,beginMutation,endMutation]);
 const markAllRead=useCallback(async()=>{
  beginMutation();
  setBusy(true);
  try{
   await request('/notifications/read-all',{method:'PATCH'});
   if(!mounted.current)return;
   const readAt=new Date().toISOString();
   setItems(list=>list.map(n=>n.is_read?n:{...n,is_read:true,read_at:readAt}));
   setUnread(0);
  }finally{
   if(mounted.current)setBusy(false);
   endMutation();
  }
 },[request,beginMutation,endMutation]);
 return {unread,items,loading,loaded,error,busy,loadList,markRead,markAllRead};
}
