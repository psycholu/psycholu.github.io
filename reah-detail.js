const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const editing=local&&new URLSearchParams(location.search).get('edit')==='1';
const $=s=>document.querySelector(s),gallery=$('#reah-gallery'),status=$('#save-status'),save=$('#save-layout'),input=$('#upload-input'),dropZone=$('#drop-zone');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let items=[],savedItems=[],revision='',canSave=false,dirty=false,busy=false,paused=reduced.matches,dragged=null;
let replacementId=null;
const replacementInput=$('#replacement-input');
const visible=new Map();
const MODULE_LABELS={'reah-overview':'项目介绍 · 文字模块','reah-logo':'Logo · 文字模块','reah-ai':'Designing with AI · 文字模块'};
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error)}
function markDirty(){dirty=true;message('有未保存的修改');}
function setBusy(value){busy=value;save.disabled=value||!canSave;$('#add-media').disabled=value||!canSave;dropZone.disabled=value||!canSave;gallery.inert=value;}
function safeAsset(src){return typeof src==='string'&&src.startsWith('./assets/reah/')&&!src.includes('..')&&!src.includes('\\')?src:null}
function syncPlayback(){for(const [video,onScreen] of visible){setWanted(video,onScreen&&!paused&&!document.hidden);if(onScreen&&!paused&&!document.hidden)video.play().catch(e=>{if(e?.name!=='NotAllowedError')return;const retry=video.parentElement.querySelector('.media-retry');if(retry)retry.hidden=false});else video.pause()}}
/* videos load only as they come near the screen, so a dozen large files never queue up ahead of the images */
const hydrate=v=>{if(v.dataset.src&&!v.getAttribute('src')){v.src=v.dataset.src;v.load()}};
const release=v=>{if(v.getAttribute('src')){v.pause();v.removeAttribute('src');v.load()}};
/* start fetching a screen and a half ahead; only give the file back once it is four screens away, so scrolling back
   up finds it still loaded instead of downloading it again */
const prepare=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)hydrate(e.target)},{rootMargin:'150% 0px'});
const keep=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting)release(e.target)},{rootMargin:'400% 0px'});
const observer=new IntersectionObserver(entries=>{for(const e of entries){visible.set(e.target,e.isIntersecting);if(e.isIntersecting)hydrate(e.target)}syncPlayback()},{rootMargin:'100px',threshold:.05});
const watchVideo=v=>{observer.observe(v);prepare.observe(v);keep.observe(v);markLoading(v);
 // once data is back, a video that should be playing but isn't (an earlier play() lost to a reload) starts again
 v.addEventListener('canplay',()=>{if(visible.get(v)&&!paused&&!document.hidden&&v.paused)v.play().catch(()=>{})})};
/* a soft light sweeping across a frame while its picture or video is still on its way (or buffering), so an empty
   frame reads as loading, not as a still; transform-only, so it costs the compositor almost nothing */
function markLoading(media,frame=media.parentElement){
 if(!frame)return;const on=()=>frame.classList.add('is-loading'),off=()=>frame.classList.remove('is-loading');
 if(media.tagName==='IMG'){if(!media.complete){on();media.addEventListener('load',off,{once:true});media.addEventListener('error',off,{once:true})}return}
 // a video keeps the sweep until it is actually moving, not just sitting on its first frame or poster; one that is not
 // meant to play right now (paused by the toggle, off screen, not among those playing) only sweeps while it is blank
 let moving=false;const refresh=()=>frame.classList.toggle('is-loading',(media.readyState<2&&!media.poster)||(media.dataset.wanted==='1'&&!moving));
 media.addEventListener('playing',()=>{moving=true;refresh()});
 for(const ev of ['waiting','pause','emptied'])media.addEventListener(ev,()=>{moving=false;refresh()});
 for(const ev of ['loadstart','loadeddata','canplay','wantedchange'])media.addEventListener(ev,refresh);
 refresh();
}
function setWanted(v,on){const value=on?'1':'';if((v.dataset.wanted||'')!==value){v.dataset.wanted=value;v.dispatchEvent(new Event('wantedchange'))}}

