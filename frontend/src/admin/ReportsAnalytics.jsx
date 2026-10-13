import React from 'react';
import {useData} from '../lib/useData';
import {Notice,PageHeading,StatCard} from '../lib/ui';
import {INCIDENT_STATUSES} from './tables';
import {ASSIGNMENT_STATUSES} from '../lib/assignments';
function Breakdown({title,counts,total,statuses,loading}){
 return <section className="panel">
  <h2>{title}</h2>
  {statuses.map(status=>{
   const count=counts?.[status]??0;
   const percent=total?Math.round(count/total*100):0;
   return <div className="breakdown-row" key={status}>
    <div className="breakdown-label"><span>{status}</span><strong>{loading?'—':count}</strong></div>
    <div className="progress-track" role="img" aria-label={`${status}: ${count} of ${total}`}><div className={`progress-bar status-${status.toLowerCase().replace(/\s+/g,'-')}`} style={{width:`${loading?0:percent}%`}}></div></div>
   </div>;
  })}
 </section>;
}
export default function ReportsAnalytics(){
 const analytics=useData('/admin/analytics',{});
 const summary=useData('/admin/summary',{});
 const a=analytics.data;
 const s=summary.data;
 const loading=analytics.loading;
 const n=value=>loading?'—':(value??0);
 return <>
  <PageHeading title="Reports & Analytics" subtitle="A summary of the data stored in the RESQ~CONNECT database."/>
  <Notice message={analytics.error||summary.error}/>
  <div className="cards">
   <StatCard label="Total Incidents" value={n(a.incidents?.total)} note="All reports" tone="primary"/>
   <StatCard label="Volunteers" value={n(a.volunteers?.total)} note="Registered demo records"/>
   <StatCard label="Assignments" value={n(a.assignments?.total)} note="All assignment records"/>
   <StatCard label="Completed Assignments" value={n(a.assignments?.by_status?.Completed)} note="Marked completed" tone="success"/>
  </div>
  <div className="cards cards-2">
   <Breakdown title="Incident Status" counts={a.incidents?.by_status} total={a.incidents?.total||0} statuses={INCIDENT_STATUSES} loading={loading}/>
   <Breakdown title="Assignment Status" counts={a.assignments?.by_status} total={a.assignments?.total||0} statuses={ASSIGNMENT_STATUSES} loading={loading}/>
  </div>
  <section className="panel">
   <h2>Volunteer Summary</h2>
   <p>General volunteers: <strong>{n(a.volunteers?.general)}</strong></p>
   <p>Trained volunteers: <strong>{n(a.volunteers?.trained)}</strong></p>
   <p>Verified trained volunteers: <strong>{n(a.volunteers?.verified)}</strong></p>
   <p>Pending verification: <strong>{n(a.volunteers?.pending)}</strong></p>
  </section>
  <section className="panel">
   <h2>Platform Summary</h2>
   <p>Registered users: <strong>{summary.loading?'—':s.users??0}</strong></p>
   <p>Support tickets: <strong>{summary.loading?'—':s.tickets??0}</strong></p>
   <p>Open support tickets: <strong>{summary.loading?'—':s.open_tickets??0}</strong></p>
   <p>Contact messages: <strong>{summary.loading?'—':s.contact_messages??0}</strong></p>
  </section>
  <div className="notice">
   These figures come from the RESQ~CONNECT project database and should not be treated as official incident statistics.
  </div>
 </>;
}
