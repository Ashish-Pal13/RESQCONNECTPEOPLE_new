import React,{useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {formatDateTime,incidentCode} from '../lib/format';
import {FormGrid,field} from './FormGrid';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
const INCIDENT_TYPES=['Flood','Fire','Earthquake','Landslide','Storm','Other'];
const INCIDENT_STATUSES=['Under Review','In Progress','Resolved'];
export default function MyReports(){
 const [params]=useSearchParams();
 const requested=params.get('type');
 const type=INCIDENT_TYPES.includes(requested)?requested:undefined;
 useEffect(()=>{if(type)document.getElementById('report-location')?.focus()},[type]);
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('');
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,incidentCode);
 const list=usePagedData('/incidents',{search:term,status},10);
 const notice=useNotice();
 useHighlight(!list.loading);
 async function save(d){notice.clear();await api('/incidents',{method:'POST',body:d});notice.success('Emergency report submitted');setSearch('');setStatus('');list.setPage(1);list.reload()}
 const filtered=Boolean(term||status);
 return <>
  <PageHeading eyebrow="EMERGENCY RESPONSE" title="My Emergency Reports" subtitle="Submit and track your emergency reports."/>
  <section className="panel">
   <h2>Submit a new report</h2>
   {type&&<div className="notice success-notice" role="status">Incident type selected: <strong>{type}</strong>. Add the location and describe what is happening below.</div>}
   <FormGrid key={type||'default'} id="report" onSave={save} button="Submit Report" fields={[
    field('type','Incident Type',{options:INCIDENT_TYPES,defaultValue:type}),
    field('urgency','Urgency',{options:['Low','Medium','High','Critical']}),
    field('location','Location',{wide:true}),
    field('description','Description',{wide:true,multiline:true})
   ]}/>
  </section>
  {notice.element}
  <Notice message={list.error}/>
  <section className="panel">
   <h2>Report History</h2>
   <FilterBar>
    <div>
     <label htmlFor="myReportSearch">Search</label>
     <input id="myReportSearch" type="search" placeholder="Report ID, type, location or description" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="myReportStatus">Status</label>
     <select id="myReportStatus" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="">All statuses</option>
      <option value="open">Open (not resolved)</option>
      {INCIDENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
     </select>
    </div>
   </FilterBar>
   {list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:list.rows.length?
    <div className="table-wrap"><table>
     <thead><tr><th>ID</th><th>Incident</th><th>Location</th><th>Urgency</th><th>Status</th><th>Created</th></tr></thead>
     <tbody>{list.rows.map(r=><tr key={r.id} data-highlight={r.id}>
      <td>{incidentCode(r.id)}</td>
      <td><strong>{r.type}</strong><div className="muted">{r.description}</div></td>
      <td>{r.location}</td>
      <td><Badge status={r.urgency}/></td>
      <td><Badge status={r.status}/></td>
      <td>{formatDateTime(r.created_at)}</td>
     </tr>)}</tbody>
    </table></div>
   :<Empty>{filtered?'No reports match these filters.':'You have not submitted any reports yet.'}</Empty>}
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="reports" loading={list.loading}/>
  </section>
 </>;
}
