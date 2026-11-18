import {createDotMotion,stepDotMotion,dotMark,dotTrailOpacity,retainDotTrail} from './hero-dot-motion.js?v=38b09f063ffe';
const SPACING=13,ORIGIN=14.5;

// A local field with separately damped position, size and intensity; never redraw
// the entire hero and stop the animation loop once the field has settled.
export function setupHeroDotHover({hero,surface,getProgress}){
 const layer=document.createElement('canvas');layer.className='hero-dot-hover';layer.setAttribute('aria-hidden','true');surface.append(layer);
 const context=layer.getContext('2d');if(!context){layer.remove();return}
 const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,x=0,y=0,rect,dirty=true,active=false,initialized=false,lastTime=0;
 const motion=createDotMotion(),marks=new Map();
 let bufferWidth=0,bufferHeight=0;
 function hide(){
  if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;active=false;initialized=false;motion.radius=motion.energy=0;marks.clear();layer.classList.remove('is-active');
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
 function release(){active=false;if(reduced.matches)hide();else if(initialized)schedule()}
 function paint(now){
  frame=0;if(getProgress()>0||document.hidden){hide();return}
  if(dirty){rect=hero.getBoundingClientRect();dirty=false}
  const targetX=x-rect.left,targetY=y-rect.top;
  let moving=false;
  if(reduced.matches){motion.x=targetX;motion.y=targetY;motion.radius=60;motion.energy=active ? .6 : 0}
  else {const dt=lastTime?Math.min(.05,(now-lastTime)/1000):1/60;moving=stepDotMotion(motion,targetX,targetY,dt,active)}
  lastTime=now;
  const px=motion.x,py=motion.y;
  if(reduced.matches)marks.clear();
  if(motion.energy>.002){
   const influence=20+motion.radius;
   const startX=Math.ceil((px-influence-ORIGIN)/SPACING),endX=Math.floor((px+influence-ORIGIN)/SPACING);
   const startY=Math.ceil((py-influence-ORIGIN)/SPACING),endY=Math.floor((py+influence-ORIGIN)/SPACING);
   for(let row=startY;row<=endY;row++)for(let col=startX;col<=endX;col++){
    const gx=ORIGIN+col*SPACING,gy=ORIGIN+row*SPACING,distance=Math.hypot(gx-px,gy-py);if(distance>=influence)continue;
    const t=1-distance/influence,strength=t*t*(3-2*t),growth=strength*motion.energy;
    if(growth<.04)continue;
    const key=col+','+row,previous=marks.get(key),point=retainDotTrail(previous,{col,row,gx,gy,radius:.5+(3+5*motion.energy)*growth,alpha:growth*.98,growth},now);
    if(point!==previous){marks.delete(key);marks.set(key,point)}
   }
  }
  while(marks.size>900)marks.delete(marks.keys().next().value);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const [key,point] of marks){
   if(!dotTrailOpacity(now-point.seen)){marks.delete(key);continue}
   minX=Math.min(minX,point.gx-12);minY=Math.min(minY,point.gy-12);maxX=Math.max(maxX,point.gx+12);maxY=Math.max(maxY,point.gy+12);
  }
  const left=marks.size?Math.floor(minX/64)*64:0,top=marks.size?Math.floor(minY/64)*64:0;
  if(marks.size){
   const width=Math.max(128,Math.ceil((maxX-left)/128)*128),height=Math.max(128,Math.ceil((maxY-top)/128)*128);
   const dpr=Math.min(devicePixelRatio||1,1.25,Math.sqrt(450000/(width*height)));
   const w=Math.round(width*dpr),h=Math.round(height*dpr);
   if(w!==bufferWidth||h!==bufferHeight){layer.width=bufferWidth=w;layer.height=bufferHeight=h}
   context.setTransform(w/width,0,0,h/height,0,0);context.clearRect(0,0,width,height);
   layer.style.width=width+'px';layer.style.height=height+'px';
  }
  for(const [key,point] of marks){
   const age=now-point.seen,fade=reduced.matches?1:dotTrailOpacity(age);
   const mark=dotMark(point.col,point.row,now,!reduced.matches&&point.growth>.12);
   const radius=point.radius*(.85+.15*fade),cx=point.gx-left,cy=point.gy-top,color=`rgba(234,255,0,${point.alpha*fade*mark.brightness})`;
   context.fillStyle=context.strokeStyle=color;context.beginPath();
   if(mark.shape===1)context.rect(cx-radius*.8,cy-radius*.8,radius*1.6,radius*1.6);
   else if(mark.shape===2){context.moveTo(cx-radius*.75,cy-radius*.75);context.lineTo(cx+radius*.75,cy+radius*.75);context.moveTo(cx+radius*.75,cy-radius*.75);context.lineTo(cx-radius*.75,cy+radius*.75);context.lineWidth=Math.max(.8,radius*.32);context.stroke();continue}
   else if(mark.shape===3){context.moveTo(cx,cy-radius);context.lineTo(cx+radius*.866,cy+radius*.5);context.lineTo(cx-radius*.866,cy+radius*.5);context.closePath()}
   else context.arc(cx,cy,radius,0,Math.PI*2);
   context.fill();
  }
  if(marks.size){
   layer.style.transform=`translate3d(${left}px,${top}px,0)`;layer.classList.add('is-active');
  }else layer.classList.remove('is-active');
  if((moving||marks.size)&&!reduced.matches)schedule();else lastTime=0;
 }
 hero.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||!fine.matches||getProgress()>0||event.target.closest('nav,button,a,input')){release();return}
  x=event.clientX;y=event.clientY;active=true;
  if(!initialized){rect=hero.getBoundingClientRect();dirty=false;motion.x=x-rect.left;motion.y=y-rect.top;initialized=true}
  schedule();
 },{passive:true});
 hero.addEventListener('pointerleave',release,{passive:true});addEventListener('blur',hide);
 addEventListener('scroll',()=>{dirty=true;hide()},{passive:true});document.addEventListener('visibilitychange',hide);
 new ResizeObserver(()=>{dirty=true;hide()}).observe(hero);fine.addEventListener('change',hide);reduced.addEventListener('change',hide);
 return {hide};
}
