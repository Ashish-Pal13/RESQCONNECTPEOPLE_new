import React from 'react';
import {Link} from 'react-router-dom';
import {FiArrowRight,FiChevronRight,FiClock,FiFileText,FiHeadphones,FiMessageSquare,FiSettings,FiShield,FiUser,FiUsers} from 'react-icons/fi';
import {MdOutlineConfirmationNumber} from 'react-icons/md';
import {useAuth} from '../context/Auth';
import {homeFor,isStaff} from '../lib/roles';
import '../styles/support-page.css';
export const SUPPORT_HERO_IMAGE='/images/support-hero.png';
const TICKETS_PATH='/dashboard/tickets';
const FEATURES=[
 {icon:FiMessageSquare,title:'Get Support',text:'Open a support ticket for any platform-related issue or question.'},
 {icon:FiClock,title:'Admin Response',text:'Our team will review your ticket and respond directly in your dashboard.'},
 {icon:FiFileText,title:'Track Progress',text:'Check the status of your tickets anytime from your dashboard.'},
 {icon:FiShield,title:'Safe & Secure',text:'Your support requests are accessible through your authenticated account.'}
];
const STEPS=[
 {title:'Create a Ticket',text:'Describe your issue or question in detail.'},
 {title:'Get a Response',text:'Our admin team will review and respond to your ticket.'},
 {title:'Track & Follow Up',text:'Check your ticket status and view the admin response directly in your dashboard.'}
];
const TOPICS=[
 {icon:FiUser,title:'Account & Login',text:'Login issues, registration, profile',category:'Account'},
 {icon:FiFileText,title:'Reporting Issues',text:'Emergency report problems',category:'Emergency Report'},
 {icon:FiUsers,title:'Volunteer Support',text:'Volunteer account and tasks',category:'Volunteer'},
 {icon:FiSettings,title:'Technical Support',text:'General platform support',category:'Technical Issue'}
];
const ticketPath=category=>`${TICKETS_PATH}?category=${encodeURIComponent(category)}`;
function SectionHeading({id,children}){
 return <div className="sc-section-heading"><span className="sc-rule" aria-hidden="true"></span><h2 id={id}>{children}</h2><span className="sc-rule" aria-hidden="true"></span></div>;
}
function DashboardAction(){
 const {user}=useAuth();
 const staff=Boolean(user&&isStaff(user));
 const to=staff?homeFor(user):TICKETS_PATH;
 return <div className="sc-cta-action">
  <Link className="sc-cta-button" to={to}>{staff?'Go to Admin Portal':'Open My Support Tickets'} <FiArrowRight aria-hidden="true"/></Link>
  <p className="sc-cta-note">{staff?'You are signed in as staff. Tickets are managed in the admin portal.':user?<>Signed in as <strong>{user.name}</strong>.</>:'You will be asked to sign in first.'}</p>
 </div>;
}
export default function SupportPage(){
 return <div className="sc-page">
  <section className="sc-hero" aria-labelledby="sc-title">
   <img className="sc-hero-image" src={SUPPORT_HERO_IMAGE} alt="" width="2172" height="724" decoding="async" fetchpriority="high"/>
   <div className="sc-hero-shade" aria-hidden="true"></div>
   <div className="sc-hero-inner">
    <div className="sc-hero-copy">
     <span className="sc-pill"><FiHeadphones aria-hidden="true"/>SUPPORT CENTER</span>
     <h1 id="sc-title"><span className="sc-title-line">Need help with</span> <span className="sc-title-line sc-title-accent">RESQ~CONNECT?</span></h1>
     <p>Registered users can open a support ticket and receive an admin response directly in their dashboard.</p>
    </div>
   </div>
  </section>
  <section className="sc-features" aria-label="What the Support Center offers">
   <ul className="sc-container sc-feature-grid">
    {FEATURES.map(({icon:Icon,title,text})=><li key={title} className="sc-card sc-feature">
     <span className="sc-icon" aria-hidden="true"><Icon/></span>
     <h3>{title}</h3>
     <p>{text}</p>
    </li>)}
   </ul>
  </section>
  <section className="sc-container sc-section" aria-labelledby="sc-cta-title">
   <div className="sc-cta">
    <div className="sc-cta-main">
     <span className="sc-cta-icon" aria-hidden="true"><MdOutlineConfirmationNumber/></span>
     <div>
      <span className="sc-cta-label">REGISTERED USERS ONLY</span>
      <h2 id="sc-cta-title">Open a Support Ticket</h2>
      <p>Go to your dashboard and create a new support ticket. Our admin team will assist you.</p>
     </div>
    </div>
    <DashboardAction/>
   </div>
  </section>
  <section className="sc-container sc-section" aria-labelledby="sc-how-title">
   <SectionHeading id="sc-how-title">How It Works</SectionHeading>
   <ol className="sc-step-grid">
    {STEPS.map(({title,text},index)=><li key={title} className="sc-card sc-step">
     <span className="sc-step-number" aria-hidden="true">{index+1}</span>
     <div className="sc-step-text">
      <h3><span className="sr-only">Step {index+1}: </span>{title}</h3>
      <p>{text}</p>
     </div>
    </li>)}
   </ol>
  </section>
  <section className="sc-container sc-section sc-topics" aria-labelledby="sc-topics-title">
   <SectionHeading id="sc-topics-title">Common Topics</SectionHeading>
   <p className="sc-section-intro">Choose a topic to start a new support ticket with that category already selected.</p>
   <ul className="sc-topic-grid">
    {TOPICS.map(({icon:Icon,title,text,category})=><li key={title}>
     <Link className="sc-card sc-topic" to={ticketPath(category)} aria-label={`${title}: ${text}. Open a support ticket about this topic.`}>
      <span className="sc-icon" aria-hidden="true"><Icon/></span>
      <span className="sc-topic-text"><strong>{title}</strong><span>{text}</span></span>
      <FiChevronRight className="sc-topic-arrow" aria-hidden="true"/>
     </Link>
    </li>)}
   </ul>
  </section>
 </div>;
}
