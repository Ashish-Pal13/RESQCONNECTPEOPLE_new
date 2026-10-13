import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
export function useHighlightSearch(setSearch,toSearch){
 const {search,key}=useLocation();
 const target=new URLSearchParams(search).get('highlight');
 useEffect(()=>{
  if(target&&/^\d+$/.test(target))setSearch(toSearch(target));
 },[target,key]);
}
