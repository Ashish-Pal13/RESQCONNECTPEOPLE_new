import React from 'react';
import {Link} from 'react-router-dom';
import {FiArrowRight,FiChevronRight,FiPhone,FiPhoneCall} from 'react-icons/fi';
import BrandLogo from '../lib/BrandLogo';
import '../styles/site-footer.css';
const FOOTER_COLUMNS=[
 {id:'quick',title:'Quick Links',links:[
  {to:'/',label:'Home'},
  {to:'/about',label:'About Us'},
  {to:'/services',label:'Emergency Services'},
  {to:'/contact',label:'Contact Us'},
  {to:'/support',label:'Support Center'}
 ]},
 {id:'involved',title:'Get Involved',links:[
  {to:'/dashboard/incidents',label:'Report an Emergency'},
  {to:'/dashboard/volunteer',label:'Become a Volunteer'},
  {to:'/register',label:'Register as a User'},
  {to:'/#helplines',label:'Emergency Helplines'}
 ]},
 {id:'help',title:'Help & Support',links:[
  {to:'/support',label:'Support Center'},
  {to:'/contact',label:'Contact Us'},
  {to:'/dashboard/tickets',label:'My Support Tickets'}
 ]}
];
export default function SiteFooter(){
 const year=new Date().getFullYear();
 return <footer className="footer site-footer">
  <div className="sf-banner" aria-hidden="true">
   <img src="/images/footer/footer-landscape.webp" alt="" width="2172" height="724" loading="lazy" decoding="async"/>
  </div>
  <div className="sf-main">
   <div className="sf-container sf-grid">
    <div className="sf-brand">
     <Link className="sf-logo" to="/" aria-label="RESQ~CONNECT home"><BrandLogo/></Link>
     <p className="sf-tagline">People • Response • Safer Communities</p>
     <p className="sf-description">Connecting people, volunteers, and coordinators through organized community response for safer and stronger communities.</p>
    </div>
    {FOOTER_COLUMNS.map(column=><nav key={column.id} className={`sf-column sf-column-${column.id}`} aria-labelledby={`sf-heading-${column.id}`}>
     <h2 id={`sf-heading-${column.id}`} className="sf-heading">{column.title}</h2>
     <ul className="sf-links">
      {column.links.map(link=><li key={link.label}>
       <Link to={link.to}><FiChevronRight aria-hidden="true"/><span>{link.label}</span></Link>
      </li>)}
     </ul>
    </nav>)}
    <section className="sf-emergency" aria-labelledby="sf-emergency-title">
     <div className="sf-emergency-top">
      <span className="sf-emergency-icon" aria-hidden="true"><FiPhoneCall/></span>
      <div>
       <h2 id="sf-emergency-title" className="sf-emergency-label">Emergency Helpline</h2>
       <a className="sf-emergency-number" href="tel:112" aria-label="Call 112, emergency helpline">112</a>
      </div>
     </div>
     <p className="sf-emergency-text">For immediate emergency assistance in India, call 112.</p>
     <a className="sf-call-btn" href="tel:112"><FiPhone aria-hidden="true"/> Call 112 <FiArrowRight aria-hidden="true"/></a>
     <p className="sf-disclaimer">RESQ~CONNECT is a community coordination platform and does not replace official emergency services.</p>
    </section>
   </div>
  </div>
  <div className="sf-bottom">
   <div className="sf-container sf-bottom-inner">
    <p>© {year} RESQ~CONNECT. All rights reserved.</p>
    <p className="sf-attribution">Academic demonstration. Not an official emergency dispatch service. For immediate danger, contact local emergency services.</p>
   </div>
  </div>
 </footer>;
}
