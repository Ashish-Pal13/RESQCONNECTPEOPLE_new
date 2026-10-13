import React,{useState} from 'react';
import {FiAlertCircle,FiArrowRight,FiEye,FiEyeOff} from 'react-icons/fi';
export function TextField({id,label,icon:Icon,error,hint,className='',...inputProps}){
 const describedBy=[hint?`${id}-hint`:'',error?`${id}-error`:''].filter(Boolean).join(' ')||undefined;
 return <div className={`auth-field ${className}`}>
  <label className="auth-label" htmlFor={id}>{label}</label>
  <div className={error?'auth-control has-error':'auth-control'}>
   {Icon&&<Icon className="auth-control-icon" aria-hidden="true"/>}
   <input id={id} className="auth-input" aria-invalid={error?'true':'false'} aria-describedby={describedBy} {...inputProps}/>
  </div>
  {hint&&<div id={`${id}-hint`} className="auth-hint">{hint}</div>}
  {error&&<div id={`${id}-error`} className="auth-error"><FiAlertCircle aria-hidden="true"/><span>{error}</span></div>}
 </div>;
}
export function PasswordField({id,label,icon:Icon,error,hint,className='',...inputProps}){
 const [visible,setVisible]=useState(false);
 const describedBy=[hint?`${id}-hint`:'',error?`${id}-error`:''].filter(Boolean).join(' ')||undefined;
 return <div className={`auth-field ${className}`}>
  <label className="auth-label" htmlFor={id}>{label}</label>
  <div className={error?'auth-control has-toggle has-error':'auth-control has-toggle'}>
   {Icon&&<Icon className="auth-control-icon" aria-hidden="true"/>}
   <input id={id} className="auth-input" type={visible?'text':'password'} aria-invalid={error?'true':'false'} aria-describedby={describedBy} {...inputProps}/>
   <button type="button" className="auth-toggle" aria-controls={id} aria-pressed={visible} aria-label={visible?`Hide ${label.toLowerCase()}`:`Show ${label.toLowerCase()}`} onClick={()=>setVisible(value=>!value)} disabled={inputProps.disabled}>{visible?<FiEyeOff aria-hidden="true"/>:<FiEye aria-hidden="true"/>}</button>
  </div>
  {hint&&<div id={`${id}-hint`} className="auth-hint">{hint}</div>}
  {error&&<div id={`${id}-error`} className="auth-error"><FiAlertCircle aria-hidden="true"/><span>{error}</span></div>}
 </div>;
}
export function SubmitButton({busy,label,busyLabel}){
 return <button type="submit" className="auth-button" disabled={busy} aria-busy={busy?'true':'false'}>
  {busy?<><span className="auth-spinner" aria-hidden="true"></span><span>{busyLabel}</span></>:<><span>{label}</span><FiArrowRight className="auth-button-icon" aria-hidden="true"/></>}
 </button>;
}
export function FormAlert({message}){
 if(!message)return null;
 return <div className="auth-alert" role="alert"><FiAlertCircle aria-hidden="true"/><span>{message}</span></div>;
}
