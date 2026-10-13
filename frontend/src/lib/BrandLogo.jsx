import React from 'react';
export const LOGO_SRC='/images/resq-connect-logo.png';
const LOGO_WIDTH=819;
const LOGO_HEIGHT=219;
export default function BrandLogo({className=''}){
 return <img className={className?`brand-logo ${className}`:'brand-logo'} src={LOGO_SRC} alt="RESQ~CONNECT" width={LOGO_WIDTH} height={LOGO_HEIGHT} decoding="async" draggable="false"/>;
}
