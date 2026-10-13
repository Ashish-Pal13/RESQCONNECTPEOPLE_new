import React,{useState} from 'react';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination} from '../lib/ui';
import {formatDateTime} from '../lib/format';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
import {formatPhone} from '../lib/phone';
const PAGE_SIZES=[10,20,50];
export default function ContactMessages(){
 const [search,setSearch]=useState('');
 const [pageSize,setPageSize]=useState(10);
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,id=>`#${id}`);
 const list=usePagedData('/contact',{search:term},pageSize);
 useHighlight(!list.loading);
 return <>
  <PageHeading eyebrow="COMMUNICATIONS" title="Contact Messages" subtitle="Messages received from the public contact form."/>
  <Notice message={list.error}/>
  <section className="panel">
   <h2>Inbox</h2>
   <FilterBar>
    <div>
     <label htmlFor="contactSearch">Search</label>
     <input id="contactSearch" type="search" placeholder="Name, email, phone, subject or message" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="contactPageSize">Messages per page</label>
     <select id="contactPageSize" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>
      {PAGE_SIZES.map(size=><option key={size} value={size}>{size}</option>)}
     </select>
    </div>
   </FilterBar>
   {list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:list.rows.length?
    <div className="table-wrap"><table>
     <thead><tr><th>Sender</th><th>Phone</th><th>Subject</th><th>Message</th><th>Received</th></tr></thead>
     <tbody>{list.rows.map(m=><tr key={m.id} data-highlight={m.id}>
      <td>{m.name}<br/><span className="muted">{m.email}</span></td>
      <td>{m.phone?<a className="tel-link" href={`tel:${m.phone}`}>{formatPhone(m.phone,m.phone_country)}</a>:<span className="muted">Not provided</span>}</td>
      <td>{m.subject}</td>
      <td>{m.message}</td>
      <td>{formatDateTime(m.created_at)}</td>
     </tr>)}</tbody>
    </table></div>
   :<Empty>{term?'No messages match this search.':'No messages received yet.'}</Empty>}
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="messages" loading={list.loading}/>
  </section>
 </>;
}
