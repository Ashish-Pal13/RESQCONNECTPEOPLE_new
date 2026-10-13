import React,{useState} from 'react';
import {Navigate,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/Auth';
import {isStaff} from '../lib/roles';
import {useAdminTitle} from '../layouts/AdminDashboardLayout';
import BrandLogo from '../lib/BrandLogo';
export default function AdminLogin(){
 const {user,loading,adminLogin,sessionError}=useAuth();
 const navigate=useNavigate();
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useAdminTitle();
 if(!loading&&isStaff(user))return <Navigate to="/admin" replace/>;
 async function login(event){
  event.preventDefault();
  const form=event.currentTarget;
  const role=form.elements.role.value;
  const username=form.elements.username.value.trim();
  const password=form.elements.password.value;
  setBusy(true);setError('');
  try{
   await adminLogin(role,username,password);
   form.elements.password.value='';
   navigate('/admin',{replace:true});
  }catch(err){
   setError(err.status===401||err.status===400?'Invalid username or password for the selected role.':err.message);
  }finally{setBusy(false)}
 }
 return <section id="loginScreen" className="login-screen">
  <div className="login-card">
   <BrandLogo className="auth-logo"/>
   <p className="subtitle">Disaster Response Administration Portal</p>
   <form id="loginForm" onSubmit={login}>
    <label htmlFor="role">Select Admin Role</label>
    <select id="role" name="role" required defaultValue="coordinator">
     <option value="coordinator">Emergency Coordinator</option>
     <option value="verifier">Volunteer Verification Admin</option>
    </select>
    <label htmlFor="username">Username</label>
    <input id="username" name="username" autoComplete="username" required placeholder="Enter username" maxLength={60}/>
    <label htmlFor="password">Password</label>
    <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Enter password" maxLength={128}/>
    <button className="btn btn-block" type="submit" disabled={busy}>Login to Dashboard</button>
    <div id="loginError" className="login-error" role="alert">{error||sessionError}</div>
   </form>
  </div>
 </section>;
}
