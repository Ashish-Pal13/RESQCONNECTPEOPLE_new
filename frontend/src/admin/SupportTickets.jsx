import React,{useState} from 'react';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {formatDateTime} from '../lib/format';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
const TICKET_STATUSES=['Open','In Progress','Resolved','Closed'];
const TICKET_CATEGORIES=['Account','Emergency Report','Volunteer','Technical Issue','Other'];
export default function SupportTickets(){
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('');
 const [category,setCategory]=useState('');
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,id=>`#${id}`);
 const list=usePagedData('/tickets',{search:term,status,category},10);
 const notice=useNotice();
 const [savingId,setSavingId]=useState(null);
 useHighlight(!list.loading);
 async function update(event,id){
  event.preventDefault();
  const body=Object.fromEntries(new FormData(event.currentTarget));
  notice.clear();setSavingId(id);
  try{await api(`/tickets/${id}`,{method:'PATCH',body});list.reload();notice.success(`Ticket #${id} updated`)}
  catch(err){notice.fail(err.message)}
  finally{setSavingId(null)}
 }
 const filtered=Boolean(term||status||category);
 return <>
  <PageHeading eyebrow="SUPPORT DESK" title="Support Ticket Management" subtitle="Respond to requests from registered users."/>
  {notice.element}
  <Notice message={list.error}/>
  <section className="panel">
   <FilterBar>
    <div>
     <label htmlFor="ticketSearch">Search</label>
     <input id="ticketSearch" type="search" placeholder="Ticket number, subject, name or email" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="ticketStatusFilter">Status</label>
     <select id="ticketStatusFilter" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="">All statuses</option>
      {TICKET_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
     </select>
    </div>
    <div>
     <label htmlFor="ticketCategoryFilter">Category</label>
     <select id="ticketCategoryFilter" value={category} onChange={e=>setCategory(e.target.value)}>
      <option value="">All categories</option>
      {TICKET_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
     </select>
    </div>
   </FilterBar>
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="tickets" loading={list.loading}/>
  </section>
  {list.loading&&!list.rows.length?<section className="panel"><Loading/></section>:list.rows.length===0?(list.error?<section className="panel"><ErrorState message={list.error} onRetry={list.reload}/></section>:<section className="panel"><h2>Tickets</h2><Empty>{filtered?'No tickets match these filters.':'No support tickets yet.'}</Empty></section>):list.rows.map(t=>
   <article className="panel" key={t.id} data-highlight={t.id}>
    <div className="panel-header">
     <div>
      <div className="eyebrow">TICKET #{t.id} · {t.category}</div>
      <h2 className="ticket-subject">{t.subject}</h2>
      <div className="muted">{t.name} · {t.email} · {formatDateTime(t.created_at)}</div>
     </div>
     <Badge status={t.status}/>
    </div>
    <p className="ticket-message">{t.message}</p>
    <form key={`${t.id}-${t.updated_at}`} className="form-grid" onSubmit={e=>update(e,t.id)}>
     <div>
      <label htmlFor={`ticketStatus${t.id}`}>Status</label>
      <select id={`ticketStatus${t.id}`} name="status" defaultValue={t.status}>{TICKET_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
     </div>
     <div className="full-width">
      <label htmlFor={`ticketReply${t.id}`}>Admin Reply</label>
      <textarea id={`ticketReply${t.id}`} name="admin_reply" defaultValue={t.admin_reply} maxLength={5000}/>
     </div>
     <div className="full-width">
      <button className="btn" type="submit" disabled={savingId===t.id}>{savingId===t.id?'Saving...':'Save Response'}</button>
     </div>
    </form>
   </article>
  )}
  {list.rows.length>0&&<section className="panel pagination-panel"><Pagination pagination={list.pagination} onPage={list.setPage} noun="tickets" loading={list.loading}/></section>}
 </>;
}
