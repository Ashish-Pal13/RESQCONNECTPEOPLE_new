import React from 'react';
import {Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {useAuth} from './context/Auth';
import {homeFor} from './lib/roles';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import {Home,Contact} from './public/PublicPages';
import Services from './public/ServicesPage';
import About from './public/AboutPage';
import Support from './public/SupportPage';
import LoginPage from './public/LoginPage';
import RegisterPage from './public/RegisterPage';
import AdminLogin from './admin/AdminLogin';
import AdminDashboardLayout from './layouts/AdminDashboardLayout';
import Dashboard from './admin/Dashboard';
import EmergencyReports from './admin/EmergencyReports';
import VolunteerDirectory from './admin/VolunteerDirectory';
import VolunteerVerification from './admin/VolunteerVerification';
import Assignments from './admin/Assignments';
import ReliefCoordination from './admin/ReliefCoordination';
import ReportsAnalytics from './admin/ReportsAnalytics';
import RegisteredUsers from './admin/RegisteredUsers';
import SupportTickets from './admin/SupportTickets';
import ContactMessages from './admin/ContactMessages';
import UserDashboardLayout from './layouts/UserDashboardLayout';
import Overview from './user/Overview';
import MyReports from './user/MyReports';
import VolunteerProfile from './user/VolunteerProfile';
import MyAssignments from './user/MyAssignments';
import MyTickets from './user/MyTickets';
function RequireRole({roles,loginPath,fallback,children}){
 const {user,loading}=useAuth();
 const location=useLocation();
 if(loading)return <div className="loading-screen">Loading...</div>;
 if(!user)return <Navigate to={loginPath} replace state={{from:location}}/>;
 if(!roles.includes(user.role))return <Navigate to={fallback||homeFor(user)} replace/>;
 return children;
}
const staff=['coordinator','verifier'];
const coordinatorOnly=element=><RequireRole roles={['coordinator']} loginPath="/admin/login" fallback="/admin">{element}</RequireRole>;
export default function App(){
 return <Routes>
  <Route element={<PublicLayout/>}>
   <Route index element={<Home/>}/>
   <Route path="about" element={<About/>}/>
   <Route path="services" element={<Services/>}/>
   <Route path="contact" element={<Contact/>}/>
   <Route path="support" element={<Support/>}/>
  </Route>
  <Route element={<AuthLayout/>}>
   <Route path="login" element={<LoginPage/>}/>
   <Route path="register" element={<RegisterPage/>}/>
   <Route path="admin/login" element={<AdminLogin/>}/>
  </Route>
  <Route path="admin" element={<RequireRole roles={staff} loginPath="/admin/login"><AdminDashboardLayout/></RequireRole>}>
   <Route index element={<Dashboard/>}/>
   <Route path="incidents" element={coordinatorOnly(<EmergencyReports/>)}/>
   <Route path="volunteers" element={coordinatorOnly(<VolunteerDirectory/>)}/>
   <Route path="verification" element={<VolunteerVerification/>}/>
   <Route path="assignments" element={coordinatorOnly(<Assignments/>)}/>
   <Route path="resources" element={coordinatorOnly(<ReliefCoordination/>)}/>
   <Route path="analytics" element={coordinatorOnly(<ReportsAnalytics/>)}/>
   <Route path="users" element={coordinatorOnly(<RegisteredUsers/>)}/>
   <Route path="tickets" element={coordinatorOnly(<SupportTickets/>)}/>
   <Route path="messages" element={coordinatorOnly(<ContactMessages/>)}/>
   <Route path="*" element={<Navigate to="/admin" replace/>}/>
  </Route>
  <Route path="dashboard" element={<RequireRole roles={['user']} loginPath="/login"><UserDashboardLayout/></RequireRole>}>
   <Route index element={<Overview/>}/>
   <Route path="incidents" element={<MyReports/>}/>
   <Route path="volunteer" element={<VolunteerProfile/>}/>
   <Route path="assignments" element={<MyAssignments/>}/>
   <Route path="tickets" element={<MyTickets/>}/>
   <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
  </Route>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>;
}
