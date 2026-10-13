import React,{useEffect,useRef,useState} from 'react';
import {Link,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {FiLogOut,FiMenu,FiX} from 'react-icons/fi';
import {useAuth} from '../context/Auth';
import {homeFor} from '../lib/roles';
import BrandLogo from '../lib/BrandLogo';
import SiteFooter from '../components/SiteFooter';
const HELPLINES_HASH='#helplines';
const publicLinks=[
 {to:'/',label:'Home'},
 {to:'/about',label:'About'},
 {to:'/services',label:'Services'},
 {to:`/${HELPLINES_HASH}`,label:'Helplines',ariaLabel:'Emergency Helplines',hash:HELPLINES_HASH},
 {to:'/contact',label:'Contact'},
 {to:'/support',label:'Support'}
];
function linkIsActive(link,pathname,hash){
 if(link.hash)return pathname==='/'&&hash===link.hash;
 if(link.to==='/')return pathname==='/'&&hash!==HELPLINES_HASH;
 return pathname===link.to||pathname.startsWith(`${link.to}/`);
}
const prefersReducedMotion=()=>typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function useScrolled(threshold){
 const [scrolled,setScrolled]=useState(()=>typeof window!=='undefined'&&window.scrollY>threshold);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;setScrolled(window.scrollY>threshold)};
  const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(update)};
  update();
  window.addEventListener('scroll',onScroll,{passive:true});
  return ()=>{window.removeEventListener('scroll',onScroll);if(frame)window.cancelAnimationFrame(frame)};
 },[threshold]);
 return scrolled;
}
function TopBar(){
 const {user,logout}=useAuth();
 const navigate=useNavigate();
 const {pathname,hash}=useLocation();
 const [open,setOpen]=useState(false);
 const headerRef=useRef(null);
 const toggleRef=useRef(null);
 const scrolled=useScrolled(8);
 const close=()=>setOpen(false);
 useEffect(()=>{setOpen(false)},[pathname]);
 useEffect(()=>{
  if(!open)return undefined;
  const onKey=event=>{if(event.key==='Escape'){setOpen(false);toggleRef.current?.focus()}};
  const onPointer=event=>{if(headerRef.current&&!headerRef.current.contains(event.target))setOpen(false)};
  const onResize=()=>{if(window.innerWidth>900)setOpen(false)};
  window.addEventListener('keydown',onKey);
  document.addEventListener('pointerdown',onPointer);
  window.addEventListener('resize',onResize);
  return ()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer);window.removeEventListener('resize',onResize)};
 },[open]);
 const className=['topbar',scrolled?'is-scrolled':'',open?'is-open':''].filter(Boolean).join(' ');
 return <header ref={headerRef} className={className}>
  <Link className="logo-link" to="/" aria-label="RESQ~CONNECT home" onClick={close}><BrandLogo className="nav-logo"/></Link>
  <button ref={toggleRef} className="nav-toggle" type="button" aria-controls="public-menu" aria-expanded={open} aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(value=>!value)}>{open?<FiX aria-hidden="true"/>:<FiMenu aria-hidden="true"/>}</button>
  <div id="public-menu" className={open?'topbar-menu open':'topbar-menu'}>
   <nav aria-label="Main">{publicLinks.map(link=>{
    const active=linkIsActive(link,pathname,hash);
    return <Link key={link.to} to={link.to} className={active?'active':undefined} aria-current={active?(link.hash?'location':'page'):undefined} aria-label={link.ariaLabel} onClick={close}>{link.label}</Link>;
   })}</nav>
   <div className="top-actions">{user
    ?<><Link className="btn outline" to={homeFor(user)} onClick={close}>Dashboard</Link><button type="button" className="btn ghost" onClick={()=>{close();logout();navigate('/')}}><FiLogOut aria-hidden="true"/> Logout</button></>
    :<><Link className="btn ghost" to="/login" onClick={close}>Login</Link><Link className="btn" to="/register" onClick={close}>Join Now</Link></>}</div>
  </div>
 </header>;
}
export default function PublicLayout(){
 const {pathname,hash,key}=useLocation();
 useEffect(()=>{
  if(!hash){window.scrollTo(0,0);return undefined}
  const id=decodeURIComponent(hash.slice(1));
  let frame=0;let attempts=0;
  const scroll=()=>{
   const target=document.getElementById(id);
   if(target){target.scrollIntoView({behavior:prefersReducedMotion()?'auto':'smooth',block:'start'});return}
   if(attempts++<30)frame=window.requestAnimationFrame(scroll);
  };
  scroll();
  return ()=>window.cancelAnimationFrame(frame);
 },[pathname,hash,key]);
 return <div className={pathname==='/'?'site public-shell is-home':'site public-shell'}>
  <TopBar/>
  <main id="main-content"><Outlet/></main>
  <SiteFooter/>
 </div>;
}
