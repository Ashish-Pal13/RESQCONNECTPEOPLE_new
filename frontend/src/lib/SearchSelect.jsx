import React,{useEffect,useId,useRef,useState} from 'react';
import {FiChevronDown,FiX} from 'react-icons/fi';
import {api} from '../api';
import {useDebounced} from './useDebounced';
import '../styles/search-select.css';
const PAGE_SIZE=20;
export function SearchSelect({id,label,path,filters={},value,onChange,formatOption,describeOption,placeholder,emptyText='No matches found',hint,required=false}){
 const listId=useId();
 const rootRef=useRef(null);
 const inputRef=useRef(null);
 const [open,setOpen]=useState(false);
 const [text,setText]=useState('');
 const term=useDebounced(text.trim());
 const filterKey=JSON.stringify(filters);
 const queryKey=`${path}|${filterKey}|${term}`;
 const [pageState,setPageState]=useState({key:queryKey,page:1});
 const page=pageState.key===queryKey?pageState.page:1;
 const [result,setResult]=useState({key:null,rows:[],pagination:null,error:''});
 const [fetching,setFetching]=useState(false);
 const [active,setActive]=useState(-1);
 const [version,setVersion]=useState(0);
 useEffect(()=>{setActive(-1)},[queryKey]);
 useEffect(()=>{
  if(!open)return undefined;
  let alive=true;
  const params=new URLSearchParams({...filters,page:String(page),pageSize:String(PAGE_SIZE)});
  if(term)params.set('search',term);
  setFetching(true);
  api(`${path}?${params}`)
   .then(response=>{
    if(!alive)return;
    const data=Array.isArray(response?.data)?response.data:[];
    setResult(current=>{
     const base=current.key===queryKey&&page>1?current.rows:[];
     return {key:queryKey,rows:[...base,...data.filter(row=>!base.some(existing=>existing.id===row.id))],pagination:response?.pagination||null,error:''};
    });
   })
   .catch(err=>{
    if(!alive)return;
    setResult(current=>{
     const keep=current.key===queryKey&&page>1;
     return {key:queryKey,rows:keep?current.rows:[],pagination:keep?current.pagination:null,error:err.message||'Could not load options'};
    });
   })
   .finally(()=>{if(alive)setFetching(false)});
  return ()=>{alive=false};
 },[open,queryKey,page,version]);
 useEffect(()=>{
  if(!open)return undefined;
  const onPointer=event=>{if(rootRef.current&&!rootRef.current.contains(event.target))setOpen(false)};
  document.addEventListener('pointerdown',onPointer);
  return ()=>document.removeEventListener('pointerdown',onPointer);
 },[open]);
 const typing=text.trim()!==term;
 const fresh=result.key===queryKey&&!typing;
 const rows=fresh?result.rows:[];
 const pagination=fresh?result.pagination:null;
 const error=fresh?result.error:'';
 const loading=typing||fetching||result.key!==queryKey;
 const appending=loading&&fresh&&rows.length>0;
 function choose(row){onChange(row);setText('');setOpen(false);setActive(-1)}
 function clear(){onChange(null);setText('');setOpen(true);setVersion(v=>v+1);inputRef.current?.focus()}
 function onKeyDown(event){
  if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);setActive(i=>Math.min(rows.length-1,i+1))}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(i=>Math.max(0,i-1))}
  else if(event.key==='Enter'&&open){event.preventDefault();if(fresh&&active>=0&&rows[active])choose(rows[active])}
  else if(event.key==='Escape'){setOpen(false)}
 }
 const hasMore=pagination&&pagination.page<pagination.totalPages;
 const shown=value?formatOption(value):'';
 return <div className="search-select" ref={rootRef}>
  <label htmlFor={id}>{label}</label>
  <div className={value?'search-select-control has-value':'search-select-control'}>
   <input ref={inputRef} id={id} type="text" role="combobox" autoComplete="off" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-required={required} aria-busy={loading}
    aria-activedescendant={open&&active>=0&&rows[active]?`${listId}-${rows[active].id}`:undefined}
    placeholder={value?shown:placeholder} value={open?text:shown}
    onFocus={()=>{setOpen(true);setText('')}} onChange={e=>{setText(e.target.value);setOpen(true)}} onKeyDown={onKeyDown}/>
   {value
    ?<button type="button" className="search-select-icon" aria-label={`Clear ${label}`} onClick={clear}><FiX aria-hidden="true"/></button>
    :<FiChevronDown className="search-select-icon is-static" aria-hidden="true"/>}
  </div>
  {hint&&<div className="muted search-select-hint">{hint}</div>}
  {open&&<div className="search-select-panel">
   <ul id={listId} role="listbox" aria-label={label} aria-busy={loading} className="search-select-list">
    {rows.map((row,index)=><li key={row.id} id={`${listId}-${row.id}`} role="option" aria-selected={value?.id===row.id}
     className={[index===active?'is-active':'',value?.id===row.id?'is-selected':''].filter(Boolean).join(' ')||undefined}
     onMouseDown={event=>event.preventDefault()} onClick={()=>choose(row)}>
     <span className="search-select-option">{formatOption(row)}</span>
     {describeOption&&<span className="muted search-select-meta">{describeOption(row)}</span>}
    </li>)}
   </ul>
   <div className="search-select-status" role="status">
    {appending?<span>Loading more...</span>
     :loading?<span>Loading...</span>
     :error?<span className="search-select-error">{error} <button type="button" className="search-select-more" onMouseDown={event=>event.preventDefault()} onClick={()=>setVersion(v=>v+1)}>Retry</button></span>
     :!rows.length?<span>{emptyText}</span>
     :<span>Showing {rows.length} of {pagination?.total??rows.length}</span>}
    {hasMore&&!loading&&!error&&<button type="button" className="search-select-more" onMouseDown={event=>event.preventDefault()} onClick={()=>setPageState({key:queryKey,page:page+1})}>Load more</button>}
   </div>
  </div>}
 </div>;
}
