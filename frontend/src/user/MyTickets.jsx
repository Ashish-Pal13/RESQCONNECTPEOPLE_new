import React,{useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {formatDateTime} from '../lib/format';
import {FormGrid,field} from './FormGrid';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
const TICKET_CATEGORIES=['Account','Emergency Report','Volunteer','Technical Issue','Other'];
const TICKET_STATUSES=['Open','In Progress','Resolved','Closed'];
export default function MyTickets(){
 const [params]=useSearchParams();
 const requested=params.get('category');
 const category=TICKET_CATEGORIES.includes(requested)?requested:undefined;
 useEffect(()=>{if(category)document.getElementById('ticket-subject')?.focus()},[category]);
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('');
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,id=>`#${id}`);
 const list=usePagedData('/tickets',{search:term,status},10);
 const notice=useNotice();
 useHighlight(!list.loading);
 async function save(d){notice.clear();await api('/tickets',{method:'POST',body:d});setSearch('');setStatus('');list.setPage(1);list.reload();notice.success('Ticket submitted to admin')}
 const filtered=Boolean(term||status);
 return <>
  <PageHeading eyebrow="SUPPORT DESK" title="My Support Tickets" subtitle="Submit questions and track admin responses."/>
  <section className="panel">
   <h2>Create Support Ticket</h2>
   {category&&<div className="notice success-notice" role="status">Topic selected: <strong>{category}</strong>. Add a subject and describe your issue below.</div>}
   <FormGrid key={category||'default'} id="ticket" onSave={save} button="Submit Ticket" fields={[
    field('subject','Subject',{max:180}),
    field('category','Category',{options:TICKET_CATEGORIES,defaultValue:category}),
    field('message','Describe your issue',{wide:true,multiline:true})
   ]}/>
  </section>
  {notice.element}
  <Notice message={list.error}/>
  <section className="panel">
   <h2>My Tickets</h2>
   <FilterBar>
    <div>
     <label htmlFor="myTicketSearch">Search</label>
     <input id="myTicketSearch" type="search" placeholder="Ticket number, subject or message" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="myTicketStatus">Status</label>
     <select id="myTicketStatus" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="">All statuses</option>
      {TICKET_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
     </select>
    </div>
   </FilterBar>
   {list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:!list.rows.length?<Empty>{filtered?'No tickets match these filters.':'No support tickets yet.'}</Empty>:null}
  </section>
  {list.rows.map(t=>
   <article className="panel" key={t.id} data-highlight={t.id}>
    <div className="panel-header">
     <div>
      <div className="eyebrow">TICKET #{t.id} · {t.category}</div>
      <h2 className="ticket-subject">{t.subject}</h2>
      <div className="muted">{formatDateTime(t.created_at)}</div>
     </div>
     <Badge status={t.status}/>
    </div>
    <p className="ticket-message">{t.message}</p>
    {t.admin_reply&&<div className="notice success-notice reply-box"><strong>Admin response</strong><div>{t.admin_reply}</div><div className="muted">Updated {formatDateTime(t.updated_at)}</div></div>}
   </article>
  )}
  {list.pagination.total>0&&<section className="panel"><Pagination pagination={list.pagination} onPage={list.setPage} noun="tickets" loading={list.loading}/></section>}
 </>;
}
