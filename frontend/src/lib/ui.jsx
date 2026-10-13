import React from 'react';
import {FiChevronLeft,FiChevronRight} from 'react-icons/fi';
import {badgeColor} from './format';
export function Badge({status}){return <span className={`badge ${badgeColor(status)}`}>{String(status??'')}</span>}
export function PageHeading({title,subtitle,eyebrow,actions}){
 return <div className="page-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><div className="muted">{subtitle}</div></div>{actions&&<div className="page-heading-actions">{actions}</div>}</div>;
}
export function StatCard({label,value,note,tone}){
 return <div className={tone?`stat-card tone-${tone}`:'stat-card'}><div className="stat-label">{label}</div><div className="stat-number">{value}</div>{note!==undefined&&<div className="muted">{note}</div>}</div>;
}
export function Empty({children}){return <div className="empty">{children}</div>}
export function Notice({message,success=false}){return message?<div className={success?'notice success-notice':'notice'} role="status">{message}</div>:null}
export function Loading(){return <div className="empty" role="status">Loading...</div>}
export function ErrorState({message,onRetry}){return <div className="empty error-state" role="alert"><span>{message||'Something went wrong.'}</span>{onRetry&&<button className="btn btn-secondary btn-small" type="button" onClick={onRetry}>Try Again</button>}</div>}
export function useNotice(){
 const [notice,setNotice]=React.useState(null);
 return {
  element:notice?<Notice message={notice.text} success={notice.success}/>:null,
  success:text=>setNotice({text,success:true}),
  fail:text=>setNotice({text,success:false}),
  clear:()=>setNotice(null)
 };
}
export function Pagination({pagination,onPage,noun='records',loading=false}){
 if(!pagination||!pagination.total)return null;
 const {page,pageSize,total,totalPages}=pagination;
 const first=(page-1)*pageSize+1;
 const last=Math.min(page*pageSize,total);
 return <div className="pagination-bar" aria-busy={loading?'true':'false'}>
  <span className="muted" role="status">Showing {first}–{last} of {total} {total===1?noun.replace(/s$/,''):noun}</span>
  <div className="pagination-controls">
   <button className="btn btn-secondary" type="button" disabled={loading||page<=1} onClick={()=>onPage(p=>Math.max(1,p-1))}><FiChevronLeft aria-hidden="true"/> Previous</button>
   <span className="pagination-page">Page {page} of {totalPages}</span>
   <button className="btn btn-secondary" type="button" disabled={loading||page>=totalPages} onClick={()=>onPage(p=>p+1)}>Next <FiChevronRight aria-hidden="true"/></button>
  </div>
 </div>;
}
export function FilterBar({children}){return <div className="filters">{children}</div>}
