import React,{useState} from 'react';
import {useData,usePagedData} from '../lib/useData';
import {useDebounced} from '../lib/useDebounced';
import {Badge,Empty,FilterBar,Loading,Notice,PageHeading,Pagination,StatCard} from '../lib/ui';
import {formatDateTime} from '../lib/format';
import {ROLE_LABELS} from '../lib/roles';
const PAGE_SIZES=[10,20,50,100];
const roleLabel=role=>role==='user'?'User':ROLE_LABELS[role]||role;
export default function RegisteredUsers(){
 const [search,setSearch]=useState('');
 const [role,setRole]=useState('user');
 const [volunteer,setVolunteer]=useState('all');
 const [status,setStatus]=useState('all');
 const [pageSize,setPageSize]=useState(20);
 const term=useDebounced(search.trim());
 const users=usePagedData('/admin/users',{search:term,role,volunteer,status},pageSize);
 const stats=useData('/admin/users/stats',{});
 const filtered=Boolean(term)||role!=='user'||volunteer!=='all'||status!=='all';
 const count=value=>stats.loading?'—':(value??0);
 return <>
  <PageHeading title="Registered Users" subtitle="Review accounts created through the RESQ~CONNECT registration form."/>
  <Notice message={stats.error}/>
  <div className="cards">
   <StatCard label="Total Registered Users" value={count(stats.data.total_users)} note="Excludes administrator accounts" tone="primary"/>
   <StatCard label="New in Last 7 Days" value={count(stats.data.registered_last_7_days)} note="Recent registrations"/>
   <StatCard label="New in Last 30 Days" value={count(stats.data.registered_last_30_days)} note="Recent registrations"/>
   <StatCard label="Volunteer Profiles" value={count(stats.data.with_volunteer_profile)} note="Users who applied to volunteer"/>
  </div>
  <section className="panel">
   <FilterBar>
    <div>
     <label htmlFor="userSearch">Search</label>
     <input id="userSearch" type="search" placeholder="Name or email" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="userRole">Account Role</label>
     <select id="userRole" value={role} onChange={e=>setRole(e.target.value)}>
      <option value="user">User</option>
      <option value="coordinator">Emergency Coordinator</option>
      <option value="verifier">Volunteer Verification Admin</option>
      <option value="all">All roles</option>
     </select>
    </div>
    <div>
     <label htmlFor="userVolunteer">Volunteer Profile</label>
     <select id="userVolunteer" value={volunteer} onChange={e=>setVolunteer(e.target.value)}>
      <option value="all">All</option>
      <option value="yes">Has volunteer profile</option>
      <option value="no">No volunteer profile</option>
     </select>
    </div>
    <div>
     <label htmlFor="userStatus">Account Status</label>
     <select id="userStatus" value={status} onChange={e=>setStatus(e.target.value)}>
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="disabled">Disabled</option>
     </select>
    </div>
    <div>
     <label htmlFor="userPageSize">Rows per Page</label>
     <select id="userPageSize" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>{PAGE_SIZES.map(size=><option key={size} value={size}>{size}</option>)}</select>
    </div>
   </FilterBar>
   {users.loading&&!users.rows.length?<Loading/>
   :users.error?<div className="notice">{users.error} <button className="btn btn-secondary" type="button" onClick={users.reload}>Try Again</button></div>
   :users.rows.length?<>
     <div className="table-wrap"><table>
      <thead><tr><th>User ID</th><th>Full Name</th><th>Email Address</th><th>Phone Number</th><th>Account Role</th><th>Volunteer Profile</th><th>Registration Date</th><th>Account Status</th></tr></thead>
      <tbody>{users.rows.map(u=><tr key={u.id}>
       <td>{u.id}</td>
       <td>{u.name}</td>
       <td>{u.email}</td>
       <td>{u.phone||'—'}</td>
       <td><Badge status={roleLabel(u.role)}/></td>
       <td>{u.volunteer_status?<Badge status={u.volunteer_status}/>:<span className="muted">Not registered</span>}</td>
       <td>{formatDateTime(u.created_at)}</td>
       <td><Badge status={u.is_active?'Active':'Disabled'}/></td>
      </tr>)}</tbody>
     </table></div>
     <Pagination pagination={users.pagination} onPage={users.setPage} noun="records" loading={users.loading}/>
    </>
   :<Empty>{filtered?'No registered users match these filters.':'No users have registered yet.'}</Empty>}
  </section>
 </>;
}