function updateMotionLabel(){$('#motion-toggle').textContent=paused?'Play animations ▷':'Pause animations Ⅱ';$('#motion-toggle').setAttribute('aria-pressed',String(paused));syncPlayback()}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;updateMotionLabel()});document.addEventListener('visibilitychange',syncPlayback);reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotionLabel()});
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function button(text,label,action){const b=element('button','',text);b.type='button';b.setAttribute('aria-label',label);b.addEventListener('click',action);return b}
function move(id,delta){const at=items.findIndex(x=>x.id===id),to=Math.max(0,Math.min(items.length-1,at+delta));if(at===to)return;const [item]=items.splice(at,1);items.splice(to,0,item);render();markDirty();}
function applyFrame(frame,item){frame.classList.toggle('cover',item.fit==='cover');frame.style.setProperty('--fit',item.fit||'contain');frame.style.setProperty('--position',`${item.positionX??50}% ${item.positionY??50}%`)}
function controls(item,card,frame,caption,index){
 const panel=element('div','media-controls');
 const handle=button('⠿','拖动排序',()=>{});handle.className='drag-handle';handle.draggable=true;handle.title='拖动调整顺序，也可使用上下按钮';
 handle.addEventListener('dragstart',e=>{if(busy){e.preventDefault();return}dragged=item.id;e.dataTransfer.setData('text/plain','reah:'+item.id);e.dataTransfer.effectAllowed='move';card.classList.add('dragging')});
 handle.addEventListener('dragend',()=>{dragged=null;gallery.querySelectorAll('.dragging,.drop-before').forEach(x=>x.classList.remove('dragging','drop-before'))});
 panel.append(handle);const up=button('↑','上移素材',()=>move(item.id,-1)),down=button('↓','下移素材',()=>move(item.id,1));up.disabled=index===0;down.disabled=index===items.length-1;panel.append(up,down);
 if(item.type==='overview'){panel.classList.add('text-module-controls');panel.append(element('span','module-label',MODULE_LABELS[item.id]||'文字模块'));return panel;}
 function select(label,options,value,change){const wrap=element('label','',label),s=document.createElement('select');s.setAttribute('aria-label',label);for(const [v,t] of options){const o=element('option','',t);o.value=v;s.append(o)}s.value=value;s.addEventListener('change',()=>change(s.value));wrap.append(s);panel.append(wrap);return s}
 select('宽度',[['full','全宽'],['half','半宽']],item.span||'full',value=>{item.span=value;card.classList.toggle('full',value==='full');markDirty()});
 const positions=[];
 select('画面',[['contain','完整显示'],['cover','裁切填满']],item.fit||'contain',value=>{item.fit=value;applyFrame(frame,item);positions.forEach(x=>x.disabled=value!=='cover');markDirty()});
 for(const [name,label] of [['positionX','左右位置'],['positionY','上下位置']]){const wrap=element('label','',label),slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.value=item[name]??50;slider.setAttribute('aria-label',label);slider.disabled=item.fit!=='cover';positions.push(slider);slider.addEventListener('input',()=>{item[name]=Number(slider.value);applyFrame(frame,item);markDirty()});wrap.append(slider);panel.append(wrap)}
 const replace=button('替换素材','替换素材',()=>{if(busy||!canSave)return;replacementId=item.id;replacementInput.value='';replacementInput.click()});replace.className='replace-media';panel.append(replace);
 const remove=button('移除','移除此素材',()=>{items=items.filter(x=>x.id!==item.id);render();markDirty()});remove.className='remove-media';panel.append(remove);
 const wrap=element('label','caption-control'),field=document.createElement('input');field.type='text';field.maxLength=2000;field.value=item.caption||'';field.placeholder='添加说明（可选）';field.setAttribute('aria-label','素材说明');field.addEventListener('input',()=>{item.caption=field.value;caption.textContent=item.caption;caption.hidden=!item.caption;markDirty()});wrap.append(field);panel.append(wrap);return panel;
}
function bindDrop(card,item){
  if(editing){
   card.addEventListener('dragover',e=>{if(!dragged||dragged===item.id)return;e.preventDefault();gallery.querySelectorAll('.drop-before').forEach(x=>x.classList.remove('drop-before'));card.classList.add('drop-before')});
   card.addEventListener('dragleave',e=>{if(!card.contains(e.relatedTarget))card.classList.remove('drop-before')});
   card.addEventListener('drop',e=>{if(!dragged||dragged===item.id)return;e.preventDefault();e.stopPropagation();const old=items.findIndex(x=>x.id===dragged);if(old<0)return;const [moving]=items.splice(old,1);const target=items.findIndex(x=>x.id===item.id);items.splice(target,0,moving);dragged=null;render();markDirty()});
  }
}
function render(){
 observer.disconnect();for(const video of visible.keys())video.pause();visible.clear();gallery.replaceChildren();
 for(const [index,item] of items.entries()){
  if(item.type==='overview'){
   const template=document.getElementById(item.id+'-template');if(!template)continue;
   const card=template.content.firstElementChild.cloneNode(true);card.classList.add('media-card','full','text-module');card.dataset.id=item.id;
   card.querySelectorAll('video').forEach(v=>{v.muted=true;v.defaultMuted=true;watchVideo(v)});
   if(editing)card.prepend(controls(item,card,null,null,index));gallery.append(card);bindDrop(card,item);continue;
  }
  const src=safeAsset(item.src);if(!src)continue;
  const card=element('figure','media-card'+(item.span==='half'?'':' full'));card.dataset.id=item.id;
  const frame=element('div','media-frame'),media=document.createElement(item.type==='video'?'video':'img');if(item.type==='video')media.dataset.src=src;else media.src=src;media.width=item.width||1920;media.height=item.height||1080;media.draggable=false;
  if(item.type==='video'){
   media.muted=true;media.defaultMuted=true;media.loop=true;media.playsInline=true;media.preload='metadata';if(safeAsset(item.poster))media.poster=item.poster;media.setAttribute('aria-label',item.caption||`Reah motion ${index+1}`);
   if(item.hasAudio===true&&item.soundEnabled!==false){
   const sound=button('','开启视频声音',()=>{
    const enable=media.muted;
    if(enable){for(const other of gallery.querySelectorAll('video')){if(other!==media){other.muted=true;other.dispatchEvent(new Event('volumechange'))}}}
    media.muted=!enable;
    if(enable){paused=false;updateMotionLabel();media.play().catch(()=>message('暂时无法播放此视频，请重试。',true))}
   });sound.className='media-sound';
   const updateSound=()=>{sound.innerHTML=media.muted?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';sound.setAttribute('aria-label',media.muted?'开启视频声音':'关闭视频声音');sound.title=media.muted?'开启声音':'关闭声音';sound.setAttribute('aria-pressed',String(!media.muted));};media.addEventListener('volumechange',updateSound);updateSound();frame.append(sound);
   frame.classList.add('has-sound');
   function positionSound(e,park=false){
    if(e.pointerType!=='mouse')return;
    const r=frame.getBoundingClientRect();if(!r.width||!r.height)return;
    const inset=Math.min(34,r.width/2,r.height/2),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    let x=clamp(e.clientX-r.left,inset,r.width-inset),y=clamp(e.clientY-r.top,inset,r.height-inset);
    if(park){const distances=[x,r.width-x,y,r.height-y],edge=distances.indexOf(Math.min(...distances));if(edge===0)x=inset;else if(edge===1)x=r.width-inset;else if(edge===2)y=inset;else y=r.height-inset;}
    frame.classList.toggle('sound-following',!park);sound.style.setProperty('--sound-x',`${x/r.width*100}%`);sound.style.setProperty('--sound-y',`${y/r.height*100}%`);
   }
   frame.addEventListener('pointerenter',e=>positionSound(e));frame.addEventListener('pointermove',e=>positionSound(e));frame.addEventListener('pointerleave',e=>positionSound(e,true));
   frame.addEventListener('click',e=>{if(e.target.closest('button,.media-progress'))return;sound.click()});

   }
   const retry=button('Play video ▷','Play video',()=>{media.play().then(()=>retry.hidden=true).catch(()=>{retry.textContent='Try playing again'})});retry.className='media-retry';retry.hidden=true;media.addEventListener('playing',()=>retry.hidden=true);frame.append(media,retry);watchVideo(media);
   if(item.hasAudio===true)media.addEventListener('loadedmetadata',()=>{if(media.duration>=30&&!frame.querySelector('.media-progress'))addProgress(frame,media,index===0)});
  }else{media.alt=item.caption||`Reah project visual ${index+1}`;media.loading='lazy';media.decoding='async';frame.append(media);markLoading(media,frame)}
  media.addEventListener('error',()=>{if(editing)message('有素材暂时无法播放或显示，请检查文件格式。',true)});
  applyFrame(frame,item);const caption=element('figcaption','media-caption',item.caption||'');caption.hidden=!item.caption;
  if(editing)card.append(controls(item,card,frame,caption,index));card.append(frame,caption);gallery.append(card);
  bindDrop(card,item);
 }
 gallery.setAttribute('aria-busy','false');syncPlayback();
}
async function api(url,options={}){const r=await fetch(url,{...options,cache:'no-store',headers:{'X-Portfolio-Editor':'reah-editor-v1',...options.headers}});const data=await r.json().catch(()=>({error:'编辑服务连接失败，请从本地编辑入口打开。'}));if(!r.ok)throw Error(data.error||'保存失败，请重试。');return data;}
async function dimensions(file){const url=URL.createObjectURL(file);try{return await new Promise(resolve=>{const m=document.createElement(file.type.startsWith('image/')?'img':'video');const done=()=>resolve({width:m.naturalWidth||m.videoWidth||1920,height:m.naturalHeight||m.videoHeight||1080});m.onload=done;m.onloadedmetadata=done;m.onerror=done;m.src=url;setTimeout(done,8000)})}finally{URL.revokeObjectURL(url)}}
async function upload(files,replaceId=null){
 if(!editing||busy||!canSave)return;const list=replaceId?[...files].slice(0,1):[...files];if(!list.length)return;
 setBusy(true);let errors=[],added=0;
 for(const [index,file] of list.entries()){
  message(replaceId?'正在替换素材…':`正在添加素材 ${index+1} / ${list.length}…`);
  try{
   if(!['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/quicktime'].includes(file.type))throw Error(`${file.name}：暂不支持此格式`);
   if(file.size>512*1024*1024)throw Error(`${file.name}：超过 512 MB`);
   const size=await dimensions(file),data=await api('/__portfolio/reah/upload',{method:'POST',headers:{'Content-Type':file.type},body:file});
   const media={type:data.type,src:data.src,...(data.type==='video'?{hasAudio:data.hasAudio===true}:{}),...size};
   if(replaceId){
    const at=items.findIndex(item=>item.id===replaceId);if(at<0)throw Error('原素材已移除，请刷新后重试');
    const original=items[at];items[at]={...original,...media};delete items[at].poster;delete items[at].soundEnabled;if(data.type!=='video')delete items[at].hasAudio;
   }else items.push({id:crypto.randomUUID(),...media,span:'full',fit:'contain',positionX:50,positionY:50,caption:''});
   dirty=true;added++;
  }catch(error){errors.push(error.message)}
 }
 render();setBusy(false);input.value='';replacementInput.value='';message(errors.length?errors.join('；')+(added?'。成功添加的素材请点击保存。':'，原有素材保持不变。'):(replaceId?'素材已替换，位置和排版保持不变，请点击保存。':'素材已添加，请点击保存。'),errors.length>0);
}
save.addEventListener('click',async()=>{
 if(!canSave||busy)return;setBusy(true);message('正在保存…');
 try{const data=await api('/__portfolio/reah/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,items})});revision=data.revision;savedItems=structuredClone(items);dirty=false;message('已保存 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));}
 catch(error){message(error.message,true)}finally{setBusy(false)}
});
replacementInput.addEventListener('change',()=>{const id=replacementId;replacementId=null;if(id)upload(replacementInput.files,id)});
input.addEventListener('change',()=>upload(input.files));$('#add-media').addEventListener('click',()=>input.click());dropZone.addEventListener('click',()=>input.click());
if(local&&!editing)$('#edit-link').hidden=false;
if(editing){
 document.body.classList.add('editing');$('#editor-bar').hidden=false;dropZone.hidden=false;setBusy(true);
 const undo=button('撤销修改','撤销未保存修改',()=>{if(busy)return;items=structuredClone(savedItems);dirty=false;render();message('已恢复到上次保存的布局。')});$('.editor-actions').insertBefore(undo,$('#preview-link'));
 let depth=0;
 const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
 document.addEventListener('dragenter',e=>{if(hasFiles(e)){e.preventDefault();depth++;document.body.classList.add('file-drag')}});
 document.addEventListener('dragover',e=>{if(hasFiles(e))e.preventDefault()});
 document.addEventListener('dragleave',e=>{if(hasFiles(e)){depth=Math.max(0,depth-1);if(!depth)document.body.classList.remove('file-drag')}});
 document.addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();depth=0;document.body.classList.remove('file-drag');upload(e.dataTransfer.files)});
 dropZone.addEventListener('dragover',e=>{if(dragged)e.preventDefault()});dropZone.addEventListener('drop',e=>{if(!dragged)return;e.preventDefault();const at=items.findIndex(x=>x.id===dragged);if(at<0)return;items.push(...items.splice(at,1));dragged=null;render();markDirty()});
 addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue=''}});
}
async function start(){
 try{
  let data;
  if(editing){try{data=await api('/__portfolio/reah');if(!data.canSave)throw Error();revision=data.revision;canSave=true;message('已载入保存的布局。')}catch{message('此预览无法保存。请从本地编辑入口打开此页面。',true)}}
  if(!data){const r=await fetch('./reah-items.json',{cache:'no-store'});if(!r.ok)throw Error();data=await r.json()}
  items=Array.isArray(data.items)?data.items:[];savedItems=structuredClone(items);render();setBusy(false);
 }catch{gallery.setAttribute('aria-busy','false');$('#gallery-error').hidden=false;$('#gallery-error').textContent='The project could not load. Please refresh to try again.';if(editing)setBusy(false)}
 updateMotionLabel();
}
start();

