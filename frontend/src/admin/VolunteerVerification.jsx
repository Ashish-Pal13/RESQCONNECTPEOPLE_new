import React,{useState} from 'react';
import {api} from '../api';
import {usePagedData} from '../lib/useData';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination,useNotice} from '../lib/ui';
import {formatDateTime,volunteerCode} from '../lib/format';
import {useHighlight} from '../lib/useHighlight';
export default function VolunteerVerification(){
 const [verification,setVerification]=useState('');
 const volunteers=usePagedData('/volunteers',{category:'Trained',verification},10);
 const history=usePagedData('/verification-history',{},10);
 const notice=useNotice();
 useHighlight(!volunteers.loading);
 async function decideVerification(volunteer,decision){
  if(volunteer.verification!=='Pending Verification')return;
  let reason='';
  if(decision==='reject'){
   reason=window.prompt('Enter a reason for rejection:');
   if(reason===null)return;
   reason=reason.trim();
   if(!reason){notice.fail('Please enter a reason for rejection.');return}
  }else{
   if(!window.confirm("Approve this volunteer's training verification in the demo?"))return;
   reason='Application approved in demo';
  }
  notice.clear();
  try{
   await api(`/volunteers/${volunteer.id}/verify`,{method:'PATCH',body:{decision:decision==='approve'?'Approved':'Rejected',reason}});
   notice.success(`${volunteer.name} ${decision==='approve'?'approved':'rejected'}. The volunteer has been notified.`);
  }catch(err){notice.fail(err.message)}
  volunteers.reload();history.reload();
 }
 return <>
  <PageHeading title="Volunteer Verification" subtitle="Review training information and record a decision for each trained volunteer."/>
  {notice.element}
  <Notice message={volunteers.error||history.error}/>
  <section className="panel">
   <div className="panel-header"><h2>Trained Volunteer Applications</h2></div>
   <FilterBar>
    <div>
     <label htmlFor="verificationFilter">Verification Status</label>
     <select id="verificationFilter" value={verification} onChange={e=>setVerification(e.target.value)}>
      <option value="">All trained applications</option>
      <option>Pending Verification</option>
      <option>Active - Verified</option>
      <option>Rejected</option>
     </select>
    </div>
   </FilterBar>
   {volunteers.loading&&!volunteers.rows.length?<Loading/>:volunteers.error&&!volunteers.rows.length?<ErrorState message={volunteers.error} onRetry={volunteers.reload}/>:volunteers.rows.length?
    <div className="table-wrap"><table>
     <thead><tr><th>Volunteer</th><th>Location</th><th>Training</th>
     <th>Certificate Info</th><th>Status</th><th>Decision</th></tr></thead>
     <tbody>{volunteers.rows.map(v=><tr key={v.id} data-highlight={v.id}>
      <td><strong>{v.name}</strong><br/>
       <span className="muted">{volunteerCode(v.id,v.category)}</span></td>
      <td>{v.location}</td>
      <td>{v.training||'Not provided'}</td>
      <td>{v.certificate||'Not provided'}<br/>
       <span className="muted">ID document: Not attached in demo</span>
      </td>
      <td><Badge status={v.verification}/></td>
      <td>{v.verification==='Pending Verification'?
       <div className="action-row">
        <button className="btn btn-success" onClick={()=>decideVerification(v,'approve')}>Approve</button>
        <button className="btn btn-danger" onClick={()=>decideVerification(v,'reject')}>Reject</button>
       </div>:<span className="muted">Decision recorded</span>}
      </td>
     </tr>)}</tbody>
    </table></div>
   :<Empty>{verification?'No applications with this status.':'No trained volunteer applications found.'}</Empty>}
   <Pagination pagination={volunteers.pagination} onPage={volunteers.setPage} noun="applications" loading={volunteers.loading}/>
  </section>
  <section className="panel">
   <h2>Verification History</h2>
   {history.loading&&!history.rows.length?<Loading/>:history.error&&!history.rows.length?<ErrorState message={history.error} onRetry={history.reload}/>:history.rows.length?history.rows.map(h=>
    <div className="history-item" key={h.id}>
     <strong>{h.volunteer_name}</strong> ({volunteerCode(h.volunteer_id,h.volunteer_category)}) — <Badge status={h.decision}/><br/>
     <span className="muted">{formatDateTime(h.created_at)}{h.reviewer?` · ${h.reviewer}`:''}</span><br/>
     Reason: {h.reason||'No reason provided'}
    </div>
   ):<Empty>No decisions have been recorded yet.</Empty>}
   <Pagination pagination={history.pagination} onPage={history.setPage} noun="decisions" loading={history.loading}/>
  </section>
 </>;
}
