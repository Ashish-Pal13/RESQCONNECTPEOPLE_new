import React,{useState} from 'react';
import {usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,ErrorState,FilterBar,Loading,Notice,PageHeading,Pagination} from '../lib/ui';
import {volunteerCode} from '../lib/format';
export default function VolunteerDirectory(){
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('');
 const [availability,setAvailability]=useState('');
 const [verification,setVerification]=useState('');
 const term=useDebounced(search.trim());
 const list=usePagedData('/volunteers',{search:term,category,availability,verification},20);
 const filtered=Boolean(term||category||availability||verification);
 return <>
  <PageHeading title="Volunteer Directory" subtitle="Search and filter volunteers before assigning response work."/>
  <Notice message={list.error}/>
  <section className="panel">
   <FilterBar>
    <div>
     <label htmlFor="volSearch">Search</label>
     <input id="volSearch" type="search" placeholder="Name, ID, skills or location" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="volType">Volunteer Type</label>
     <select id="volType" value={category} onChange={e=>setCategory(e.target.value)}>
      <option value="">All types</option>
      <option value="General">General</option>
      <option value="Trained">Trained</option>
     </select>
    </div>
    <div>
     <label htmlFor="volAvailability">Availability</label>
     <select id="volAvailability" value={availability} onChange={e=>setAvailability(e.target.value)}>
      <option value="">All</option>
      <option>Available</option>
      <option>Unavailable</option>
     </select>
    </div>
    <div>
     <label htmlFor="volVerification">Verification</label>
     <select id="volVerification" value={verification} onChange={e=>setVerification(e.target.value)}>
      <option value="">All statuses</option>
      <option>Not Required</option>
      <option>Pending Verification</option>
      <option>Active - Verified</option>
      <option>Rejected</option>
     </select>
    </div>
   </FilterBar>
   <div id="volunteerResults">{list.loading&&!list.rows.length?<Loading/>:list.error&&!list.rows.length?<ErrorState message={list.error} onRetry={list.reload}/>:list.rows.length
    ?<div className="table-wrap"><table>
      <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Location</th>
      <th>Skills</th><th>Availability</th><th>Verification</th></tr></thead>
      <tbody>{list.rows.map(v=><tr key={v.id}>
       <td><strong>{volunteerCode(v.id,v.category)}</strong></td><td>{v.name}</td>
       <td>{v.category}</td><td>{v.location}</td>
       <td>{v.skills}</td><td><Badge status={v.availability}/></td>
       <td><Badge status={v.verification}/></td>
      </tr>)}</tbody>
     </table></div>
    :<Empty>{filtered?'No volunteers match these filters.':'No volunteers have registered yet.'}</Empty>}</div>
   <Pagination pagination={list.pagination} onPage={list.setPage} noun="volunteers" loading={list.loading}/>
  </section>
  <div className="notice">
   Only volunteers with <strong>Active - Verified</strong> status are eligible for assignments that require trained responders. General volunteers can be considered for suitable non-specialist tasks.
  </div>
 </>;
}
