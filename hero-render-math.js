export const HERO_CAMERA_Z=8.1;
// Move toward the sculpture centre, preserving its projected anchor as it grows.
export function dollyPose(amount,x,y){
 const forward=.045*Math.max(0,Math.min(1,amount));
 return {x:forward?x*forward:0,y:forward?y*forward:0,z:HERO_CAMERA_Z*(1-forward)};
}
export function easeDolly(current,target,dt){
 const value=current+(target-current)*(1-Math.exp(-Math.min(.08,Math.max(0,dt))*5));
 return Math.abs(value-target)<.001?target:value;
}
// Orbit both camera position and orientation about the sculpture's centre. This
// preserves its screen anchor while showing a genuinely different viewing angle.
export function orbitPose(amount,x,y,yaw,pitch){
 const base=dollyPose(amount,x,y),dx=base.x-x,dy=base.y-y,dz=base.z;
 const py=dy*Math.cos(pitch)-dz*Math.sin(pitch),pz=dy*Math.sin(pitch)+dz*Math.cos(pitch);
 return {x:x+dx*Math.cos(yaw)+pz*Math.sin(yaw),y:y+py,z:-dx*Math.sin(yaw)+pz*Math.cos(yaw)};
}
export function viewportLayout(slotWidth,surfaceWidth,height){
 return {fullWidth:slotWidth*3,fullHeight:height,offsetX:slotWidth,viewWidth:surfaceWidth,viewHeight:height};
}

// A separate narrow-screen profile; never overwrite the saved desktop composition.
export function responsiveComposition(config,stacked){
 return stacked?{scale:config.scale*.76,x:50,y:-.08}:{scale:config.scale,x:config.modelX,y:config.modelY};
}
