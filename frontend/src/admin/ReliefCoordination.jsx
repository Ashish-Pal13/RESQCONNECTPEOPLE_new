import React,{useState} from 'react';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {incidentCode} from '../lib/format';
import {SearchSelect} from '../lib/SearchSelect';
const OPEN_INCIDENTS={status:'open'};
const PRIORITIES=['Normal','High','Urgent'];
export default function ReliefCoordination(){
 const [search,setSearch]=useState('');
 const [priority,setPriority]=useState('');
 const term=useDebounced(search.trim());
 const resources=usePagedData('/resources',{search:term,priority},10);
 const [incident,setIncident]=useState(null);
 const notice=useNotice();
 const [busy,setBusy]=useState(false);
 async function saveRequirement(event){
  event.preventDefault();
  const form=event.currentTarget;
  const data=new FormData(form);
  notice.clear();
  if(!incident){notice.fail('Please select a valid incident.');return}
  setBusy(true);
  try{
   await api('/resources',{method:'POST',body:{incident_id:incident.id,resource:data.get('resource'),quantity:Number(data.get('quantity')),priority:data.get('priority'),notes:String(data.get('notes')||'').trim()}});
   form.reset();
   setIncident(null);
   notice.success('Resource requirement saved.');
   resources.setPage(1);resources.reload();
  }catch(err){notice.fail(err.message)}
  finally{setBusy(false)}
 }
 const filtered=Boolean(term||priority);
 return <>
  <PageHeading title="Relief Coordination" subtitle="Record resource requirements for an incident."/>
  {notice.element}
  <Notice message={resources.error}/>
  <section className="panel">
   <h2>Add Resource Requirement</h2>
   <form id="resourceForm" className="form-grid" onSubmit={saveRequirement}>
    <SearchSelect id="resourceIncident" label="Related Incident" path="/incidents" filters={OPEN_INCIDENTS} required
     value={incident} onChange={setIncident} placeholder="Search open reports by ID, type or location"
     formatOption={i=>`${incidentCode(i.id)} — ${i.type} (${i.location})`} describeOption={i=>`${i.urgency} urgency · ${i.status}`}
     emptyText="No open reports match this search"/>
    <div>
     <label htmlFor="resourceName">Resource</label>
     <select id="resourceName" name="resource" required>
      <option>Food</option><option>Drinking Water</option>
      <option>Medicines</option><option>First Aid Kits</option>
      <option>Sanitation Supplies</option><option>Ration</option>
      <option>Transport</option><option>Shelter</option><option>Other</option>
     </select>
    </div>
    <div>
     <label htmlFor="resourceQuantity">Quantity Required</label>
     <input id="resourceQuantity" name="quantity" type="number" min="1" max="1000000000" required/>
    </div>
    <div>
     <label htmlFor="resourcePriority">Priority</label>
     <select id="resourcePriority" name="priority">{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
    </div>
    <div className="full-width">
     <label htmlFor="resourceNotes">Notes</label>
     <textarea id="resourceNotes" name="notes" maxLength={2000} placeholder="Delivery location or other requirements"></textarea>
    </div>
    <div className="full-width">
     <button className="btn" type="submit" disabled={busy}>{busy?'Saving...':'Save Requirement'}</button>
    </div>
   </form>
  </section>
  <section className="panel">
   <h2>Resource Requirements</h2>
   <FilterBar>
    <div>
     <label htmlFor="resourceSearch">Search</label>
     <input id="resourceSearch" type="search" placeholder="Resource, notes, report ID or location" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="resourcePriorityFilter">Priority</label>
     <select id="resourcePriorityFilter" value={priority} onChange={e=>setPriority(e.target.value)}>
      <option value="">All priorities</option>
      {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
     </select>
    </div>
   </FilterBar>
   {resources.loading&&!resources.rows.length?<Loading/>:resources.error&&!resources.rows.length?<ErrorState message={resources.error} onRetry={resources.reload}/>:resources.rows.length?
    <div className="table-wrap"><table>
     <thead><tr><th>Incident</th><th>Resource</th><th>Quantity</th><th>Priority</th><th>Notes</th></tr></thead>
     <tbody>{resources.rows.map(r=><tr key={r.id}>
      <td><strong>{incidentCode(r.incident_id)}</strong><div className="muted">{r.incident_type} · {r.incident_location}</div></td><td>{r.resource}</td>
      <td>{r.quantity}</td><td><Badge status={r.priority}/></td>
      <td>{r.notes||'—'}</td>
     </tr>)}</tbody>
    </table></div>
   :<Empty>{filtered?'No resource requirements match these filters.':'No resource requirements recorded.'}</Empty>}
   <Pagination pagination={resources.pagination} onPage={resources.setPage} noun="requirements" loading={resources.loading}/>
  </section>
 </>;
}
