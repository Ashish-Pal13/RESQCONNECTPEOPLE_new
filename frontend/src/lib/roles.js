export const ROLE_LABELS={coordinator:'Emergency Coordinator',verifier:'Volunteer Verification Admin'};
export const STAFF_ROLES=['coordinator','verifier'];
export const isStaff=user=>!!user&&STAFF_ROLES.includes(user.role);
export const homeFor=user=>isStaff(user)?'/admin':'/dashboard';
