import React from 'react';
import {api} from '../api';
import {useData} from '../lib/useData';
import {Badge,Empty,ErrorState,Loading,Notice,PageHeading,useNotice} from '../lib/ui';
import {FormGrid,field} from './FormGrid';
export default function VolunteerProfile(){
 const {data,loading,error,reload}=useData('/volunteers');
 const notice=useNotice();
 const mine=data[0];
 const canApply=!loading&&!error&&(!mine||mine.verification==='Rejected');
 async function apply(d){notice.clear();await api('/volunteers',{method:'POST',body:d});reload();notice.success('Volunteer application submitted')}
 async function update(d){notice.clear();await api('/volunteers/me',{method:'PATCH',body:d});reload();notice.success('Volunteer profile updated')}
 return <>
  <PageHeading eyebrow="VOLUNTEER NETWORK" title="My Volunteer Profile" subtitle="Apply to support your community."/>
  {canApply&&<section className="panel">
   <h2>{mine?'Reapply as a volunteer':'Register as a volunteer'}</h2>
   {mine&&<div className="notice">Your previous application was rejected{mine.last_review_reason?`: ${mine.last_review_reason}`:''}. Update your details and submit again.</div>}
   <FormGrid id="volunteer" onSave={apply} button={mine?'Resubmit Application':'Submit Application'} fields={[
    field('category','Volunteer Category',{options:['General','Trained'],defaultValue:mine?.category}),
    field('availability','Availability',{options:['Available','Unavailable'],defaultValue:mine?.availability}),
    field('location','Location',{defaultValue:mine?.location}),
    field('phone','Phone',{type:'tel',max:30,defaultValue:mine?.phone}),
    field('skills','Skills',{wide:true,multiline:true,max:1000,defaultValue:mine?.skills}),
    field('training','Training Details (trained applicants)',{wide:true,multiline:true,required:false,max:1000,defaultValue:mine?.training}),
    field('certificate','Certificate Reference (trained applicants)',{wide:true,required:false,max:1000,defaultValue:mine?.certificate})
   ]}/>
   <p className="muted">Trained applicants require admin verification. Certificate references are text only; document uploads are not supported in this version.</p>
  </section>}
  {mine&&mine.verification!=='Rejected'&&<section className="panel">
   <h2>Update my profile</h2>
   <FormGrid id="profile" key={mine.id} onSave={update} reset={false} button="Save Changes" fields={[
    field('availability','Availability',{options:['Available','Unavailable'],defaultValue:mine.availability}),
    field('phone','Phone',{type:'tel',max:30,defaultValue:mine.phone}),
    field('location','Location',{wide:true,defaultValue:mine.location}),
    field('skills','Skills',{wide:true,multiline:true,max:1000,defaultValue:mine.skills})
   ]}/>
  </section>}
  {notice.element}
  <Notice message={error}/>
  <section className="panel">
   <h2>Volunteer Records</h2>
   {loading&&!data.length?<Loading/>:error&&!data.length?<ErrorState message={error} onRetry={reload}/>:data.length?
    <div className="table-wrap"><table>
     <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Skills</th><th>Availability</th><th>Verification</th><th>Review Note</th></tr></thead>
     <tbody>{data.map(r=><tr key={r.id}>
      <td>{r.name}</td><td>{r.category}</td><td>{r.location}</td><td>{r.skills}</td>
      <td><Badge status={r.availability}/></td><td><Badge status={r.verification}/></td><td>{r.last_review_reason||'—'}</td>
     </tr>)}</tbody>
    </table></div>
   :<Empty>No records available</Empty>}
  </section>
 </>;
}
