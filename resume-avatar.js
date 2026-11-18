// Move one live model continuously between the floating contact and resume header.
export function setupResumeAvatar({button}){
 const section=document.querySelector('.resume-section'),slot=document.querySelector('.resume-avatar-slot'),work=document.querySelector('.work-section');
 const contactTitle=document.querySelector('#footer-contact-title');
 if(!section||!slot)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=v=>Math.max(0,Math.min(1,v));
 let queued=false,currentX=0,currentY=0,previousTime=0,previousOpacity=1;
 function update(now){
  queued=false;
  let x=0,y=0,opacity=1,ring=1;
  const sectionRect=section.getBoundingClientRect(),anchor=slot.getBoundingClientRect(),vh=innerHeight;
  document.body.classList.toggle('is-reading-resume',sectionRect.top<vh&&sectionRect.bottom>0);
  if(button.classList.contains('is-docked')&&sectionRect.top<vh){
   const style=getComputedStyle(button),homeX=parseFloat(style.left),homeY=vh-parseFloat(style.bottom)-button.offsetHeight;
   if(sectionRect.bottom<vh*.55){
    opacity=clamp((vh*.55-sectionRect.bottom)/(vh*.28));
   }else{
    const t=clamp((homeY-anchor.top)/140);
    let ease=t*t*(3-2*t);
    if(work?.classList.contains('has-handoff')&&!work.classList.contains('is-handoff-complete')){
     // Delay the journey until the shutters uncover the resume; never hide the model.
     const blade=work.querySelector('.handoff-blade'),matrix=blade?getComputedStyle(blade).transform:'none';
     const scale=matrix==='none'?1:Number(matrix.split(',')[3]);
     const reveal=clamp((.3-scale)/.3);
     ease*=reveal*reveal*(3-2*reveal);
    }
    x=(anchor.left-homeX)*ease;y=(anchor.top-homeY)*ease;ring=1-ease;
    // The portrait only leaves view naturally with its header, never during entry.
    opacity=anchor.bottom<=0&&ease===1?0:1;
   }
  }
  // Near the footer the portrait stops at the Contact heading and scrolls away with the page.
  let pinned=false;
  if(contactTitle&&button.classList.contains('is-docked')){
   const title=contactTitle.getBoundingClientRect(),box=button.getBoundingClientRect(),size=button.offsetHeight;
   const homeTop=box.top-currentY,homeLeft=box.left-currentX;
   const clear=homeLeft+size+16<=title.left;
   const stop=clear?title.top+title.height/2-size/2:title.top-size-16;
   if(stop<homeTop){x=0;y=stop-homeTop;opacity=1;ring=1;pinned=true}
  }
  const dt=previousTime?Math.min(64,Math.max(0,now-previousTime)):16;previousTime=now;
  const follow=pinned||reduced.matches||opacity===0||previousOpacity===0?1:1-Math.exp(-dt/85);
  currentX+=(x-currentX)*follow;currentY+=(y-currentY)*follow;previousOpacity=opacity;
  const unsettled=Math.abs(x-currentX)+Math.abs(y-currentY)>.12;
  if(!unsettled){currentX=x;currentY=y}
  button.style.setProperty('--resume-avatar-x',`${currentX}px`);button.style.setProperty('--resume-avatar-y',`${currentY}px`);
  button.style.setProperty('--resume-avatar-opacity',String(opacity));button.style.setProperty('--resume-ring-opacity',String(ring));
  button.style.pointerEvents=opacity<.1?'none':'';
  if(button.classList.contains('is-docked')){button.tabIndex=opacity<.1?-1:0;button.setAttribute('aria-hidden',String(opacity<.1))}
  button.dataset.resumeState=opacity<.1?'away':ring<.01?'parked':'floating';
  if(unsettled)schedule();
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
 new ResizeObserver(schedule).observe(section);document.fonts.ready.then(schedule);schedule();
}
