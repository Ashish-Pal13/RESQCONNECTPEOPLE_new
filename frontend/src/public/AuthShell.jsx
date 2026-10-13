import React from 'react';
import {Link} from 'react-router-dom';
import {FiAlertTriangle,FiArrowLeft,FiBell,FiHeart} from 'react-icons/fi';
import BrandLogo from '../lib/BrandLogo';
import '../styles/auth.css';
const BACKGROUND_STYLE={'--auth-bg-image':'url("/images/login-bg.png")'};
const FEATURES=[[FiAlertTriangle,'Report incidents'],[FiHeart,'Volunteer with purpose'],[FiBell,'Track updates']];
export default function AuthShell({children}){
 return <div className="auth-page">
  <section className="auth-visual" style={BACKGROUND_STYLE} aria-label="RESQ~CONNECT">
   <div className="auth-visual-inner">
    <Link className="auth-logo-link" to="/" aria-label="RESQ~CONNECT home"><BrandLogo className="auth-brand-logo"/></Link>
    <div className="auth-intro">
     <h2 className="auth-intro-title">Together, we make a difference.</h2>
     <p className="auth-intro-text">Report incidents, connect with volunteers, and support your community — all in one place.</p>
    </div>
    <ul className="auth-features">
     {FEATURES.map(([Icon,text])=><li key={text}><Icon aria-hidden="true"/><span>{text}</span></li>)}
    </ul>
   </div>
  </section>
  <section className="auth-panel">
   <Link className="auth-back" to="/"><FiArrowLeft aria-hidden="true"/><span>Back to website</span></Link>
   <div className="auth-card">{children}</div>
  </section>
 </div>;
}
