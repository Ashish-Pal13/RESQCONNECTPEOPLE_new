import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {FiAlertTriangle,FiArrowRight,FiCheckCircle,FiClock,FiInbox,FiLayers,FiLifeBuoy,FiMail,FiMessageSquare,FiPhone,FiPhoneCall,FiSend,FiTrendingUp,FiUsers} from 'react-icons/fi';
import {MdChildCare,MdFlood,MdLocalFireDepartment,MdLocalHospital,MdLocalPolice,MdPhoneInTalk,MdSupportAgent,MdWoman} from 'react-icons/md';
import {api} from '../api';
import HeroVideo from './HeroVideo';
import {DEFAULT_PHONE_COUNTRY,OTHER_PHONE_COUNTRY,PHONE_COUNTRIES,findPhoneCountry,validatePhone} from '../lib/phone';
import '../styles/contact-form.css';
import '../styles/home-sections.css';
import '../styles/info-pages.css';
const HOME_FACTS=[
 {icon:FiClock,value:'24/7',label:'Emergency awareness'},
 {icon:FiLayers,value:'1 place',label:'Reports & coordination'},
 {icon:FiUsers,value:'Community',label:'Volunteer-powered help'},
 {icon:FiPhoneCall,value:'112',label:"India's unified emergency number"}
];
const HOW_IT_HELPS=[
 {icon:FiAlertTriangle,title:'Report an emergency',text:'Share the incident type, location and details so the request can be reviewed.'},
 {icon:FiUsers,title:'Coordinate volunteers',text:'Collect volunteer skills and availability, then organize task assignments.'},
 {icon:FiTrendingUp,title:'Track progress',text:'Keep a clear status for reports, assignments and relief coordination.'}
];
const HELPLINES=[
 {number:'112',label:'All-in-one emergency',note:'Police, fire and medical help through one number',icon:MdPhoneInTalk,primary:true},
 {number:'101',label:'Fire services',note:'Fire and rescue',icon:MdLocalFireDepartment},
 {number:'108',label:'Ambulance',note:'Emergency medical services in most states',icon:MdLocalHospital},
 {number:'1098',label:'Child helpline',note:'For children who need care or protection',icon:MdChildCare},
 {number:'1090',label:'UP Women Power Line',note:'Uttar Pradesh only',icon:MdWoman},
 {number:'1077',label:'Disaster management',note:'District control room; availability varies by district',icon:MdFlood},
 {number:'100',label:'Police (legacy number)',note:'Calls are routed to 112 in many states',icon:MdLocalPolice},
 {number:'181',label:'Women helpline',note:'For women in distress; availability varies by state',icon:MdSupportAgent}
];
export function Home(){
 return <>
  <section className="hero">
   <HeroVideo/>
   <div className="hero-copy">
    <span className="kicker">TOGETHER, WE RESPOND STRONGER</span>
    <h1>In times of crisis, we connect for a <em>safer tomorrow.</em></h1>
    <p>RESQ~CONNECT brings people, volunteers and relief coordinators together to organize emergency reports, coordinate help and keep communities informed.</p>
    <div className="actions">
     <Link className="btn large" to="/register">Get Started <FiArrowRight aria-hidden="true"/></Link>
     <Link className="btn outline large" to="/dashboard/incidents"><FiAlertTriangle aria-hidden="true"/> Report an Emergency</Link>
    </div>
    <div className="hero-points"><span><FiCheckCircle aria-hidden="true"/> Transparent tracking</span><span><FiCheckCircle aria-hidden="true"/> Community-first</span></div>
   </div>
  </section>
  <aside className="emergency-strip" aria-label="Emergency notice">
   <div className="emergency-strip-inner">
    <span className="emergency-strip-icon" aria-hidden="true"><FiAlertTriangle/></span>
    <p>In an immediate emergency, call <strong>112</strong>.</p>
    <a className="emergency-call" href="tel:112"><FiPhone aria-hidden="true"/> Call now</a>
   </div>
  </aside>
  <section className="home-facts" aria-label="RESQ~CONNECT at a glance">
   <ul className="facts-grid">
    {HOME_FACTS.map(({icon:Icon,value,label})=><li key={label} className="fact-card">
     <span className="fact-icon" aria-hidden="true"><Icon/></span>
     <span className="fact-text"><strong>{value}</strong><span>{label}</span></span>
    </li>)}
   </ul>
  </section>
  <section className="section home-helps" aria-labelledby="helps-title">
   <div className="section-head">
    <span className="kicker">OUR PLATFORM</span>
    <h2 id="helps-title">How RESQ~CONNECT helps</h2>
    <p>Designed to make community response more organized.</p>
   </div>
   <div className="helps-grid">
    {HOW_IT_HELPS.map(({icon:Icon,title,text},index)=><article className="help-card" key={title}>
     <div className="help-card-top"><span className="help-icon" aria-hidden="true"><Icon/></span><span className="help-step" aria-hidden="true">0{index+1}</span></div>
     <h3>{title}</h3>
     <p>{text}</p>
    </article>)}
   </div>
   <p className="helps-support"><FiLifeBuoy aria-hidden="true"/> Need help with your account? <Link to="/support">Visit the Support Center <FiArrowRight aria-hidden="true"/></Link></p>
  </section>
  <section id="helplines" className="section helplines" aria-labelledby="helplines-title" tabIndex={-1}>
   <div className="helplines-head">
    <span className="helplines-label"><FiPhoneCall aria-hidden="true"/> Help is a call away</span>
    <h2 id="helplines-title">Emergency helplines</h2>
    <p>Keep these important numbers within reach.</p>
   </div>
   <ul className="helpline-grid">
    {HELPLINES.map(({number,label,note,icon:Icon,primary})=><li key={number}>
     <a className={primary?'helpline-card primary':'helpline-card'} href={`tel:${number}`} aria-label={`Call ${number}, ${label}. ${note}.`}>
      <span className="helpline-icon" aria-hidden="true"><Icon/></span>
      <span className="helpline-number">{number}</span>
      <span className="helpline-label">{label}</span>
      <span className="helpline-note">{note}</span>
      <span className="helpline-call" aria-hidden="true"><FiPhone/> Tap to call</span>
     </a>
    </li>)}
   </ul>
   <p className="helplines-footnote">Helpline coverage can differ between states and districts. If you are unsure which number to use, call 112.</p>
  </section>
  <section className="section home-cta" aria-labelledby="cta-title">
   <div className="section-head">
    <h2 id="cta-title">Ready to make a difference?</h2>
    <p>Sign in to access the community workspace.</p>
   </div>
   <div className="cta-card">
    <div className="cta-card-copy">
     <span className="kicker">BE PART OF THE RESPONSE</span>
     <h3>Every report matters.</h3>
     <p>Start with a report, or join the community as a volunteer.</p>
    </div>
    <div className="cta-card-actions">
     <Link className="btn light large" to="/login">Continue as a user <FiArrowRight aria-hidden="true"/></Link>
     <Link className="btn ghost-light large" to="/register">Join RESQ~CONNECT</Link>
    </div>
   </div>
  </section>
 </>;
}
const CONTACT_LIMITS={name:120,email:255,subject:180,message:5000};
const EMPTY_CONTACT={name:'',email:'',phone_country:DEFAULT_PHONE_COUNTRY,phone:'',subject:'',message:''};
const CONTACT_POINTS=[
 {icon:FiInbox,title:'Reaches the coordination team',text:'Your message goes straight to the coordinators’ inbox in the RESQ~CONNECT admin portal.'},
 {icon:FiPhone,title:'Phone number with country code',text:'Choose your country code so your number is saved in the correct international format.'},
 {icon:FiLifeBuoy,title:'Already have an account?',text:'Registered users can open a support ticket and follow the reply from their dashboard.',link:['/support','Go to the Support Center']}
];
function validateContact(values){
 const errors={};
 if(!values.name.trim())errors.name='Enter your name.';
 if(!values.email.trim())errors.email='Enter your email address.';
 else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))errors.email='Enter a valid email address, for example name@example.com.';
 const phone=validatePhone(values.phone_country,values.phone);
 if(phone.error)errors.phone=phone.error;
 if(!values.subject.trim())errors.subject='Enter a subject.';
 if(!values.message.trim())errors.message='Enter your message.';
 return errors;
}
function ContactField({id,label,error,hint,className='',children}){
 return <div className={`contact-field ${className}`}>
  <label htmlFor={id}>{label}</label>
  {children}
  {hint&&!error&&<span id={`${id}-hint`} className="field-hint">{hint}</span>}
  {error&&<span id={`${id}-error`} className="field-error">{error}</span>}
 </div>;
}
export function Contact(){
 const [values,setValues]=useState(EMPTY_CONTACT);
 const [errors,setErrors]=useState({});
 const [message,setMessage]=useState('');
 const [failed,setFailed]=useState(false);
 const [busy,setBusy]=useState(false);
 const other=values.phone_country===OTHER_PHONE_COUNTRY;
 const selected=findPhoneCountry(values.phone_country);
 const update=event=>{
  const {name,value}=event.target;
  setValues(current=>({...current,[name]:value}));
  const key=name==='phone_country'?'phone':name;
  if(errors[key])setErrors(current=>({...current,[key]:undefined}));
 };
 const describe=(id,hasHint)=>[hasHint?`${id}-hint`:'',errors[id.replace('contact-','')]?`${id}-error`:''].filter(Boolean).join(' ')||undefined;
 async function submit(e){
  e.preventDefault();
  if(busy)return;
  const found=validateContact(values);
  setErrors(found);
  setMessage('');
  if(Object.keys(found).length){document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();return}
  setBusy(true);
  try{
   await api('/contact',{method:'POST',body:{name:values.name.trim(),email:values.email.trim(),phone_country:values.phone_country,phone:values.phone.trim(),subject:values.subject.trim(),message:values.message.trim()}});
   setValues(current=>({...EMPTY_CONTACT,phone_country:current.phone_country}));
   setFailed(false);setMessage('Message sent successfully.');
  }catch(err){
   const fieldErrors={};
   for(const detail of err.details||[])if(detail.field&&!fieldErrors[detail.field])fieldErrors[detail.field]=detail.message;
   if(Object.keys(fieldErrors).length){setErrors(fieldErrors);setFailed(true);setMessage('Please correct the highlighted fields.')}
   else{setFailed(true);setMessage(err.message)}
  }finally{setBusy(false)}
 }
 return <div className="info-page contact-page">
  <div className="info-layout">
   <div className="info-intro">
    <span className="info-label"><span className="info-label-icon" aria-hidden="true"><FiMessageSquare/></span>CONTACT US</span>
    <h1>We are here to listen.</h1>
    <p className="info-lead">Share feedback or questions about the platform.</p>
    <ul className="info-points">
     {CONTACT_POINTS.map(({icon:Icon,title,text,link})=><li key={title}>
      <span className="info-point-icon" aria-hidden="true"><Icon/></span>
      <span><strong>{title}</strong><span>{text}</span>{link&&<Link className="info-point-link" to={link[0]}>{link[1]} <FiArrowRight aria-hidden="true"/></Link>}</span>
     </li>)}
    </ul>
    <p className="info-emergency"><FiAlertTriangle aria-hidden="true"/><span>This form is not an emergency line. In an immediate emergency, call <a href="tel:112">112</a>.</span></p>
   </div>
   <div className="form-card">
    <div className="form-card-head">
     <span className="form-card-icon" aria-hidden="true"><FiMail/></span>
     <div><h2>Send a message</h2><p>All fields are required.</p></div>
    </div>
    <form onSubmit={submit} className="contact-form" noValidate>
     <ContactField id="contact-name" label="Your name" error={errors.name}><input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={CONTACT_LIMITS.name} value={values.name} onChange={update} aria-invalid={errors.name?'true':'false'} aria-describedby={describe('contact-name',false)}/></ContactField>
     <ContactField id="contact-email" label="Email address" error={errors.email}><input id="contact-email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={CONTACT_LIMITS.email} value={values.email} onChange={update} aria-invalid={errors.email?'true':'false'} aria-describedby={describe('contact-email',false)}/></ContactField>
     <ContactField id="contact-phone" label="Phone number" className="span2" error={errors.phone} hint={other?'Include + and your country code, for example +4915123456789.':`${selected?.name||''} number without the country code.`}>
      <div className="phone-group">
       <select id="contact-phone_country" name="phone_country" aria-label="Country code" autoComplete="tel-country-code" value={values.phone_country} onChange={update}>
        {PHONE_COUNTRIES.map(country=><option key={country.code} value={country.code}>{country.name} ({country.dial})</option>)}
        <option value={OTHER_PHONE_COUNTRY}>Other country</option>
       </select>
       <input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete={other?'tel':'tel-national'} required maxLength={24} placeholder={other?'+4915123456789':values.phone_country==='IN'?'98765 43210':''} value={values.phone} onChange={update} aria-invalid={errors.phone?'true':'false'} aria-describedby={describe('contact-phone',true)}/>
      </div>
     </ContactField>
     <ContactField id="contact-subject" label="Subject" className="span2" error={errors.subject}><input id="contact-subject" name="subject" type="text" required maxLength={CONTACT_LIMITS.subject} value={values.subject} onChange={update} aria-invalid={errors.subject?'true':'false'} aria-describedby={describe('contact-subject',false)}/></ContactField>
     <ContactField id="contact-message" label="Message" className="span2" error={errors.message}><textarea id="contact-message" name="message" required maxLength={CONTACT_LIMITS.message} value={values.message} onChange={update} aria-invalid={errors.message?'true':'false'} aria-describedby={describe('contact-message',false)}/></ContactField>
     <button className="btn contact-submit" disabled={busy}>{busy?'Sending...':<>Send Message <FiSend aria-hidden="true"/></>}</button>
    </form>
    <p className={failed&&message?'error':'feedback'} role="status">{message}</p>
   </div>
  </div>
 </div>;
}
