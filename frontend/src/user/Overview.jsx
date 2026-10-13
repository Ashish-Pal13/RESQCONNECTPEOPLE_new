import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/Auth';
import {useData,EMPTY_PAGE} from '../lib/useData';
import {Notice,PageHeading,StatCard} from '../lib/ui';
export default function Overview(){
 const {user}=useAuth();
 const incidents=useData('/incidents?page=1&pageSize=5',EMPTY_PAGE);
 const tickets=useData('/tickets?page=1&pageSize=5',EMPTY_PAGE);
 const volunteers=useData('/volunteers?page=1&pageSize=5',EMPTY_PAGE);
 const total=result=>result.data?.pagination?.total??0;
 const show=(result,value)=>result.loading||result.error?'—':value;
 const mine=volunteers.data?.data?.[0];
 return <>
  <PageHeading eyebrow="MY COMMUNITY" title={`Welcome, ${user?.name}`} subtitle="Track community activity and manage your response workflows."/>
  <Notice message={incidents.error||tickets.error||volunteers.error}/>
  <div className="cards">
   <StatCard label="My Reports" value={show(incidents,total(incidents))}/>
   <StatCard label="My Tickets" value={show(tickets,total(tickets))}/>
   <StatCard label="Volunteer Profile" value={show(volunteers,total(volunteers))} note={volunteers.loading?'':mine?mine.verification:'Not registered'}/>
  </div>
  <section className="panel">
   <h2>Quick access</h2>
   <div className="action-row">
    {[['Submit an Emergency Report','/dashboard/incidents'],['Become a Volunteer','/dashboard/volunteer'],['Open a Support Ticket','/dashboard/tickets']].map(([label,path])=><Link className="btn btn-secondary portal-link" to={path} key={path}>{label} →</Link>)}
   </div>
  </section>
 </>;
}
