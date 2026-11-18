// A page-wide contrast-aware dot; sparks remain scoped to the homepage hero.
export function setupHeroCursor({hero,getProgress}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='hero-pointer';layer.setAttribute('aria-hidden','true');layer.hidden=true;
 const dot=document.createElement('span');dot.className='hero-pointer-dot';layer.append(dot);
 const pool=Array.from({length:8},()=>{const node=document.createElement('span');node.className='hero-pointer-spark';node.hidden=true;layer.append(node);return {node,animation:null}});
 document.body.append(layer);
 let frame=0,x=0,y=0,previousX=0,previousY=0,lastSpark=-Infinity,index=0,shown=false,emit=false,lastTarget;
 const root=document.documentElement;
 function hide(){
  if(frame)cancelAnimationFrame(frame);frame=0;shown=false;lastTarget=null;layer.hidden=true;root.classList.remove('pointer-mark-active');
  for(const spark of pool){spark.animation?.cancel();spark.animation=null;spark.node.hidden=true}
 }
 function spark(now){
  const slot=pool[index%pool.length],n=index++,angle=n*2.399963,reach=13+(n%4)*3;
  slot.animation?.cancel();slot.node.hidden=false;slot.node.style.left=x+'px';slot.node.style.top=y+'px';
  const dx=Math.cos(angle),dy=Math.sin(angle),rotation=n*37;
  slot.animation=slot.node.animate([
   {opacity:0,transform:`translate(${dx*3}px,${dy*3}px) rotate(${rotation}deg) scale(.35)`},
   {opacity:.9,offset:.2,transform:`translate(${dx*7}px,${dy*7}px) rotate(${rotation+18}deg) scale(1)`},
   {opacity:0,transform:`translate(${dx*reach}px,${dy*reach}px) rotate(${rotation+55}deg) scale(.1)`}
  ],{duration:260+(n%3)*35,easing:'ease-out',fill:'both'});
  const animation=slot.animation;animation.onfinish=()=>{if(slot.animation===animation){slot.node.hidden=true;slot.animation=null;animation.cancel()}};
  previousX=x;previousY=y;lastSpark=now;
 }
 function setContrast(target){
  if(!target)return;
  let dark=true;
  const inHero=hero.contains(target);
  if(inHero&&!target.closest('nav,.pause'))dark=false;
  else for(let node=target;node;node=node.parentElement){
   const color=getComputedStyle(node).backgroundColor,parts=color.match(/[\d.]+/g)?.map(Number);
   if(!parts||parts.length<3||(parts.length>3&&parts[3]<.85))continue;
   dark=parts[0]*.2126+parts[1]*.7152+parts[2]*.0722<140;break;
  }
  dot.style.background=dark?'#ffffff':'#111b05';
  dot.style.boxShadow=dark?'0 0 0 1px #00000035':'0 0 0 1px #f3ffd680';
 }
 document.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'){hide();return}
  x=event.clientX;y=event.clientY;
  emit=hero.contains(event.target)&&getProgress()===0&&!event.target.closest('a,button,input,nav,.disciplines');
  if(!shown){previousX=x;previousY=y;shown=true;layer.hidden=false;root.classList.add('pointer-mark-active')}
  if(event.target!==lastTarget){lastTarget=event.target;setContrast(lastTarget)}
  if(frame)return;
  frame=requestAnimationFrame(now=>{
   frame=0;dot.style.transform=`translate3d(${x}px,${y}px,0)`;
   if(emit&&!reduced.matches&&now-lastSpark>=60&&Math.hypot(x-previousX,y-previousY)>=5&&typeof dot.animate==='function')spark(now);
  });
 },{passive:true});
 document.addEventListener('pointerout',event=>{if(!event.relatedTarget)hide()},{passive:true});
 addEventListener('scroll',()=>{if(shown){lastTarget=document.elementFromPoint(x,y);setContrast(lastTarget)}},{passive:true});
 addEventListener('blur',hide);document.addEventListener('visibilitychange',hide);
 reduced.addEventListener('change',hide);
 return {hide};
}
