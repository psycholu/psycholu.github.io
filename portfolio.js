const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const portfolio=document.querySelector('.portfolio');
if(!reduced.matches)portfolio.classList.add('motion-ready');
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}},{threshold:.12});
document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
// Reveal each complete-work card once, with a small offset between columns.
const archiveCards=[...document.querySelectorAll('.archive-card')];
const archiveObserver=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');archiveObserver.unobserve(entry.target)}
},{threshold:.08,rootMargin:'0px 0px -24px 0px'});
for(const [i,card] of archiveCards.entries()){
 card.style.setProperty('--reveal-delay',`${i%2*85}ms`);
 if(!reduced.matches){card.classList.add('archive-reveal');archiveObserver.observe(card)}
}
reduced.addEventListener('change',()=>{
 if(reduced.matches){archiveObserver.disconnect();for(const card of archiveCards)card.classList.add('is-revealed')}
});
// Each information card enters once, with its own sequence of content.
const factsEntrance=[...document.querySelectorAll('.facts-grid .fact-card')];
const factsEntranceObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-entered');factsEntranceObserver.unobserve(entry.target)}},{threshold:.5,rootMargin:'0px 0px -64px 0px'});
if(!reduced.matches)factsEntrance.forEach((card,index)=>{
 card.classList.add('fact-enter');card.style.setProperty('--card-enter-delay',`${index*110}ms`);
 card.querySelectorAll('.card-kicker,.skill-stack>span,.timeline-entry,.ai-capability h3,.ai-capability li,.fact-bottom').forEach((item,step)=>{item.classList.add('fact-step');item.style.setProperty('--fact-step-delay',`${index*110+step*85}ms`)});
 factsEntranceObserver.observe(card);
});
reduced.addEventListener('change',()=>{if(reduced.matches){factsEntranceObserver.disconnect();factsEntrance.forEach(card=>card.classList.remove('fact-enter'))}});
const section=document.querySelector('.work-section'),pin=document.querySelector('.work-pin'),rail=document.querySelector('.work-rail'),progress=document.querySelector('.work-progress i');
const hasCards=!!rail.querySelector('.project-card');section.classList.toggle('work-empty',!hasCards);
const titleLines=Array.from(section.querySelectorAll('.work-title-line>span')),workIntro=section.querySelector('.work-intro'),workButton=section.querySelector('.more-work');
const handoff=rail.querySelector('.work-handoff'),blades=Array.from(rail.querySelectorAll('.handoff-blade'));
const workPanels=Array.from(rail.querySelectorAll('.project-card,.work-outro'));
// The final two panels are the shutter surface; no extra horizontal chapter.
if(handoff){
 handoff.querySelector('.handoff-under')?.remove();
 for(const blade of blades){
  const frame=document.createElement('div');frame.className='work-rail handoff-final-frame';frame.inert=true;
  for(const panel of workPanels.slice(-2)){const clone=panel.cloneNode(true);clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));clone.querySelectorAll('img').forEach(img=>img.loading='eager');frame.append(clone)}
  blade.querySelector('.handoff-face').replaceChildren(frame);
 }
 pin.append(handoff);
}

