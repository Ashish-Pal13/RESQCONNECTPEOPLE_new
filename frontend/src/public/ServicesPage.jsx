import React from 'react';
import {Link} from 'react-router-dom';
import {FiActivity,FiArrowDown,FiArrowRight,FiBarChart2,FiCheckSquare,FiClipboard,FiEdit3,FiFileText,FiHeadphones,FiHeart,FiInfo,FiLink,FiLogIn,FiPhone,FiPhoneCall,FiSearch,FiShield,FiUserCheck,FiUsers} from 'react-icons/fi';
import {MdFlood,MdLandslide,MdLocalFireDepartment,MdOutlineEmergency,MdThunderstorm} from 'react-icons/md';
import {WiEarthquake} from 'react-icons/wi';
import '../styles/services-page.css';
const IMAGE_DIR='/images/services';
const REPORT_PATH='/dashboard/incidents';
const VOLUNTEER_PATH='/dashboard/volunteer';
const OFFERS=[
 {icon:FiFileText,title:'Emergency Reporting',text:'Submit incident details, location information, and relevant descriptions through the platform.'},
 {icon:FiUsers,title:'Incident Coordination',text:'Authorized coordinators can review reports and organize response-related activities.'},
 {icon:FiUserCheck,title:'Volunteer Assignments',text:"Eligible volunteers can be considered for assignments based on the platform's verification and coordination processes."},
 {icon:FiActivity,title:'Progress Tracking',text:'View relevant updates on reports, assignments, and coordination activities.'},
 {icon:FiPhone,title:'Emergency Helplines',text:'Find important emergency contact numbers and access click-to-call links.',link:{to:'/#helplines',label:'View helplines'}},
 {icon:FiHeadphones,title:'Support Assistance',text:'Get help with platform-related questions through the existing Support Center.',link:{to:'/support',label:'Visit Support Center'}}
];
const COORDINATION=[
 {icon:FiClipboard,title:'Structured Incident Reports',text:'Keep important incident details organized.'},
 {icon:FiShield,title:'Coordinator Workspace',text:'Support authorized review and assignment management.'},
 {icon:FiUsers,title:'Volunteer Participation',text:'Help eligible volunteers access relevant tasks and updates.'}
];
const STEPS=[
 {icon:FiLogIn,title:'Sign In or Register',text:'Create your account to access the emergency reporting features.'},
 {icon:FiEdit3,title:'Submit a Report',text:'Share accurate incident details and location information.'},
 {icon:FiSearch,title:'Review & Coordinate',text:'Authorized coordinators review reports and manage the appropriate workflow.'},
 {icon:FiBarChart2,title:'Track Progress',text:'Check relevant status updates through your dashboard.'}
];
const INCIDENT_TYPES=[
 {type:'Flood',icon:MdFlood,title:'Floods',text:'Report flooding, rising water levels, and affected locations.'},
 {type:'Fire',icon:MdLocalFireDepartment,title:'Fire Incidents',text:'Share information about fire-related emergencies.'},
 {type:'Earthquake',icon:WiEarthquake,title:'Earthquakes',text:'Report earthquake damage and the areas affected.'},
 {type:'Landslide',icon:MdLandslide,title:'Landslides',text:'Share landslide locations, blocked routes, and visible damage.'},
 {type:'Storm',icon:MdThunderstorm,title:'Storms',text:'Report storm damage, fallen trees, and disrupted areas.'},
 {type:'Other',icon:MdOutlineEmergency,title:'Other Emergencies',text:'Report other supported incident types with clear descriptions.'}
];
const ROLES=[
 {icon:FiUsers,title:'People',text:'Share important incident information through the platform.'},
 {icon:FiHeart,title:'Volunteers',text:'Participate through profiles, verification, and eligible assignments.'},
 {icon:FiCheckSquare,title:'Coordinators',text:'Review reports, manage assignments, and follow progress.'}
];
const PREPAREDNESS=[
 {icon:FiInfo,title:'Stay Informed',text:'Access important emergency information and available updates.'},
 {icon:FiLink,title:'Stay Connected',text:'Use the platform to communicate through supported reporting and coordination workflows.'},
 {icon:FiShield,title:'Act Responsibly',text:'Follow official emergency guidance and participate only in activities appropriate to your role and training.'}
];
const reportPath=type=>`${REPORT_PATH}?type=${encodeURIComponent(type)}`;
function Eyebrow({children,light=false}){return <span className={light?'sv-eyebrow sv-eyebrow-light':'sv-eyebrow'}>{children}</span>}
export default function ServicesPage(){
 return <div className="sv-page">
  <section className="sv-hero" aria-labelledby="sv-hero-title">
   <div className="sv-ambient" aria-hidden="true"><img src={`${IMAGE_DIR}/01_services_hero.png`} alt="" width="1536" height="220" decoding="async"/></div>
   <div className="sv-hero-shade" aria-hidden="true"></div>
   <div className="sv-container sv-hero-content">
    <Eyebrow light>EMERGENCY SERVICES</Eyebrow>
    <h1 id="sv-hero-title"><span className="sv-line">Faster Response.</span><span className="sv-line sv-hero-accent">Safer Communities.</span></h1>
    <p>RESQ~CONNECT helps people report emergencies, connect with eligible volunteers, and coordinate response activities through a single organized platform.</p>
    <div className="sv-actions">
     <Link className="sv-btn sv-btn-light" to={REPORT_PATH}>Report an Emergency <FiArrowRight aria-hidden="true"/></Link>
     <Link className="sv-btn sv-btn-outline" to={{hash:'#what-we-offer'}}>Explore Our Services <FiArrowDown aria-hidden="true"/></Link>
    </div>
   </div>
   <div className="sv-band sv-hero-band">
    <img src={`${IMAGE_DIR}/01_services_hero.png`} alt="Rescue workers in orange uniforms and helmets looking over a misty mountain valley while a rescue helicopter flies overhead" width="1536" height="220" decoding="async" fetchpriority="high"/>
   </div>
  </section>

  <section id="what-we-offer" className="sv-section sv-offer" aria-labelledby="sv-offer-title" tabIndex={-1}>
   <div className="sv-container">
    <div className="sv-offer-head">
     <div>
      <Eyebrow>WHAT WE OFFER</Eyebrow>
      <h2 id="sv-offer-title">Comprehensive Emergency Support</h2>
      <p>A connected platform for reporting incidents, coordinating volunteers, and tracking important activities.</p>
     </div>
     <Link className="sv-text-link" to={{hash:'#how-it-works'}}>Explore Services <FiArrowDown aria-hidden="true"/></Link>
    </div>
    <ul className="sv-offer-grid">
     {OFFERS.map(({icon:Icon,title,text,link})=><li key={title} className="sv-card sv-offer-card">
      <span className="sv-icon sv-icon-lg" aria-hidden="true"><Icon/></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {link&&<Link className="sv-card-link" to={link.to}>{link.label} <FiArrowRight aria-hidden="true"/></Link>}
     </li>)}
    </ul>
   </div>
  </section>

  <section className="sv-section sv-coordination" aria-labelledby="sv-coordination-title">
   <div className="sv-container sv-split">
    <div className="sv-media-col">
     <figure className="sv-photo sv-photo-rescue">
      <img src={`${IMAGE_DIR}/02_rescue_team.png`} alt="A rescue team in orange gear and helmets walking down a rocky mountain trail above a river valley at sunset" width="1536" height="202" loading="lazy" decoding="async"/>
     </figure>
     <ul className="sv-rows">
      {COORDINATION.map(({icon:Icon,title,text})=><li key={title}>
       <span className="sv-icon" aria-hidden="true"><Icon/></span>
       <span><strong>{title}</strong><span>{text}</span></span>
      </li>)}
     </ul>
    </div>
    <div className="sv-text-col">
     <Eyebrow>ORGANIZED COORDINATION</Eyebrow>
     <h2 id="sv-coordination-title">Better information. Better coordination.</h2>
     <p>Emergency situations require clear communication and organized information. RESQ~CONNECT provides a digital workspace where incident details can be reviewed, volunteer participation can be coordinated, and progress can be tracked by authorized users.</p>
    </div>
   </div>
  </section>

  <section id="how-it-works" className="sv-section sv-how" aria-labelledby="sv-how-title" tabIndex={-1}>
   <div className="sv-container">
    <figure className="sv-band sv-framed-band">
     <img src={`${IMAGE_DIR}/04_reporting_workflow.png`} alt="A laptop showing a map with location pins, linked by a glowing path through report, team, verification and progress icons to an ambulance on a mountain road" width="1536" height="153" loading="lazy" decoding="async"/>
    </figure>
    <div className="sv-intro">
     <Eyebrow>HOW IT WORKS</Eyebrow>
     <h2 id="sv-how-title">From Report to Real Action</h2>
     <p>A simple and structured process to help communities communicate and coordinate more effectively.</p>
    </div>
    <ol className="sv-steps">
     {STEPS.map(({icon:Icon,title,text},index)=><li key={title} className="sv-card sv-step">
      <div className="sv-step-top">
       <span className="sv-step-number" aria-hidden="true">{index+1}</span>
       <span className="sv-icon" aria-hidden="true"><Icon/></span>
      </div>
      <h3><span className="sr-only">Step {index+1}: </span>{title}</h3>
      <p>{text}</p>
     </li>)}
    </ol>
   </div>
  </section>

  <section className="sv-section sv-types" aria-labelledby="sv-types-title">
   <div className="sv-container sv-types-layout">
    <div className="sv-types-intro">
     <Eyebrow>TYPES OF EMERGENCIES</Eyebrow>
     <h2 id="sv-types-title">Supporting Different Emergency Situations</h2>
     <p>RESQ~CONNECT helps users organize incident information across different emergency categories supported by the platform.</p>
     <div className="sv-types-note">
      <FiInfo aria-hidden="true"/>
      <span>These are the report types the platform currently supports. For road accidents, medical emergencies, missing persons or any immediate danger, call <a href="tel:112">112</a> first; you can describe other situations using <strong>Other</strong>.</span>
     </div>
    </div>
    <ul className="sv-type-grid">
     {INCIDENT_TYPES.map(({type,icon:Icon,title,text})=><li key={type}>
      <Link className="sv-card sv-type-card" to={reportPath(type)} aria-label={`${title}: ${text} Start a ${type} report.`}>
       <span className="sv-icon" aria-hidden="true"><Icon/></span>
       <span className="sv-type-text"><strong>{title}</strong><span>{text}</span><span className="sv-type-action">Start a report <FiArrowRight aria-hidden="true"/></span></span>
      </Link>
     </li>)}
    </ul>
   </div>
  </section>

  <section className="sv-collab" aria-labelledby="sv-collab-title">
   <figure className="sv-band sv-collab-band">
    <img src={`${IMAGE_DIR}/03_teamwork.png`} alt="Volunteers in green shirts stacking their hands together in a circle" width="1536" height="127" loading="lazy" decoding="async"/>
   </figure>
   <div className="sv-container sv-collab-content">
    <div className="sv-intro">
     <Eyebrow>WORKING TOGETHER</Eyebrow>
     <h2 id="sv-collab-title">Stronger communities start with cooperation.</h2>
     <p>Community participation, responsible communication, and organized coordination can help people work together more effectively during challenging situations.</p>
    </div>
    <ul className="sv-role-grid">
     {ROLES.map(({icon:Icon,title,text})=><li key={title} className="sv-card sv-role-card">
      <span className="sv-icon sv-icon-lg" aria-hidden="true"><Icon/></span>
      <h3>{title}</h3>
      <p>{text}</p>
     </li>)}
    </ul>
   </div>
  </section>

  <section className="sv-section sv-prepared" aria-labelledby="sv-prepared-title">
   <div className="sv-container sv-split sv-split-reverse">
    <div className="sv-text-col">
     <Eyebrow>COMMUNITY PREPAREDNESS</Eyebrow>
     <h2 id="sv-prepared-title">Prepared communities begin with clear information.</h2>
     <p>Accurate reporting, accessible emergency contacts, and responsible volunteer coordination can help communities stay better informed and organized. RESQ~CONNECT is designed to support these activities through a connected digital platform.</p>
    </div>
    <div className="sv-media-col">
     <figure className="sv-photo sv-photo-seedling">
      <img src={`${IMAGE_DIR}/05_community_impact.png`} alt="A young seedling growing from rich soil on a hillside above a river valley at sunrise" width="1536" height="126" loading="lazy" decoding="async"/>
     </figure>
     <ul className="sv-rows sv-rows-white">
      {PREPAREDNESS.map(({icon:Icon,title,text})=><li key={title}>
       <span className="sv-icon" aria-hidden="true"><Icon/></span>
       <span><strong>{title}</strong><span>{text}</span></span>
      </li>)}
     </ul>
    </div>
   </div>
  </section>

  <section className="sv-notice-section" aria-labelledby="sv-notice-title">
   <div className="sv-container">
    <div className="sv-notice" role="note">
     <span className="sv-notice-icon" aria-hidden="true"><FiPhoneCall/></span>
     <div className="sv-notice-text">
      <span className="sv-notice-label">IMPORTANT</span>
      <h2 id="sv-notice-title">For immediate emergency assistance in India, call <span className="sv-notice-number">112</span>.</h2>
      <p>RESQ~CONNECT is a community coordination platform and does not replace official emergency services.</p>
     </div>
     <a className="sv-call-btn" href="tel:112"><FiPhone aria-hidden="true"/> Call 112</a>
    </div>
   </div>
  </section>

  <section className="sv-cta" aria-labelledby="sv-cta-title">
   <div className="sv-ambient" aria-hidden="true"><img src={`${IMAGE_DIR}/06_final_cta.png`} alt="" width="1536" height="176" loading="lazy" decoding="async"/></div>
   <div className="sv-cta-shade" aria-hidden="true"></div>
   <div className="sv-band sv-cta-band">
    <img src={`${IMAGE_DIR}/06_final_cta.png`} alt="Volunteers in green shirts and rescue workers in orange sitting together on a ridge at sunrise, next to a rescue helicopter on a mountain helipad" width="1536" height="176" loading="lazy" decoding="async"/>
   </div>
   <div className="sv-container sv-cta-content">
    <div className="sv-cta-copy">
     <Eyebrow light>BE PART OF A SAFER TOMORROW</Eyebrow>
     <h2 id="sv-cta-title">Report. Support. Make a Difference.</h2>
     <p>Whether you need help, want to volunteer, or simply want to stay informed, RESQ~CONNECT brings people together through organized community coordination.</p>
    </div>
    <div className="sv-actions sv-cta-actions">
     <Link className="sv-btn sv-btn-light" to={REPORT_PATH}>Report an Emergency <FiArrowRight aria-hidden="true"/></Link>
     <Link className="sv-btn sv-btn-outline" to={VOLUNTEER_PATH}>Join as a Volunteer <FiArrowRight aria-hidden="true"/></Link>
    </div>
   </div>
  </section>
 </div>;
}
