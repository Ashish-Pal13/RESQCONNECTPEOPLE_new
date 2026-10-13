export const incidentCode=id=>`INC-${id}`;
export const assignmentCode=id=>`ASN-${id}`;
export const volunteerCode=(id,category)=>`RC-${category==='Trained'?'T':'G'}-${String(id).padStart(4,'0')}`;
export const formatDay=value=>value?new Date(value).toLocaleDateString('en-IN'):'';
export const formatDateTime=value=>value?new Date(value).toLocaleString('en-IN'):'';
export function badgeColor(status){
 const text=String(status||'');
 if(/cancelled|declined|closed|unavailable|disabled|not registered/i.test(text))return 'gray';
 if(/critical|urgent|rejected/i.test(text))return 'red';
 if(/high/i.test(text))return 'orange';
 if(/active|verified|resolved|completed|approved|available|accepted/i.test(text))return 'green';
 if(/pending|review|medium|notified/i.test(text))return 'yellow';
 return 'blue';
}
