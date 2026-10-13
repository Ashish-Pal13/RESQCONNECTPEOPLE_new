import React,{useEffect,useRef,useState} from 'react';
export const HERO_VIDEO_SRC='/videos/resq-hero.mp4';
export const HERO_POSTER_SRC='/images/hero-poster.webp';
const REDUCED_MOTION_QUERY='(prefers-reduced-motion: reduce)';
function usePrefersReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia(REDUCED_MOTION_QUERY).matches);
 useEffect(()=>{
  if(typeof window.matchMedia!=='function')return undefined;
  const media=window.matchMedia(REDUCED_MOTION_QUERY);
  const update=event=>setReduced(event.matches);
  if(media.addEventListener){media.addEventListener('change',update);return ()=>media.removeEventListener('change',update)}
  media.addListener(update);return ()=>media.removeListener(update);
 },[]);
 return reduced;
}
export default function HeroVideo(){
 const reducedMotion=usePrefersReducedMotion();
 const videoRef=useRef(null);
 useEffect(()=>{
  const video=videoRef.current;
  if(!video)return;
  video.defaultMuted=true;
  video.muted=true;
  video.setAttribute('muted','');
  const playback=video.play();
  if(playback&&typeof playback.catch==='function')playback.catch(()=>{});
 },[reducedMotion]);
 return <div className="hero-media" aria-hidden="true">
  {reducedMotion
   ?<img className="hero-background-video" src={HERO_POSTER_SRC} alt="" decoding="async"/>
   :<video ref={videoRef} className="hero-background-video" autoPlay muted loop playsInline preload="metadata" poster={HERO_POSTER_SRC} aria-hidden="true" tabIndex={-1} disablePictureInPicture disableRemotePlayback>
     <source src={HERO_VIDEO_SRC} type="video/mp4"/>
    </video>}
  <div className="hero-overlay"></div>
 </div>;
}
