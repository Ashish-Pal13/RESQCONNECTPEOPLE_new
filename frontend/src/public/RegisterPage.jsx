import React,{useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {FiCheckCircle,FiCircle,FiLock,FiMail,FiShield,FiUser} from 'react-icons/fi';
import {useAuth} from '../context/Auth';
import {homeFor} from '../lib/roles';
import {EMAIL_PATTERN,friendlyAuthError} from '../lib/authRedirect';
import AuthShell from './AuthShell';
import {FormAlert,PasswordField,SubmitButton,TextField} from '../components/AuthFields';
const byteLength=value=>new TextEncoder().encode(value).length;
const PASSWORD_RULES=[
 {id:'length',text:'At least 8 characters',test:value=>value.length>=8},
 {id:'max',text:'No more than 72 bytes (about 72 letters, fewer with emoji or non-Latin characters)',test:value=>value.length>0&&byteLength(value)<=72&&value.length<=128}
];
function validate(values){
 const errors={};
 const name=values.name.trim();
 if(!name)errors.name='Enter your full name.';
 else if(name.length<2)errors.name='Your name must be at least 2 characters.';
 else if(name.length>120)errors.name='Your name must be 120 characters or fewer.';
 const email=values.email.trim();
 if(!email)errors.email='Enter your email address.';
 else if(!EMAIL_PATTERN.test(email)||email.length>255)errors.email='Enter a valid email address, for example name@example.com.';
 if(!values.password)errors.password='Create a password.';
 else if(values.password.length<8)errors.password='Your password must be at least 8 characters.';
 else if(byteLength(values.password)>72||values.password.length>128)errors.password='Your password is too long. Use at most 72 bytes.';
 if(!values.confirm)errors.confirm='Re-enter your password to confirm it.';
 else if(values.confirm!==values.password)errors.confirm='The passwords do not match.';
 return errors;
}
export default function RegisterPage(){
 const {user,register}=useAuth();
 const [values,setValues]=useState({name:'',email:'',password:'',confirm:''});
 const [errors,setErrors]=useState({});
 const [formError,setFormError]=useState('');
 const [busy,setBusy]=useState(false);
 if(user)return <Navigate to={homeFor(user)} replace/>;
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
  if(Object.keys(found).length){document.getElementById(`register-${Object.keys(found)[0]}`)?.focus();return}
  setBusy(true);
  try{await register(values.name.trim(),values.email.trim(),values.password)}
  catch(err){
   if(err.status===409){setErrors({email:'An account with this email already exists. Sign in instead, or use a different email.'});document.getElementById('register-email')?.focus()}
   else setFormError(friendlyAuthError(err,'We could not create your account. Please try again.'));
   setBusy(false);
  }
 }
 const ruleState=PASSWORD_RULES.map(rule=>({...rule,met:rule.test(values.password)}));
 return <AuthShell>
  <div className="auth-eyebrow">JOIN THE COMMUNITY</div>
  <h1 className="auth-title">Create your account</h1>
  <p className="auth-subtitle">Join RESQ~CONNECT and start supporting your community.</p>
  <FormAlert message={formError}/>
  <form className="auth-form" onSubmit={submit} noValidate>
   <TextField id="register-name" name="name" label="Full Name" icon={FiUser} placeholder="Your full name" autoComplete="name" maxLength={120} value={values.name} onChange={update} error={errors.name} disabled={busy} required/>
   <TextField id="register-email" name="email" type="email" label="Email Address" icon={FiMail} placeholder="you@example.com" autoComplete="email" inputMode="email" maxLength={255} value={values.email} onChange={update} error={errors.email} disabled={busy} required/>
   <PasswordField id="register-password" name="password" label="Password" icon={FiLock} placeholder="Create a password" autoComplete="new-password" maxLength={128} value={values.password} onChange={update} error={errors.password} disabled={busy} required
    hint={<ul className="auth-rules" aria-label="Password requirements">{ruleState.map(rule=><li key={rule.id} className={rule.met?'met':''}>{rule.met?<FiCheckCircle aria-hidden="true"/>:<FiCircle aria-hidden="true"/>}<span>{rule.text}<span className="sr-only">{rule.met?' (met)':' (not met yet)'}</span></span></li>)}</ul>}/>
   <PasswordField id="register-confirm" name="confirm" label="Confirm Password" icon={FiShield} placeholder="Re-enter your password" autoComplete="new-password" maxLength={128} value={values.confirm} onChange={update} error={errors.confirm} disabled={busy} required/>
   <SubmitButton busy={busy} label="Create Account" busyLabel="Creating account…"/>
  </form>
  <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
 </AuthShell>;
}
