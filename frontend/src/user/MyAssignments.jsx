import React,{useState} from 'react';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {assignmentCode,formatDateTime,incidentCode} from '../lib/format';
import {ASSIGNMENT_STATUSES,VOLUNTEER_ACTIONS} from '../lib/assignments';
import {useHighlight} from '../lib/useHighlight';
import {useHighlightSearch} from '../lib/useHighlightSearch';
const DONE_MESSAGES={Accepted:'accepted',Declined:'declined','In Progress':'marked in progress',Completed:'marked completed'};
export default function MyAssignments(){
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('');
 const term=useDebounced(search.trim());
 useHighlightSearch(setSearch,assignmentCode);
 const list=usePagedData('/assignments',{search:term,status},10);
 const notice=useNotice();
 const [busyId,setBusyId]=useState(null);
 useHighlight(!list.loading);
 async function update(assignment,action){
  let reason='';
  if(action.status==='Declined'){
   const answer=window.prompt(`${action.label} ${assignmentCode(assignment.id)}? The coordinators will be notified.\n\nOptional reason:`,'');
   if(answer===null)return;
   reason=answer.trim();
  }
  if(action.status==='Completed'&&!window.confirm(`Mark ${assignmentCode(assignment.id)} as completed? This cannot be undone.`))return;
  notice.clear();setBusyId(assignment.id);
  try{await api(`/assignments/${assignment.id}`,{method:'PATCH',body:{status:action.status,reason}});notice.success(`${assignmentCode(assignment.id)} ${DONE_MESSAGES[action.status]}.`)}
  catch(e){notice.fail(e.message)}
  finally{setBusyId(null);list.reload()}
 }
 const filtered=Boolean(term||status);
 return <>
  <PageHeading eyebrow="TASK COORDINATION" title="My Assignments" subtitle="Accept new tasks, update your progress and see what has changed."/>
  {notice.element}
  <Notice message={list.error}/>
  <section className="panel">
   <h2>Assignment Tracker</h2>
   <FilterBar>
    <div>
     <label htmlFor="myAssignmentSearch">Search</label>
     <input id="myAssignmentSearch" type="search" placeholder="Assignment ID, task or location" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="myAssignmentStatus">Status</label>
     <select id="myAssignmentStatus" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="">All statuses</option>
      <option value="open">Open (not finished)</option>
      {ASSIGNMENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
     </select>
    </div>
   </FilterBar>
   {list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:list.rows.length?
    <div className="table-wrap"><table>
     <thead><tr><th>ID</th><th>Incident</th><th>Task</th><th>Status</th><th>Actions</th></tr></thead>
     <tbody>{list.rows.map(r=>{
      const actions=VOLUNTEER_ACTIONS[r.status]||[];
      return <tr key={r.id} data-highlight={r.id}>
       <td><strong>{assignmentCode(r.id)}</strong><div className="muted">{formatDateTime(r.created_at)}</div></td>
       <td>{incidentCode(r.incident_id)}<div className="muted">{r.incident_type} · {r.incident_location}</div></td>
       <td>{r.task}{r.instructions&&<div className="muted">{r.instructions}</div>}</td>
       <td><Badge status={r.status}/>{r.status_reason&&<div className="muted status-reason">{r.status_reason}</div>}</td>
       <td>{actions.length
        ?<div className="action-row">{actions.map(action=><button key={action.status} type="button" className={action.tone==='danger'?'btn btn-danger btn-small':'btn btn-small'} disabled={busyId===r.id} onClick={()=>update(r,action)}>{action.label}</button>)}</div>
        :<span className="muted">{r.status==='Completed'?'Finished':'No action needed'}</span>}</td>
      </tr>;
     })}</tbody>
    </table></div>
   :<Empty>{filtered?'No assignments match these filters.':'No assignments yet. When a coordinator assigns you a task it will appear here.'}</Empty>}
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="assignments" loading={list.loading}/>
  </section>
 </>;
}