/* long videos with sound (the opener and the 55s piece): a thin progress line you can scrub, so they read as video,
   not a still cover; the opener also says how long it is and that it has sound, then fades that out */
function addProgress(frame,media,hint){
 const bar=element('div','media-progress'),fill=element('span','media-progress-fill');bar.append(fill);
 bar.tabIndex=0;bar.setAttribute('role','slider');bar.setAttribute('aria-label','Video progress');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
 const clock=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
 let raf=0;const draw=()=>{const d=media.duration,p=d>0?Math.min(1,(media.currentTime||0)/d):0;fill.style.transform=`scaleX(${p})`;bar.setAttribute('aria-valuenow',String(Math.round(p*100)));bar.setAttribute('aria-valuetext',d>0?`${clock(media.currentTime)} of ${clock(d)}`:'');raf=media.paused?0:requestAnimationFrame(draw)};
 const run=()=>{if(!raf)raf=requestAnimationFrame(draw)};
 media.addEventListener('play',run);media.addEventListener('seeked',draw);media.addEventListener('pause',draw);draw();if(!media.paused)run();
 const seek=e=>{const r=bar.getBoundingClientRect(),d=media.duration;if(!(d>0)||!r.width)return;media.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*d;draw()};
 bar.addEventListener('pointerdown',e=>{e.preventDefault();bar.setPointerCapture(e.pointerId);bar.classList.add('scrubbing');seek(e)});
 bar.addEventListener('pointermove',e=>{if(bar.hasPointerCapture(e.pointerId))seek(e)});
 const end=e=>{if(bar.hasPointerCapture(e.pointerId))bar.releasePointerCapture(e.pointerId);bar.classList.remove('scrubbing')};
 bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);bar.addEventListener('click',e=>e.stopPropagation());
 bar.addEventListener('keydown',e=>{const d=media.duration;if(!(d>0))return;const step={ArrowLeft:-5,ArrowRight:5,Home:-d,End:d}[e.key];if(step===undefined)return;e.preventDefault();media.currentTime=Math.max(0,Math.min(d-.1,media.currentTime+step));draw()});
 frame.append(bar);
 if(hint&&media.muted){
  const tip=element('span','media-hint',`▶ ${clock(media.duration)} · ${matchMedia('(hover:hover)').matches?'Click':'Tap'} for sound`);frame.append(tip);
  let timer=0;const hide=()=>{clearTimeout(timer);tip.classList.add('gone');setTimeout(()=>tip.remove(),600)};
  media.addEventListener('playing',()=>{clearTimeout(timer);timer=setTimeout(hide,6000)},{once:true});
  media.addEventListener('volumechange',()=>{if(!media.muted)hide()});
 }
}