const dividers=Array.from(document.querySelectorAll('.chapter-divider'));
const factsGrid=document.querySelector('.facts-grid'),facts=document.querySelector('.facts'),services=document.querySelector('#capabilities')||document.querySelector('.services'),factCards=Array.from(document.querySelectorAll('.fact-card'));
const clamp=v=>Math.min(1,Math.max(0,v));
let scheduled=false,travel=0,range=1,sectionTop=0,handoffRange=0;
function measure(){const enabled=!!handoff&&innerWidth>900&&!reduced.matches;section.classList.toggle('has-handoff',enabled);handoffRange=enabled?innerHeight*1.5:0;travel=Math.max(0,rail.scrollWidth-pin.clientWidth+parseFloat(getComputedStyle(pin).paddingLeft)*2);const h=innerWidth>900&&!reduced.matches?(hasCards?Math.round(innerHeight+travel+handoffRange):Math.round(innerHeight*(reduced.matches?1:1.65)))+'px':'auto';if(section.style.height!==h)section.style.height=h;sectionTop=section.getBoundingClientRect().top+scrollY;range=Math.max(1,section.offsetHeight-innerHeight);update()}
function update(){scheduled=false;const vh=innerHeight,r=section.getBoundingClientRect(),p=clamp((scrollY-sectionTop)/Math.max(1,travel));if(hasCards&&innerWidth>900&&!reduced.matches){rail.style.transform=`translate3d(${-travel*p}px,0,0)`;progress.style.transform=`scaleX(${p})`}else rail.style.transform='none';
 const enter=reduced.matches?1:clamp((vh-r.top)/(vh*.8)),leave=reduced.matches||innerWidth<=900?0:clamp((vh-services.getBoundingClientRect().top)/(vh*.75));
 workIntro.style.transform=`translate3d(0,${(1-enter)*100}px,0)`;workIntro.style.opacity='1';titleLines.forEach(line=>line.style.transform='none');workButton.style.opacity='1';workButton.style.transform='none';
 const trackX=hasCards&&innerWidth>900&&!reduced.matches?travel*p:0;
 for(const panel of workPanels){const inner=panel.querySelector('.project-inner');if(!inner)continue;const left=panel.offsetLeft-trackX;const lift=reduced.matches||innerWidth<=900?0:Math.pow(clamp((left-innerWidth*.5)/(innerWidth*.5)),1.5)*Math.min(550,vh*.77);inner.style.transform=`translate3d(0,${lift}px,0)`;}

 const shutter=handoffRange?clamp((scrollY-sectionTop-travel)/handoffRange):0;section.classList.toggle('is-shuttering',handoffRange>0&&shutter>0);services.style.transform=handoffRange?`translateY(${-handoffRange*(1-shutter)}px)`:'';blades.forEach((blade,i)=>{const q=clamp((shutter-(blades.length-1-i)*.035)/.825);const eased=q*q*(3-2*q);const scale=1-eased;blade.style.transform=`scaleY(${scale})`;blade.querySelector(".handoff-slice").style.transform=`scaleY(${1/Math.max(.001,scale)})`;});section.classList.toggle('is-handoff-complete',!!handoffRange&&shutter>=1);
 for(const divider of dividers){const d=divider.getBoundingClientRect();const amount=reduced.matches?1:clamp((vh-d.top)/(vh*.65));divider.style.setProperty('--divider-progress',amount.toFixed(4));}
 const entry=reduced.matches?1:clamp((vh-factsGrid.getBoundingClientRect().top)/(vh*.65));factCards.forEach((card,i)=>{const q=reduced.matches?1:clamp((entry-i*.065)/(1-i*.065));card.style.transform=`perspective(1200px) translateY(${(1-q)*65}px) rotateX(${(1-q)*38}deg)`;card.style.opacity=String(q)});
 const fx=reduced.matches?0:clamp((vh*.75-facts.getBoundingClientRect().bottom)/(vh*.75));factsGrid.style.transform=`translate3d(0,${-fx*35}px,0) scale(${1-fx*.025})`;factsGrid.style.opacity=String(1-fx*.22);
 const se=reduced.matches?1:clamp((vh-services.getBoundingClientRect().top)/(vh*.75));services.style.borderTopLeftRadius=`${(1-se)*60}px`;services.style.borderTopRightRadius=`${(1-se)*60}px`;
}
function onScroll(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure);new ResizeObserver(measure).observe(document.querySelector('.page-column'));document.fonts.ready.then(measure);measure();

