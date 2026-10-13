import React from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/Auth';
import {useData,EMPTY_PAGE} from '../lib/useData';
import {ErrorState,Loading,Notice,PageHeading,StatCard} from '../lib/ui';
import {IncidentTable,PendingSummary} from './tables';
export default function Dashboard(){
 const {user}=useAuth();
 const navigate=useNavigate();
 const coordinator=user.role==='coordinator';
 const summary=useData('/admin/summary',{});
 const pending=useData('/volunteers?category=Trained&verification=Pending+Verification&page=1&pageSize=10',EMPTY_PAGE);
 const incidents=useData(coordinator?'/incidents?page=1&pageSize=5':null,EMPTY_PAGE);
 const s=summary.data;
 const count=value=>summary.loading?'—':(value??0);
 const pendingRows=pending.data.data||[];
 const pendingTotal=pending.data.pagination?.total||0;
 const pendingSummary=pending.loading?<Loading/>:pending.error?<ErrorState message={pending.error} onRetry={pending.reload}/>:<>
  <PendingSummary pending={pendingRows}/>
  {pendingTotal>pendingRows.length&&<p className="muted panel-footnote">Showing the {pendingRows.length} most recent of {pendingTotal} pending applications.</p>}
 </>;
 const cards=<div className="cards">
  <StatCard label="Total Reports" value={count(s.total_incidents)} note="All recorded incidents" tone="primary"/>
  <StatCard label="Open Reports" value={count(s.open_incidents)} note="Not marked resolved" tone="warning"/>
  <StatCard label="Registered Volunteers" value={count(s.volunteers)} note="General and trained"/>
  <StatCard label="Pending Verification" value={count(s.pending_verification)} note="Trained applications"/>
 </div>;
 const error=<Notice message={summary.error||pending.error||incidents.error}/>;
 if(!coordinator){
  return <>
   <PageHeading title="Verification Dashboard" subtitle="Review trained volunteer applications and their verification status."/>
   {error}
   {cards}
   <div className="notice">Your role is limited to volunteer verification. You cannot manage emergency reports, assignments, or relief resources.</div>
   <section className="panel">
    <div className="panel-header">
     <h2>Applications Awaiting Review</h2>
     <button className="btn" onClick={()=>navigate('/admin/verification')}>Review Applications</button>
    </div>
    {pendingSummary}
   </section>
  </>;
 }
 return <>
  <PageHeading title="Emergency Dashboard" subtitle="Monitor incidents, volunteers and response coordination."/>
  {error}
  {cards}
  <div className="cards">
   <StatCard label="Active Assignments" value={count(s.active_assignments)} note={summary.loading?'':`${count(s.assignments)} assignments in total`}/>
   <StatCard label="Resolved Reports" value={count(s.resolved_incidents)} note="Marked resolved" tone="success"/>
   <StatCard label="Verified Trained" value={count(s.verified_trained)} note="Eligible for trained assignments"/>
   <StatCard label="Resources" value={count(s.resources)} note="Relief requirements recorded"/>
  </div>
  <div className="cards">
   <StatCard label="Total Registered Users" value={count(s.users)} note="Excludes administrator accounts"/>
   <StatCard label="Open Support Tickets" value={count(s.open_tickets)} note={summary.loading?'':`${count(s.tickets)} tickets in total`}/>
   <StatCard label="Completed Assignments" value={count(s.completed_assignments)} note="Marked completed by volunteers" tone="success"/>
   <StatCard label="Contact Messages" value={count(s.contact_messages)} note="From the public contact form"/>
  </div>
  <section className="panel">
   <div className="panel-header">
    <h2>Recent Emergency Reports</h2>
    <button className="btn btn-secondary" onClick={()=>navigate('/admin/incidents')}>View All Reports</button>
   </div>
   {incidents.loading?<Loading/>:incidents.error?<ErrorState message={incidents.error} onRetry={incidents.reload}/>:<IncidentTable items={incidents.data.data||[]}/>}
  </section>
  <section className="panel">
   <div className="panel-header">
    <h2>Volunteer Verification Queue</h2>
    <button className="btn btn-secondary" onClick={()=>navigate('/admin/verification')}>Open Verification</button>
   </div>
   {pendingSummary}
  </section>
 </>;
}
