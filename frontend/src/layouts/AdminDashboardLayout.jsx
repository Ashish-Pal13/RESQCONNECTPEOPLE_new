import React,{useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {FiGrid,FiAlertTriangle,FiUsers,FiUserCheck,FiClipboard,FiPackage,FiBarChart2,FiUserPlus,FiLifeBuoy,FiMail,FiLogOut} from 'react-icons/fi';
import {useAuth} from '../context/Auth';
import {ROLE_LABELS} from '../lib/roles';
import BrandLogo from '../lib/BrandLogo';
import DashboardFrame from '../components/DashboardFrame';
import NotificationBell from '../components/NotificationBell';
import {initials} from '../lib/initials';
export const ADMIN_TITLE='RESQ~CONNECT | Admin Portal';
const COORDINATOR_NAV=[
 {to:'/admin',label:'Dashboard',icon:FiGrid,exact:true},
 {to:'/admin/incidents',label:'Emergency Reports',icon:FiAlertTriangle},
 {to:'/admin/volunteers',label:'Volunteer Directory',icon:FiUsers},
 {to:'/admin/verification',label:'Volunteer Verification',icon:FiUserCheck},
 {to:'/admin/assignments',label:'Assignments',icon:FiClipboard},
 {to:'/admin/resources',label:'Relief Coordination',icon:FiPackage},
 {to:'/admin/analytics',label:'Reports & Analytics',icon:FiBarChart2},
 {to:'/admin/users',label:'Registered Users',icon:FiUserPlus},
 {to:'/admin/tickets',label:'Support Tickets',icon:FiLifeBuoy},
 {to:'/admin/messages',label:'Contact Messages',icon:FiMail}
];
const VERIFIER_NAV=[
 {to:'/admin',label:'Dashboard',icon:FiGrid,exact:true},
 {to:'/admin/verification',label:'Volunteer Verification',icon:FiUserCheck}
];
export function navigationItems(role){return role==='verifier'?VERIFIER_NAV:COORDINATOR_NAV}
export function useAdminTitle(){useEffect(()=>{const previous=document.title;document.title=ADMIN_TITLE;return ()=>{document.title=previous}},[])}
export default function AdminDashboardLayout(){
 const {user,logout}=useAuth();
 const navigate=useNavigate();
 useAdminTitle();
 const roleLabel=ROLE_LABELS[user.role];
 const accountName=user.name&&user.name!==roleLabel?user.name:(user.username||user.name);
 return <DashboardFrame
  appId="adminApp"
  navId="navigation"
  mainId="mainContent"
  label="Administration navigation"
  logo={<BrandLogo className="header-logo"/>}
  headerRight={<>
   <NotificationBell/>
   <div className="dash-account">
    <span className="dash-avatar" aria-hidden="true">{initials(accountName)}</span>
    <span className="dash-account-text">
     <span className="dash-account-name">{accountName}</span>
     <span id="roleBadge" className="role-label">{roleLabel}</span>
    </span>
   </div>
   <button className="btn btn-secondary dash-logout" id="logoutBtn" aria-label="Logout" onClick={()=>{logout();navigate('/admin/login',{replace:true})}}><FiLogOut aria-hidden="true"/><span className="dash-logout-text">Logout</span></button>
  </>}
  sidebarTitle="Administration"
  navItems={navigationItems(user.role)}
  footer="RESQ~CONNECT • Academic project demonstration • Not an official emergency dispatch service"
 />;
}
