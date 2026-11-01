import React,{useEffect,useRef,useState} from 'react';
export function BrandVideo({className=''}){
 const ref=useRef(null),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const v=ref.current,media=matchMedia('(prefers-reduced-motion: reduce)');v.playbackRate=.75;const sync=()=>{setPaused(media.matches);if(media.matches)v.pause();else v.play().catch(()=>setPaused(true));};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 function toggle(){const v=ref.current;if(v.paused)v.play().then(()=>setPaused(false)).catch(()=>{});else{v.pause();setPaused(true);}}
 return <div className={'brand-video '+className}><video ref={ref} autoPlay muted loop playsInline preload="metadata" poster="/brand/retina-poster.png" aria-hidden="true" onError={()=>setFailed(true)}><source src="/brand/retina-background.mp4" type="video/mp4"/></video>{failed&&<img className="brand-video-fallback" src="/brand/retina-poster.png" alt=""/>}<span className="video-corner" aria-hidden="true"/><button className="video-toggle" type="button" onClick={toggle} aria-label={paused?'Play decorative video':'Pause decorative video'}>{paused?'▶':'Ⅱ'}</button></div>;
}
