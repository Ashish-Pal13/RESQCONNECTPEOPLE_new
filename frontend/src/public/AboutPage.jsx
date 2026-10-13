import React from 'react';
import {Link} from 'react-router-dom';
import {FiArrowRight,FiBarChart2,FiCheckCircle,FiClipboard,FiFileText,FiHeart,FiMapPin,FiMessageCircle,FiSearch,FiShield,FiUserPlus,FiUsers,FiUserCheck} from 'react-icons/fi';
import '../styles/about-page.css';
const IMAGE_DIR='/images/about';
const MISSION_POINTS=[
 {icon:FiClipboard,title:'Organized Reporting',text:'Help users submit and track emergency information.'},
 {icon:FiUsers,title:'Connected Volunteers',text:'Support volunteer profiles, verification, and assignments.'},
 {icon:FiCheckCircle,title:'Clear Coordination',text:'Keep important response activities easier to manage.'}
];
const VALUES=[
 {icon:FiHeart,title:'Community First',text:'We believe meaningful support begins with people working together and looking out for one another.'},
 {icon:FiMessageCircle,title:'Clear Communication',text:'We value accurate information, understandable updates, and communication that helps people stay informed.'},
 {icon:FiShield,title:'Responsible Coordination',text:'We support structured participation, defined responsibilities, and organized response workflows.'},
 {icon:FiFileText,title:'Transparency',text:'We aim to make report progress, volunteer activities, and coordination status easier to follow.'}
];
const STEPS=[
 {icon:FiMapPin,label:'Report',title:'Report an Emergency',text:'A registered user submits incident details and location information through the platform.'},
 {icon:FiSearch,label:'Review',title:'Coordinator Review',text:'An authorized coordinator reviews available incident information and manages the response workflow.'},
 {icon:FiUserCheck,label:'Assign',title:'Volunteer Coordination',text:"Eligible volunteers can be considered for appropriate assignments according to the platform's verification and assignment processes."},
 {icon:FiBarChart2,label:'Track',title:'Track Progress',text:'Users and authorized coordinators can view relevant status updates through their respective dashboards.'}
];
const IMPACT=[
 {icon:FiUsers,title:'People',text:'A shared space for reporting concerns and accessing information.'},
 {icon:FiHeart,title:'Volunteers',text:'Structured participation based on profiles and availability.'},
 {icon:FiClipboard,title:'Coordinators',text:'Tools to review reports, manage assignments, and follow progress.'}
];
function Eyebrow({children,light=false}){return <span className={light?'ab-eyebrow ab-eyebrow-light':'ab-eyebrow'}>{children}</span>}
function Photo({src,alt,width,height,className=''}){
 return <figure className={`ab-photo ${className}`}><img src={`${IMAGE_DIR}/${src}`} alt={alt} width={width} height={height} loading="lazy" decoding="async"/></figure>;
}
export default function AboutPage(){
 return <div className="ab-page">
  <section className="ab-hero" aria-labelledby="ab-hero-title">
   <div className="ab-ambient" aria-hidden="true"><img src={`${IMAGE_DIR}/01_about_hero.png`} alt="" width="1536" height="237" decoding="async"/></div>
   <div className="ab-hero-shade" aria-hidden="true"></div>
   <div className="ab-container ab-hero-content">
    <Eyebrow light>ABOUT RESQ~CONNECT</Eyebrow>
    <h1 id="ab-hero-title"><span className="ab-line">Connecting People.</span><span className="ab-line ab-hero-accent">Strengthening Communities.</span></h1>
    <p>RESQ~CONNECT brings people, volunteers, and relief coordinators together to support organized emergency reporting, volunteer participation, and community coordination.</p>
    <div className="ab-actions">
     <Link className="ab-btn ab-btn-light" to="/services">Explore Our Services <FiArrowRight aria-hidden="true"/></Link>
     <Link className="ab-btn ab-btn-outline" to="/register"><FiUserPlus aria-hidden="true"/> Get Started</Link>
    </div>
   </div>
   <div className="ab-band ab-hero-band">
    <img src={`${IMAGE_DIR}/01_about_hero.png`} alt="Volunteers in green RESQ~CONNECT shirts sitting together on a hillside, looking over a misty valley at sunrise" width="1536" height="237" decoding="async" fetchpriority="high"/>
   </div>
  </section>

  <section className="ab-section ab-mission" aria-labelledby="ab-mission-title">
   <div className="ab-container ab-split">
    <div className="ab-media-col">
     <Photo src="02_mission.png" width="766" height="162" alt="Rescue workers in orange gear walking along a forested mountain ridge above a river valley"/>
     <ul className="ab-points">
      {MISSION_POINTS.map(({icon:Icon,title,text})=><li key={title}>
       <span className="ab-icon" aria-hidden="true"><Icon/></span>
       <span><strong>{title}</strong><span>{text}</span></span>
      </li>)}
     </ul>
    </div>
    <div className="ab-text-col">
     <Eyebrow>OUR MISSION</Eyebrow>
     <h2 id="ab-mission-title">Making every connection count when communities need help.</h2>
     <p>Our mission is to make emergency reporting and community coordination more organized, accessible, and transparent. RESQ~CONNECT provides a connected workspace where people can share incident information, volunteers can participate through structured processes, and authorized coordinators can manage response activities.</p>
    </div>
   </div>
  </section>

  <section className="ab-section ab-vision" aria-labelledby="ab-vision-title">
   <div className="ab-container ab-split ab-split-reverse">
    <div className="ab-text-col">
     <Eyebrow>OUR VISION</Eyebrow>
     <h2 id="ab-vision-title">A future where communities are better connected and prepared.</h2>
     <p>We envision a future where individuals, volunteers, and response coordinators can communicate more clearly, organize assistance responsibly, and work together through accessible digital tools.</p>
    </div>
    <div className="ab-media-col">
     <Photo src="03_vision.png" width="766" height="162" alt="A hand holding a crystal sphere that reflects green hills and a winding river at sunset"/>
     <blockquote className="ab-quote"><p>“Stronger communities begin with better connections.”</p></blockquote>
    </div>
   </div>
  </section>

  <section className="ab-section ab-values" aria-labelledby="ab-values-title">
   <div className="ab-container">
    <figure className="ab-band ab-values-band"><img src={`${IMAGE_DIR}/04_values.png`} alt="Volunteers in green shirts joining their hands together in the centre" width="1536" height="86" loading="lazy" decoding="async"/></figure>
    <div className="ab-intro">
     <Eyebrow>WHAT GUIDES US</Eyebrow>
     <h2 id="ab-values-title">Our Core Values</h2>
     <p>The principles behind a more connected and responsible community response.</p>
    </div>
    <ul className="ab-value-grid">
     {VALUES.map(({icon:Icon,title,text})=><li key={title} className="ab-card ab-value">
      <span className="ab-icon ab-icon-lg" aria-hidden="true"><Icon/></span>
      <h3>{title}</h3>
      <p>{text}</p>
     </li>)}
    </ul>
   </div>
  </section>

  <section className="ab-section ab-workflow" aria-labelledby="ab-workflow-title">
   <div className="ab-container">
    <div className="ab-intro">
     <Eyebrow>HOW IT WORKS</Eyebrow>
     <h2 id="ab-workflow-title">From reporting an incident to coordinating a response.</h2>
     <p>RESQ~CONNECT brings essential activities together through a structured platform workflow.</p>
    </div>
    <ol className="ab-steps">
     {STEPS.map(({icon:Icon,label,title,text},index)=><li key={title} className="ab-step">
      <div className="ab-step-marker" aria-hidden="true"><span className="ab-step-number">{index+1}</span></div>
      <div className="ab-card ab-step-card">
       <div className="ab-step-head"><span className="ab-icon" aria-hidden="true"><Icon/></span><span className="ab-step-label">Step {index+1} · {label}</span></div>
       <h3>{title}</h3>
       <p>{text}</p>
      </div>
     </li>)}
    </ol>
   </div>
  </section>

  <section className="ab-section ab-impact" aria-labelledby="ab-impact-title">
   <div className="ab-container ab-split">
    <div className="ab-media-col">
     <Photo src="06_community_impact.png" width="699" height="147" alt="A young seedling growing from rich soil on a hillside above a riverside village at sunrise"/>
     <ul className="ab-impact-grid">
      {IMPACT.map(({icon:Icon,title,text})=><li key={title} className="ab-card ab-impact-card">
       <span className="ab-icon" aria-hidden="true"><Icon/></span>
       <strong>{title}</strong>
       <span>{text}</span>
      </li>)}
     </ul>
    </div>
    <div className="ab-text-col">
     <Eyebrow>COMMUNITY IMPACT</Eyebrow>
     <h2 id="ab-impact-title">Small actions can create meaningful change.</h2>
     <p>Every accurate report, verified volunteer profile, and well-organized assignment contributes to a clearer coordination process. RESQ~CONNECT is designed to help communities work together through shared information and responsible participation.</p>
    </div>
   </div>
  </section>

  <section className="ab-cta" aria-labelledby="ab-cta-title">
   <div className="ab-ambient" aria-hidden="true"><img src={`${IMAGE_DIR}/07_final_cta.png`} alt="" width="1536" height="175" loading="lazy" decoding="async"/></div>
   <div className="ab-cta-shade" aria-hidden="true"></div>
   <div className="ab-band ab-cta-band">
    <img src={`${IMAGE_DIR}/07_final_cta.png`} alt="A group of volunteers with arms around each other, overlooking mountains and a riverside town at sunrise" width="1536" height="175" loading="lazy" decoding="async"/>
   </div>
   <div className="ab-container ab-cta-content">
    <div className="ab-cta-copy">
     <Eyebrow light>JOIN THE COMMUNITY</Eyebrow>
     <h2 id="ab-cta-title">Together, we can build stronger connections.</h2>
     <p>Be part of a community that values communication, responsible coordination, and helping people stay connected when support matters.</p>
    </div>
    <div className="ab-actions ab-cta-actions">
     <Link className="ab-btn ab-btn-light" to="/register"><FiUserPlus aria-hidden="true"/> Get Started</Link>
     <Link className="ab-btn ab-btn-outline" to="/services">Explore Emergency Services <FiArrowRight aria-hidden="true"/></Link>
    </div>
   </div>
  </section>
 </div>;
}
