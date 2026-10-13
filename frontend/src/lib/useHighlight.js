import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
export function useHighlight(ready){
 const {search,key}=useLocation();
 const target=new URLSearchParams(search).get('highlight');
 useEffect(()=>{
  if(!ready||!target)return undefined;
  const element=[...document.querySelectorAll('[data-highlight]')].find(el=>el.getAttribute('data-highlight')===target);
  if(!element)return undefined;
  element.scrollIntoView({block:'center',behavior:'smooth'});
  element.classList.remove('row-highlight');
  void element.offsetWidth;
  element.classList.add('row-highlight');
  const timer=setTimeout(()=>element.classList.remove('row-highlight'),3200);
  return ()=>clearTimeout(timer);
 },[ready,target,key]);
}
