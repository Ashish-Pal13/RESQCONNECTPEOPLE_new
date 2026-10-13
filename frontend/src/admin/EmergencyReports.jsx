import React,{useState} from 'react';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {incidentCode} from '../lib/format';
import {INCIDENT_STATUSES,IncidentTable,URGENCY_LEVELS} from './tables';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
export default function EmergencyReports(){
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('');
 const [urgency,setUrgency]=useState('');
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,incidentCode);
 const list=usePagedData('/incidents',{search:term,status,urgency},10);
 const notice=useNotice();
 const [busy,setBusy]=useState(false);
 useHighlight(!list.loading);
 async function addReport(event){
  event.preventDefault();
  const form=event.currentTarget;
  const values=Object.fromEntries(new FormData(form));
  setBusy(true);notice.clear();
  try{
   await api('/incidents',{method:'POST',body:{type:values.type,urgency:values.urgency,location:values.location.trim(),description:values.description.trim()}});
   form.reset();
   notice.success('Report added.');
   list.setPage(1);list.reload();
  }catch(err){notice.fail(err.message)}
  finally{setBusy(false)}
 }
 async function updateIncident(incident,next){
  if(next===incident.status)return;
  if(next==='Resolved'&&!window.confirm(`Mark ${incidentCode(incident.id)} as resolved? Any assignments that are still open for this report will be cancelled and the volunteers will be notified. Completed assignments are kept.`)){list.reload();return}
  notice.clear();
  try{
   const result=await api(`/incidents/${incident.id}`,{method:'PATCH',body:{status:next}});
   notice.success(result.cancelled_assignments?`${incidentCode(incident.id)} marked ${next}. ${result.cancelled_assignments} open assignment${result.cancelled_assignments===1?' was':'s were'} cancelled and the volunteers notified.`:`${incidentCode(incident.id)} marked ${next}.`);
  }catch(err){notice.fail(err.message)}
  list.reload();
 }
 const filtered=Boolean(term||status||urgency);
 return <>
  <PageHeading title="Emergency Reports" subtitle="Review incidents and update their response status."/>
  {notice.element}
  <Notice message={list.error}/>
  <section className="panel">
   <h2>Record a Demonstration Report</h2>
   <form id="incidentForm" className="form-grid" onSubmit={addReport}>
    <div>
     <label htmlFor="incidentType">Incident Type</label>
     <select id="incidentType" name="type" required>
      <option>Flood</option><option>Fire</option><option>Earthquake</option>
      <option>Landslide</option><option>Storm</option><option>Other</option>
     </select>
    </div>
    <div>
     <label htmlFor="incidentUrgency">Urgency</label>
     <select id="incidentUrgency" name="urgency" required>
      {URGENCY_LEVELS.map(u=><option key={u}>{u}</option>)}
     </select>
    </div>
    <div className="full-width">
     <label htmlFor="incidentLocation">Location</label>
     <input id="incidentLocation" name="location" required maxLength={255} placeholder="Area, district or city"/>
    </div>
    <div className="full-width">
     <label htmlFor="incidentDescription">Description</label>
     <textarea id="incidentDescription" name="description" required maxLength={5000} placeholder="Describe the incident"></textarea>
    </div>
    <div className="full-width">
     <button className="btn" type="submit" disabled={busy}>{busy?'Adding...':'Add Report'}</button>
    </div>
   </form>
  </section>
  <section className="panel">
   <div className="panel-header"><h2>All Emergency Reports</h2></div>
   <FilterBar>
    <div>
     <label htmlFor="incidentSearch">Search</label>
     <input id="incidentSearch" type="search" placeholder="Report ID, type, location or details" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="incidentStatusFilter">Status</label>
     <select id="incidentStatusFilter" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="">All statuses</option>
      <option value="open">Open (not resolved)</option>
      {INCIDENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
     </select>
    </div>
    <div>
     <label htmlFor="incidentUrgencyFilter">Urgency</label>
     <select id="incidentUrgencyFilter" value={urgency} onChange={e=>setUrgency(e.target.value)}>
      <option value="">All levels</option>
      {URGENCY_LEVELS.map(u=><option key={u} value={u}>{u}</option>)}
     </select>
    </div>
   </FilterBar>
   {list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:<IncidentTable items={list.rows} editable onStatusChange={updateIncident} emptyText={filtered?'No reports match these filters.':'No reports found.'}/>}
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="reports" loading={list.loading}/>
  </section>
 </>;
}
