import React,{createContext,useCallback,useContext,useEffect,useState} from 'react';
import {api,getToken,setToken,clearToken,UNAUTHORIZED_EVENT} from '../api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null);
 const [loading,setLoading]=useState(true);
 const [sessionError,setSessionError]=useState('');
 useEffect(()=>{
  const onUnauthorized=()=>{setUser(null);setSessionError('Your session has expired. Please sign in again.')};
  window.addEventListener(UNAUTHORIZED_EVENT,onUnauthorized);
  return ()=>window.removeEventListener(UNAUTHORIZED_EVENT,onUnauthorized);
 },[]);
 useEffect(()=>{
  if(!getToken()){setLoading(false);return}
  api('/auth/me').then(setUser).catch(e=>{if(e.status!==401)setSessionError(e.message)}).finally(()=>setLoading(false));
 },[]);
 const accept=useCallback(d=>{setToken(d.token);setSessionError('');setUser(d.user);return d.user},[]);
 const login=useCallback(async(email,password)=>accept(await api('/auth/login',{method:'POST',body:{email,password}})),[accept]);
 const adminLogin=useCallback(async(role,username,password)=>accept(await api('/auth/admin-login',{method:'POST',body:{role,username,password}})),[accept]);
 const register=useCallback(async(name,email,password)=>accept(await api('/auth/register',{method:'POST',body:{name,email,password}})),[accept]);
 const logout=useCallback(()=>{clearToken();setSessionError('');setUser(null)},[]);
 return <AuthContext.Provider value={{user,loading,sessionError,login,adminLogin,register,logout}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
