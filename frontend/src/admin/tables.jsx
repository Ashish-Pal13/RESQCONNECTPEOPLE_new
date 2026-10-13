import React,{Fragment} from 'react';
import {Badge,Empty} from '../lib/ui';
import {formatDay,incidentCode,volunteerCode} from '../lib/format';
export {ASSIGNMENT_STATUSES} from '../lib/assignments';
export const INCIDENT_STATUSES=['Under Review','In Progress','Resolved'];
export const URGENCY_LEVELS=['Low','Medium','High','Critical'];
export function PendingSummary({pending,emptyText='No applications are currently pending verification.'}){
 if(!pending.length)return <Empty>{emptyText}</Empty>;
 return <div className="table-wrap"><table>
  <thead><tr><th>Volunteer ID</th><th>Name</th><th>Location</th><th>Status</th></tr></thead>
  <tbody>{pending.map(v=><tr key={v.id}>
   <td>{volunteerCode(v.id,v.category)}</td>
   <td>{v.name}</td>
   <td>{v.location}</td>
   <td><Badge status={v.verification}/></td>
  </tr>)}</tbody>
 </table></div>;
}
export function IncidentTable({items,editable=false,onStatusChange,emptyText='No reports found.'}){
 if(!items.length)return <Empty>{emptyText}</Empty>;
 return <div className="table-wrap"><table>
  <thead><tr>
   <th>Report ID</th><th>Incident</th><th>Location</th>
   <th>Urgency</th><th>Status</th>{editable&&<th>Update</th>}
  </tr></thead>
  <tbody>{items.map(i=><Fragment key={i.id}>
   <tr data-highlight={i.id}>
    <td><strong>{incidentCode(i.id)}</strong>{i.reporter&&<div className="muted">{i.reporter}</div>}</td>
    <td>{i.type}</td>
    <td>{i.location}</td>
    <td><Badge status={i.urgency}/></td>
    <td><Badge status={i.status}/></td>
    {editable&&<td>
     <select aria-label={`Status for ${incidentCode(i.id)}`} value={i.status} onChange={e=>onStatusChange(i,e.target.value)}>
      {INCIDENT_STATUSES.map(s=><option key={s}>{s}</option>)}
     </select>
    </td>}
   </tr>
   <tr className="detail-row"><td colSpan={editable?6:5}>
    <span className="muted">{formatDay(i.created_at)} · {i.description}</span>
   </td></tr>
  </Fragment>)}</tbody>
 </table></div>;
}
