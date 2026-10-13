export const DEFAULT_PHONE_COUNTRY='IN';
export const OTHER_PHONE_COUNTRY='OTHER';
export const PHONE_COUNTRIES=[
 {code:'IN',name:'India',dial:'+91',min:10,max:10,lead:/^[6-9]/,leadMessage:'Indian mobile numbers start with 6, 7, 8 or 9.'},
 {code:'NP',name:'Nepal',dial:'+977',min:7,max:10},
 {code:'BD',name:'Bangladesh',dial:'+880',min:10,max:10},
 {code:'BT',name:'Bhutan',dial:'+975',min:7,max:8},
 {code:'LK',name:'Sri Lanka',dial:'+94',min:9,max:9},
 {code:'PK',name:'Pakistan',dial:'+92',min:10,max:10},
 {code:'MV',name:'Maldives',dial:'+960',min:7,max:7},
 {code:'AE',name:'United Arab Emirates',dial:'+971',min:8,max:9},
 {code:'SA',name:'Saudi Arabia',dial:'+966',min:9,max:9},
 {code:'QA',name:'Qatar',dial:'+974',min:8,max:8},
 {code:'OM',name:'Oman',dial:'+968',min:8,max:8},
 {code:'KW',name:'Kuwait',dial:'+965',min:8,max:8},
 {code:'SG',name:'Singapore',dial:'+65',min:8,max:8},
 {code:'MY',name:'Malaysia',dial:'+60',min:9,max:10},
 {code:'CN',name:'China',dial:'+86',min:11,max:11},
 {code:'JP',name:'Japan',dial:'+81',min:9,max:10},
 {code:'AU',name:'Australia',dial:'+61',min:9,max:9},
 {code:'NZ',name:'New Zealand',dial:'+64',min:8,max:10},
 {code:'GB',name:'United Kingdom',dial:'+44',min:9,max:10},
 {code:'DE',name:'Germany',dial:'+49',min:6,max:13},
 {code:'FR',name:'France',dial:'+33',min:9,max:9},
 {code:'ZA',name:'South Africa',dial:'+27',min:9,max:9},
 {code:'US',name:'United States',dial:'+1',min:10,max:10,lead:/^[2-9]/,leadMessage:'US numbers cannot start with 0 or 1.'},
 {code:'CA',name:'Canada',dial:'+1',min:10,max:10,lead:/^[2-9]/,leadMessage:'Canadian numbers cannot start with 0 or 1.'}
];
const BY_CODE=new Map(PHONE_COUNTRIES.map(country=>[country.code,country]));
export const findPhoneCountry=code=>BY_CODE.get(code)||null;
export function validatePhone(countryCode,raw){
 const value=String(raw??'').trim();
 if(!value)return {error:'Enter a phone number.'};
 const compact=value.replace(/[\s\-().]/g,'');
 if(countryCode===OTHER_PHONE_COUNTRY){
  if(!/^\+[1-9]\d{6,14}$/.test(compact))return {error:'Enter the full international number, starting with + and the country code, for example +4915123456789.'};
  return {e164:compact,country:OTHER_PHONE_COUNTRY};
 }
 const country=findPhoneCountry(countryCode);
 if(!country)return {error:'Choose a country code.'};
 let national=compact;
 if(national.startsWith(country.dial))national=national.slice(country.dial.length);
 else if(national.startsWith('+'))return {error:`This number has a different country code. Choose the matching country, or choose "Other country".`};
 if(!/^\d+$/.test(national))return {error:'Use digits only, without letters or symbols.'};
 if(national.startsWith('0')&&national.length>country.min)national=national.slice(1);
 const range=country.min===country.max?`${country.min}`:`${country.min} to ${country.max}`;
 if(national.length<country.min||national.length>country.max)return {error:`${country.name} numbers have ${range} digits after ${country.dial}.`};
 if(country.lead&&!country.lead.test(national))return {error:country.leadMessage};
 const e164=`${country.dial}${national}`;
 if(e164.length-1>15)return {error:'This phone number is too long.'};
 return {e164,country:country.code};
}
export function formatPhone(e164,countryCode){
 if(!e164)return '';
 const country=findPhoneCountry(countryCode);
 if(!country||!e164.startsWith(country.dial))return e164;
 const national=e164.slice(country.dial.length);
 if(country.code==='IN'&&national.length===10)return `${country.dial} ${national.slice(0,5)} ${national.slice(5)}`;
 return `${country.dial} ${national}`;
}
