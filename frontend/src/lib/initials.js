export function initials(name){
 const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
 if(!parts.length)return '?';
 return (parts.length===1?parts[0].slice(0,2):parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}
