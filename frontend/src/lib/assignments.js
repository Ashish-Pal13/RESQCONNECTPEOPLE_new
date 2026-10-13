export const ASSIGNMENT_STATUSES=['Notified','Accepted','In Progress','Completed','Declined','Cancelled'];
export const OPEN_ASSIGNMENT_STATUSES=['Notified','Accepted','In Progress'];
export const isOpenAssignment=status=>OPEN_ASSIGNMENT_STATUSES.includes(status);
export const VOLUNTEER_ACTIONS={
 Notified:[{status:'Accepted',label:'Accept',tone:'primary'},{status:'Declined',label:'Decline',tone:'danger'}],
 Accepted:[{status:'In Progress',label:'Start work',tone:'primary'},{status:'Declined',label:'Withdraw',tone:'danger'}],
 'In Progress':[{status:'Completed',label:'Mark completed',tone:'primary'}]
};
