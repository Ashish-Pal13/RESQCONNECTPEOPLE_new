import {homeFor,isStaff} from './roles';
export function destinationFor(user,from){
 if(!user)return '/';
 const path=from&&typeof from.pathname==='string'?`${from.pathname}${from.search||''}`:'';
 if(path){
  if(user.role==='user'&&from.pathname.startsWith('/dashboard'))return path;
  if(isStaff(user)&&from.pathname.startsWith('/admin')&&from.pathname!=='/admin/login')return path;
 }
 return homeFor(user);
}
export const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function friendlyAuthError(err,fallback){
 if(err?.status===0)return 'We could not reach the server. Check your connection and try again.';
 if(err?.status===429)return 'Too many attempts. Please wait a few minutes before trying again.';
 if(err?.status>=500)return 'Something went wrong on our side. Please try again in a moment.';
 return err?.message||fallback;
}
