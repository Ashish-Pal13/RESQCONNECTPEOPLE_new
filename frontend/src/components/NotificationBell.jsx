import React,{useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FiBell,FiCheck,FiInbox} from 'react-icons/fi';
import {useNotifications} from '../lib/useNotifications';
import {useAuth} from '../context/Auth';
const PUBLIC_ROUTES=['/','/about','/services','/contact','/support'];
const ROLE_ROUTES={
 coordinator:['/admin','/admin/incidents','/admin/volunteers','/admin/verification','/admin/assignments','/admin/resources','/admin/analytics','/admin/users','/admin/tickets','/admin/messages'],
 verifier:['/admin','/admin/verification'],
 user:['/dashboard','/dashboard/incidents','/dashboard/volunteer','/dashboard/assignments','/dashboard/tickets']
};
const LINK_SHAPE=/^(\/(?:[a-z]+(?:\/[a-z]+)?)?)(?:\?([A-Za-z0-9_=&-]*))?$/;
const HIGHLIGHT=/^[A-Za-z0-9_-]{1,64}$/;
export function resolveDestination(link,role){
 if(link===null||link===undefined||String(link).trim()==='')return {kind:'none'};
 const raw=String(link).trim();
 const match=raw.length<=200?LINK_SHAPE.exec(raw):null;
 if(!match)return {kind:'invalid'};
 const path=match[1]||'/';
 if(match[2]){
  const params=new URLSearchParams(match[2]);
  const keys=[...params.keys()];
  if(keys.some(key=>key!=='highlight')||keys.length>1||!HIGHLIGHT.test(params.get('highlight')||''))return {kind:'invalid'};
 }
 const known=PUBLIC_ROUTES.includes(path)||Object.values(ROLE_ROUTES).some(list=>list.includes(path));
 if(!known)return {kind:'invalid'};
 if(!PUBLIC_ROUTES.includes(path)&&!(ROLE_ROUTES[role]||[]).includes(path))return {kind:'forbidden'};
 return {kind:'ok',to:match[2]?`${path}?${match[2]}`:path};
}
function timeAgo(value){
 const date=new Date(value);
 const seconds=Math.max(0,Math.round((Date.now()-date.getTime())/1000));
 if(seconds<45)return 'Just now';
 const minutes=Math.round(seconds/60);
 if(minutes<60)return `${minutes} min ago`;
 const hours=Math.round(minutes/60);
 if(hours<24)return `${hours} h ago`;
 const days=Math.round(hours/24);
 if(days<7)return `${days} d ago`;
 return date.toLocaleDateString('en-IN');
}
function actionHint(n,role){
 const kind=resolveDestination(n.link,role).kind;
 if(kind==='ok')return n.is_read?'Opens the related page.':'Marks as read and opens the related page.';
 if(kind==='none')return n.is_read?'Information only.':'Marks as read. Information only.';
 return 'Related page unavailable.';
}
export default function NotificationBell(){
 const [open,setOpen]=useState(false);
 const [actionError,setActionError]=useState('');
 const [notice,setNotice]=useState('');
 const [pendingId,setPendingId]=useState(null);
 const wrapper=useRef(null);
 const button=useRef(null);
 const navigate=useNavigate();
 const {user}=useAuth();
 const {unread,items,loading,loaded,error,busy,loadList,markRead,markAllRead}=useNotifications(open);
 useEffect(()=>{if(!open){setActionError('');setNotice('')}},[open]);
 useEffect(()=>{
  if(!open)return undefined;
  const onKey=event=>{if(event.key==='Escape'){setOpen(false);button.current?.focus()}};
  const onPointer=event=>{if(wrapper.current&&!wrapper.current.contains(event.target))setOpen(false)};
  document.addEventListener('keydown',onKey);
  document.addEventListener('pointerdown',onPointer);
  return ()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer)};
 },[open]);
 async function openNotification(n){
  if(pendingId!==null)return;
  setActionError('');setNotice('');
  const destination=resolveDestination(n.link,user&&user.role);
  if(destination.kind==='invalid'){setActionError('This notification has an invalid link, so it was not opened. You can still mark it as read with the check button.');return}
  if(destination.kind==='forbidden'){setActionError('This notification links to a page your account cannot open, so it was not opened. You can still mark it as read with the check button.');return}
  if(!n.is_read){
   setPendingId(n.id);
   try{await markRead(n.id)}
   catch(e){setActionError(`Could not mark this notification as read: ${e.message} Please try again.`);return}
   finally{setPendingId(null)}
  }
  if(destination.kind==='none'){setNotice(n.is_read?'This is an information-only notification with no page to open.':'Marked as read. This is an information-only notification with no page to open.');return}
  setOpen(false);
  navigate(destination.to);
 }
 async function markOne(event,id){
  event.stopPropagation();
  if(pendingId!==null)return;
  setActionError('');setNotice('');
  setPendingId(id);
  try{await markRead(id);setNotice('Marked as read.')}catch(e){setActionError(`Could not mark this notification as read: ${e.message} Please try again.`)}
  finally{setPendingId(null)}
 }
 async function readAll(){
  setActionError('');setNotice('');
  try{await markAllRead()}
  catch(e){setActionError(`Could not mark all notifications as read: ${e.message} Please try again.`)}
 }
 const label=unread?`Notifications, ${unread} unread`:'Notifications';
 let body;
 if(loading&&!loaded)body=<div className="notif-state" role="status">Loading notifications...</div>;
 else if(error&&!items.length)body=<div className="notif-state" role="alert">{error}<button className="btn btn-secondary notif-retry" type="button" onClick={()=>loadList()}>Try Again</button></div>;
 else if(!items.length)body=<div className="notif-state"><FiInbox className="notif-empty-icon" aria-hidden="true"/>You have no notifications yet. Updates about reports, volunteers, assignments and tickets will appear here.</div>;
 else body=<ul className="notif-list">{items.map(n=><li key={n.id} className={n.is_read?'notif-item':'notif-item unread'}>
  <button type="button" className="notif-main" disabled={pendingId!==null} aria-busy={pendingId===n.id} onClick={()=>openNotification(n)}>
   <span className="notif-dot" aria-hidden="true"></span>
   <span className="notif-title">{n.title}<span className="sr-only">{n.is_read?' (read)':' (unread)'}</span></span>
   <span className="notif-msg">{n.message}</span>
   <time className="notif-time" dateTime={n.created_at} title={new Date(n.created_at).toLocaleString('en-IN')}>{timeAgo(n.created_at)}</time>
   <span className="sr-only"> {actionHint(n,user&&user.role)}</span>
  </button>
  {!n.is_read&&<button type="button" className="notif-mark" title="Mark as read" aria-label={`Mark "${n.title}" as read`} disabled={pendingId!==null} onClick={event=>markOne(event,n.id)}><FiCheck aria-hidden="true"/></button>}
 </li>)}</ul>;
 return <div className="notif" ref={wrapper}>
  <button ref={button} type="button" className="notif-bell" aria-label={label} aria-haspopup="true" aria-expanded={open} aria-controls="notification-panel" onClick={()=>setOpen(value=>!value)}>
   <FiBell aria-hidden="true"/>
   {unread>0&&<span className="notif-badge" aria-hidden="true">{unread>99?'99+':unread}</span>}
  </button>
  {open&&<div id="notification-panel" className="notif-panel" role="dialog" aria-label="Notifications">
   <div className="notif-head">
    <strong>Notifications</strong>
    <button type="button" className="notif-link" disabled={!unread||busy} onClick={readAll}>{busy?'Marking...':'Mark all as read'}</button>
   </div>
   {(actionError||(error&&items.length>0))&&<div className="notif-error" role="alert">{actionError||error}</div>}
   {notice&&!actionError&&<div className="notif-note" role="status">{notice}</div>}
   <div className="notif-body">{body}</div>
  </div>}
 </div>;
}
