import React,{useEffect,useRef,useState} from 'react';
import {Outlet,useLocation,useNavigate} from 'react-router-dom';
import {FiChevronsLeft,FiChevronsRight,FiMenu,FiX} from 'react-icons/fi';
import BrandLogo from '../lib/BrandLogo';
const MOBILE_QUERY='(max-width: 860px)';
const COLLAPSE_KEY='resq_sidebar_collapsed';
function readCollapsed(){try{return localStorage.getItem(COLLAPSE_KEY)==='1'}catch{return false}}
export default function DashboardFrame({appId,navId,mainId,logo,headerRight,sidebarTitle,navItems,footer,label}){
 const navigate=useNavigate();
 const {pathname}=useLocation();
 const [open,setOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(readCollapsed);
 const menuButton=useRef(null);
 const closeButton=useRef(null);
 const wasOpen=useRef(false);
 useEffect(()=>{setOpen(false);window.scrollTo(0,0)},[pathname]);
 useEffect(()=>{
  if(open){
   const previous=document.body.style.overflow;
   document.body.style.overflow='hidden';
   closeButton.current?.focus();
   const onKey=event=>{if(event.key==='Escape')setOpen(false)};
   document.addEventListener('keydown',onKey);
   wasOpen.current=true;
   return ()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',onKey)};
  }
  if(wasOpen.current){wasOpen.current=false;menuButton.current?.focus()}
  return undefined;
 },[open]);
 useEffect(()=>{
  if(typeof window.matchMedia!=='function')return undefined;
  const media=window.matchMedia(MOBILE_QUERY);
  const onChange=event=>{if(!event.matches)setOpen(false)};
  if(media.addEventListener){media.addEventListener('change',onChange);return ()=>media.removeEventListener('change',onChange)}
  media.addListener(onChange);return ()=>media.removeListener(onChange);
 },[]);
 function toggleCollapsed(){
  setCollapsed(value=>{
   const next=!value;
   try{localStorage.setItem(COLLAPSE_KEY,next?'1':'0')}catch{}
   return next;
  });
 }
 const isActive=item=>item.exact?pathname===item.to||pathname===`${item.to}/`:pathname===item.to||pathname.startsWith(`${item.to}/`);
 const activeItem=navItems.find(item=>!item.external&&isActive(item));
 const pageTitle=activeItem?activeItem.label:sidebarTitle;
 const shellClass=['dash-shell',open?'drawer-open':'',collapsed?'sidebar-collapsed':''].filter(Boolean).join(' ');
 return <section id={appId} className={shellClass}>
  <header className="app-header dash-header">
   <div className="dash-header-left">
    <button ref={menuButton} type="button" className="dash-icon-btn dash-menu-btn" aria-label="Open navigation menu" aria-controls={`${appId}-sidebar`} aria-expanded={open} onClick={()=>setOpen(true)}><FiMenu aria-hidden="true"/></button>
    <div className="dash-brand">{logo}</div>
    <span className="dash-title-divider" aria-hidden="true"></span>
    <div className="dash-page-title">{pageTitle}</div>
   </div>
   <div className="header-right">{headerRight}</div>
  </header>
  <div className="layout">
   {open&&<div className="dash-overlay" aria-hidden="true" onClick={()=>setOpen(false)}></div>}
   <aside id={`${appId}-sidebar`} className="sidebar" aria-label={label}>
    <div className="dash-drawer-head">
     <div className="dash-drawer-logo"><BrandLogo/></div>
     <button ref={closeButton} type="button" className="dash-icon-btn dash-close-btn" aria-label="Close navigation menu" onClick={()=>setOpen(false)}><FiX aria-hidden="true"/></button>
    </div>
    <div className="sidebar-title">{sidebarTitle}</div>
    <nav id={navId}>{navItems.map(item=>{
     const active=!item.external&&isActive(item);
     const Icon=item.icon;
     return <button key={item.to} type="button" className={`nav-btn ${active?'active':''}`} aria-current={active?'page':undefined} title={collapsed?item.label:undefined} onClick={()=>{setOpen(false);navigate(item.to)}}><Icon className="nav-icon" aria-hidden="true"/><span className="nav-label">{item.label}</span></button>;
    })}</nav>
    <button type="button" className="sidebar-collapse" aria-pressed={collapsed} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={toggleCollapsed}>{collapsed?<FiChevronsRight aria-hidden="true"/>:<FiChevronsLeft aria-hidden="true"/>}<span className="nav-label">Collapse</span></button>
   </aside>
   <main id={mainId}><Outlet/></main>
  </div>
  <footer>{footer}</footer>
 </section>;
}
