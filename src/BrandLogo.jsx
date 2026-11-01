import React from 'react';
export function BrandLogo({className='',tagline=true}){return <span className={'brand-identity '+className}><img className="netriv-mark" src="/brand/netriv-mark.svg" alt=""/><span className="brand-copy"><strong className="brand-word">नेत्रिव</strong>{tagline&&<span className="brand-tagline">Intelligent Vision. Earlier Detection.</span>}</span></span>;}
