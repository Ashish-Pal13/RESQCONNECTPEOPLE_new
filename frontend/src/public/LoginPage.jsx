import React,{useState} from 'react';
import {Link,Navigate,useLocation} from 'react-router-dom';
import {FiLock,FiMail} from 'react-icons/fi';
import {useAuth} from '../context/Auth';
import {destinationFor,EMAIL_PATTERN,friendlyAuthError} from '../lib/authRedirect';
import AuthShell from './AuthShell';
import {FormAlert,PasswordField,SubmitButton,TextField} from '../components/AuthFields';
function validate(values){
 const errors={};
 if(!values.email.trim())errors.email='Enter your email address.';
 else if(!EMAIL_PATTERN.test(values.email.trim()))errors.email='Enter a valid email address, for example name@example.com.';
 if(!values.password)errors.password='Enter your password.';
 return errors;
}
export default function LoginPage(){
 const {user,login,sessionError}=useAuth();
 const location=useLocation();
 const [values,setValues]=useState({email:'',password:''});
 const [errors,setErrors]=useState({});
 const [formError,setFormError]=useState('');
 const [busy,setBusy]=useState(false);
 if(user)return <Navigate to={destinationFor(user,location.state?.from)} replace/>;
 const update=event=>{
  const {name,value}=event.target;
  setValues(current=>({...current,[name]:value}));
  if(errors[name])setErrors(current=>({...current,[name]:undefined}));
 };
 async function submit(event){
  event.preventDefault();
  if(busy)return;
  const found=validate(values);
  setErrors(found);
  setFormError('');
  if(Object.keys(found).length){document.getElementById(`login-${Object.keys(found)[0]}`)?.focus();return}
  setBusy(true);
  try{await login(values.email.trim(),values.password)}
  catch(err){
   setFormError(err.status===401?'The email or password is incorrect. Please check them and try again.':friendlyAuthError(err,'Sign in failed. Please try again.'));
   setBusy(false);
  }
 }
 return <AuthShell>
  <div className="auth-eyebrow">WELCOME BACK</div>
  <h1 className="auth-title">Sign in to your account</h1>
  <p className="auth-subtitle">Continue your journey with RESQ~CONNECT.</p>
  <FormAlert message={formError||sessionError}/>
  <form className="auth-form" onSubmit={submit} noValidate>
   <TextField id="login-email" name="email" type="email" label="Email Address" icon={FiMail} placeholder="you@example.com" autoComplete="email" inputMode="email" maxLength={255} value={values.email} onChange={update} error={errors.email} disabled={busy} required/>
   <PasswordField id="login-password" name="password" label="Password" icon={FiLock} placeholder="Enter your password" autoComplete="current-password" maxLength={128} value={values.password} onChange={update} error={errors.password} disabled={busy} required/>
   <SubmitButton busy={busy} label="Sign In" busyLabel="Signing in…"/>
  </form>
  <p className="auth-switch">New to RESQ~CONNECT? <Link to="/register">Create an account</Link></p>
  <div className="auth-divider" role="presentation"><span></span></div>
  <p className="auth-secondary"><Link to="/admin/login">Administrator login</Link></p>
 </AuthShell>;
}
