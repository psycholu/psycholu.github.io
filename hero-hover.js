import * as THREE from 'three';
import {orbitPose,easeDolly,HERO_CAMERA_Z} from './hero-render-math.js?v=d2ebd82ffe8d';

// One existing point light and a damped camera rig; no extra models or passes.
export function setupHeroHover({camera,holder,model,light,canvas,hero,getProgress,getConfig,wake}){
 light.castShadow=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer={x:0,y:0,inside:false};
 holder.updateMatrixWorld(true);
 const inverse=holder.matrixWorld.clone().invert(),transform=new THREE.Matrix4(),point=new THREE.Vector3(),bounds=new THREE.Box3(),corners=[];
 // Convert mesh bounds to holder-local space, independent of saved composition.
 model.traverse(object=>{
  if(!object.isMesh)return;
  if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
  transform.multiplyMatrices(inverse,object.matrixWorld);const box=object.geometry.boundingBox;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])bounds.expandByPoint(point.set(x,y,z).applyMatrix4(transform));
 });
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
 let rect,rectDirty=true,amount=0,yaw=0,pitch=0,hovered=false,lastTime=performance.now();
 const p=new THREE.Vector3(),ray=new THREE.Vector3(),source=new THREE.Vector3();
 const interactive=target=>target.closest('a,button,input,nav,.disciplines');
 function leave(){pointer.inside=false;wake()}
 hero.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||interactive(event.target)||getProgress()>0){leave();return}
  pointer.x=event.clientX;pointer.y=event.clientY;pointer.inside=true;wake();
 },{passive:true});
 hero.addEventListener('pointerleave',leave,{passive:true});
 addEventListener('blur',leave);
 addEventListener('scroll',()=>{rectDirty=true;leave()},{passive:true});
 new ResizeObserver(()=>{rectDirty=true;wake()}).observe(canvas);
 function portraitBounds(){
  holder.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const point of corners){
   p.copy(point).applyMatrix4(holder.matrixWorld).project(camera);
   const x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {left,right,top,bottom};
 }
 function reset(){amount=0;yaw=0;pitch=0;hovered=false;camera.position.set(0,0,HERO_CAMERA_Z);camera.rotation.set(0,0,0)}
 function beforeRender(){
  const now=performance.now(),dt=Math.min(.08,(now-lastTime)/1000),config=getConfig();lastTime=now;
  if(getProgress()>0){reset();return}
  if(rectDirty){rect=canvas.getBoundingClientRect();rectDirty=false}
  let targetYaw=0,targetPitch=0;hovered=false;
  if(pointer.inside&&rect.width&&rect.height){
   const box=portraitBounds();
   hovered=pointer.x>=box.left&&pointer.x<=box.right&&pointer.y>=box.top&&pointer.y<=box.bottom;
   if(hovered){
    const x=THREE.MathUtils.clamp((pointer.x-(box.left+box.right)/2)/Math.max(1,(box.right-box.left)/2),-1,1);
    const y=THREE.MathUtils.clamp((pointer.y-(box.top+box.bottom)/2)/Math.max(1,(box.bottom-box.top)/2),-1,1);
    targetYaw=x*.047*config.hoverCameraStrength;targetPitch=y*.034*config.hoverCameraStrength;
   }
  }
  const target=hovered&&(config.hoverCamera||config.hoverLight)?1:0;
  amount=easeDolly(amount,target,dt);
  const cameraEnabled=config.hoverCamera&&!reduced.matches;
  yaw=easeDolly(yaw,cameraEnabled?targetYaw:0,dt);pitch=easeDolly(pitch,cameraEnabled?targetPitch:0,dt);
  const pose=orbitPose(cameraEnabled?amount:0,holder.position.x,holder.position.y,yaw,pitch);
  camera.position.set(pose.x,pose.y,pose.z);camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld(true);
  if(config.hoverLight&&amount>0&&rect.width&&rect.height){
   // Intersect the pointer ray with a plane in front of the sculpture. Reuse the
   // existing key light to keep the shader's light count and draw calls unchanged.
   source.set((pointer.x-rect.left)/rect.width*2-1,1-(pointer.y-rect.top)/rect.height*2,.5).unproject(camera);
   ray.copy(source).sub(camera.position).normalize();
   const distance=(2.6-camera.position.z)/ray.z;
   if(distance>0&&Number.isFinite(distance)){
    source.copy(camera.position).addScaledVector(ray,distance);
    light.position.lerp(source,amount);
    light.intensity=THREE.MathUtils.lerp(light.intensity,config.hoverLightPower,amount);
   }
  }
  canvas.dataset.hoverDolly=(cameraEnabled?amount:0).toFixed(3);canvas.dataset.hoverYaw=yaw.toFixed(4);canvas.dataset.hoverPitch=pitch.toFixed(4);canvas.dataset.pointerLight=String(config.hoverLight&&amount>0);
 }
 return {beforeRender,needsRender:()=>hovered||amount>0||Math.abs(yaw)>0||Math.abs(pitch)>0};
}
