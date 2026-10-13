import React from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {FiHome,FiAlertTriangle,FiUser,FiClipboard,FiLifeBuoy,FiGlobe,FiLogOut} from 'react-icons/fi';
import {useAuth} from '../context/Auth';
import BrandLogo from '../lib/BrandLogo';
import DashboardFrame from '../components/DashboardFrame';
import NotificationBell from '../components/NotificationBell';
import {initials} from '../lib/initials';
const LINKS=[
 {to:'/dashboard',label:'Overview',icon:FiHome,exact:true},
 {to:'/dashboard/incidents',label:'My Reports',icon:FiAlertTriangle},
 {to:'/dashboard/volunteer',label:'Volunteer Profile',icon:FiUser},
 {to:'/dashboard/assignments',label:'My Assignments',icon:FiClipboard},
 {to:'/dashboard/tickets',label:'Support Tickets',icon:FiLifeBuoy},
 {to:'/',label:'Public Website',icon:FiGlobe,external:true}
];
export default function UserDashboardLayout(){
 const {user,logout}=useAuth();
 const navigate=useNavigate();
 return <DashboardFrame
  appId="userApp"
  navId="userNavigation"
  mainId="userContent"
  label="User portal navigation"
  logo={<Link className="logo-link" to="/" aria-label="RESQ~CONNECT home"><BrandLogo className="header-logo"/></Link>}
  headerRight={<>
   <NotificationBell/>
   <div className="dash-account">
    <span className="dash-avatar" aria-hidden="true">{initials(user.name)}</span>
    <span className="dash-account-text">
     <span className="dash-account-name">Welcome, {user.name}</span>
     <span className="role-label">Community Portal</span>
    </span>
   </div>
   <button className="btn btn-secondary dash-logout" aria-label="Logout" onClick={()=>{logout();navigate('/login',{replace:true})}}><FiLogOut aria-hidden="true"/><span className="dash-logout-text">Logout</span></button>
  </>}
  sidebarTitle="USER PORTAL"
  navItems={LINKS}
  footer="RESQ~CONNECT • Community disaster response coordination platform • Academic demonstration. Not an official emergency dispatch service. For immediate danger, contact local emergency services."
 />;
}