// The complete collection lives inline below Resume.
const workArchive=document.querySelector('#all-work');
for(const b of document.querySelectorAll('.more-work')){b.setAttribute('aria-label','View all projects');const roll=b.querySelector('.button-roll');roll.replaceChildren();roll.setAttribute('aria-hidden','true');Array.from('View all projects').forEach((c,i)=>{const slot=document.createElement('span');slot.className='roll-char';slot.style.setProperty('--i',i);const stack=document.createElement('span');stack.className='char-stack';for(let n=0;n<2;n++){const glyph=document.createElement('span');glyph.textContent=c===' '?'\u00a0':c;stack.append(glyph)}slot.append(stack);roll.append(slot)});b.addEventListener('click',()=>workArchive.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'}))}
const contactModal=document.querySelector('#contact-dialog');contactModal.addEventListener('click',e=>{if(e.target!==contactModal)return;const r=contactModal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)contactModal.close()});

const contactDialog=document.querySelector('#contact-dialog'),contactLinks=document.querySelector('#contact-links');
let contactLanguage='en',contactData={name:'Lucian Design'};
function renderContact(){const zh=contactLanguage==='zh';document.querySelector('#contact-title').textContent=zh?'联系我':'Contact me';document.querySelectorAll('[data-contact-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contactLanguage===contactLanguage)));contactLinks.replaceChildren();const entries=[[zh?'邮箱':'Email',contactData.email,'email'],[zh?'电话':'Phone',contactData.phone,'phone'],[zh?'微信':'WeChat',contactData.wechat,'wechat'],['Telegram',contactData.telegram,'telegram'],['Behance',contactData.behance,'link'],['Dribbble',contactData.dribbble,'link']].filter(([,value])=>value);for(const [label,value,type] of entries){const row=document.createElement('div');row.className='contact-row';const name=document.createElement('span');name.textContent=label;row.append(name);if(type==='email'||type==='phone'||type==='link'||type==='telegram'){const a=document.createElement('a');a.textContent=type==='link'?label+' ↗':type==='telegram'?'@'+value.split('/').filter(Boolean).pop()+' ↗':value;a.href=type==='email'?value:type==='phone'?value:value;if(type==='link'||type==='telegram'){a.target='_blank';a.rel='noopener noreferrer'}row.append(a)}else{const text=document.createElement('span');text.textContent=value;row.append(text);const copy=document.createElement('button');copy.textContent=zh?'复制':'Copy';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);copy.textContent=zh?'已复制':'Copied'}catch{copy.textContent=zh?'请选中复制':'Select to copy'}});row.append(copy)}if((type==='telegram'&&contactData.telegramQr)||(type==='wechat'&&contactData.wechatQr)){const qr=document.createElement('button');qr.type='button';qr.className='contact-qr-trigger';qr.textContent=zh?'二维码':'QR code';qr.dataset.qrContact=type;row.append(qr)}contactLinks.append(row)}}

fetch('./contact.json?v=share-1').then(r=>r.ok?r.json():Promise.reject()).then(data=>{contactData={...contactData,...data};renderContact()}).catch(()=>renderContact());
document.querySelectorAll('[data-contact-language]').forEach(b=>b.addEventListener('click',()=>{contactLanguage=b.dataset.contactLanguage;renderContact()}));
document.querySelector('#avatar-contact').addEventListener('click',()=>document.querySelector('#all-work')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'}));contactDialog.querySelector('.contact-close').addEventListener('click',()=>contactDialog.close());renderContact();

const qrDialog=document.querySelector('#contact-qr-dialog'),qrImage=document.querySelector('#contact-qr-image'),qrLink=document.querySelector('#contact-qr-link');
function showContactQR(kind){
 const source=contactData[kind+'Qr'];if(!source||!source.startsWith('./assets/contact/'))return;
 const telegram=kind==='telegram';document.querySelector('#contact-qr-title').textContent=telegram?'Telegram':'WeChat';qrImage.alt=telegram?'Telegram contact QR code':'WeChat contact QR code';qrImage.src=source;
 qrLink.hidden=!telegram;if(telegram){qrLink.href=contactData.telegram;qrLink.textContent='@'+contactData.telegram.split('/').filter(Boolean).pop()+' ↗'}
 qrDialog.showModal();
}
document.addEventListener('click',async event=>{
 const qr=event.target.closest('[data-qr-contact]');if(qr){showContactQR(qr.dataset.qrContact);return}
 const copy=event.target.closest('[data-copy-contact]');if(!copy)return;
 const value=contactData[copy.dataset.copyContact];if(!value)return;
 try{await navigator.clipboard.writeText(value);const label=copy.textContent;copy.textContent='Copied';document.querySelector('#contact-copy-status').textContent='Copied: '+value;setTimeout(()=>copy.textContent=label,1600)}catch{copy.textContent=value;document.querySelector('#contact-copy-status').textContent='Select and copy: '+value}
});
qrDialog.querySelector('.contact-qr-close').addEventListener('click',()=>qrDialog.close());
qrDialog.addEventListener('click',event=>{if(event.target!==qrDialog)return;const r=qrDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)qrDialog.close()});

// Motion covers play only while visible, in either work collection.
const motionCovers=[...document.querySelectorAll('video[data-cover-src]')],coverVisibility=new Map();
function syncMotionCovers(){for(const video of motionCovers){const active=(coverVisibility.get(video)||0)>.1&&!document.hidden&&!reduced.matches&&!contactDialog.open;if(active){if(!video.getAttribute('src')){video.src=video.dataset.coverSrc;video.load()}video.play().catch(()=>{})}else video.pause()}}
const coverObserver=new IntersectionObserver(entries=>{for(const e of entries)coverVisibility.set(e.target,e.isIntersecting?e.intersectionRatio:0);syncMotionCovers()},{threshold:[0,.1,.25,.5,1]});
for(const video of motionCovers){video.muted=true;video.defaultMuted=true;coverObserver.observe(video)}
document.addEventListener('visibilitychange',syncMotionCovers);contactDialog.addEventListener('close',syncMotionCovers);reduced.addEventListener('change',syncMotionCovers);
