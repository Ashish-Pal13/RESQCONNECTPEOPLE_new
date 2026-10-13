import React,{useState} from 'react';
const optionValue=o=>typeof o==='string'?o:String(o.value);
const optionLabel=o=>typeof o==='string'?o:o.label;
export const field=(name,label,extra={})=>({name,label,...extra});
export function FormGrid({id,fields,onSave,button='Save',reset=true}){
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 async function submit(event){
  event.preventDefault();
  const form=event.currentTarget;
  setBusy(true);setError('');
  try{await onSave(Object.fromEntries(new FormData(form)));if(reset)form.reset()}
  catch(err){setError(err.message)}
  finally{setBusy(false)}
 }
 return <form className="form-grid" onSubmit={submit}>
  {fields.map(f=>{
   const controlId=`${id}-${f.name}`;
   const required=f.required!==false;
   return <div key={f.name} className={f.wide?'full-width':''}>
    <label htmlFor={controlId}>{f.label}</label>
    {f.options
     ?<select id={controlId} name={f.name} required={required} defaultValue={f.defaultValue}>{f.options.map(o=><option key={optionValue(o)} value={optionValue(o)}>{optionLabel(o)}</option>)}</select>
     :f.multiline
      ?<textarea id={controlId} name={f.name} maxLength={f.max||5000} required={required} defaultValue={f.defaultValue}/>
      :<input id={controlId} name={f.name} type={f.type||'text'} required={required} min={f.min} maxLength={f.type==='number'?undefined:f.max||255} defaultValue={f.defaultValue}/>}
   </div>;
  })}
  <div className="full-width">
   {error&&<div className="login-error" role="alert">{error}</div>}
   <button className="btn form-submit" type="submit" disabled={busy}>{busy?'Saving...':button}</button>
  </div>
 </form>;
}
