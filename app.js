import {setupHeroDotHover} from './hero-dot-hover.js?v=f806e0965f9c';
import {setupHeroCursor} from './hero-cursor.js?v=8f6673809ed4';
import {setupHeroHover} from './hero-hover.js?v=3e72b7e0c308';
import {setupResumeAvatar} from './resume-avatar.js?v=contact-stop-1';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HERO_CAMERA_Z,viewportLayout,responsiveComposition} from './hero-render-math.js?v=d2ebd82ffe8d';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {setupHeroDetails} from './hero-details.js?v=74e9cc656957';
document.body.classList.add('monochrome-version');
const $=s=>document.querySelector(s),canvas=$('#scene'),art=$('#art');
const artHome=art.closest('.hero-sculpture-slot')||document.createElement('div');artHome.className='hero-sculpture-slot';if(!artHome.parentElement){art.before(artHome);artHome.append(art);}const artMarker=document.createComment('sculpture-home');art.before(artMarker);
// Keep one live sculpture throughout the hero-to-contact transition.
const avatarButton=$('#avatar-contact'),avatarViewport=$('#avatar-viewport');
const heroRoot=artHome.parentElement,greenSurface=document.createElement('div');greenSurface.className='hero-green-surface';greenSurface.setAttribute('aria-hidden','true');heroRoot.prepend(greenSurface);document.body.classList.add('hero-initialized');
const stackedHero=matchMedia('(max-width:1200px)');
const heroCopy=[...heroRoot.querySelectorAll(':scope > .brand,:scope > nav,:scope > .intro,:scope > .pause')],factsHeading=$('.facts .section-heading');
const {copyLayer}=setupHeroDetails({heroRoot,greenSurface,heroCopy,getProgress:()=>dockProgress,pointerAmbient:false});
document.body.classList.remove('presentation-mode');
setupHeroCursor({hero:heroRoot,getProgress:()=>dockProgress});
setupHeroDotHover({hero:heroRoot,surface:greenSurface,getProgress:()=>dockProgress});
const storageKey='sculpture-hunyuan-fbx-studio-v1';
const defaults={"bodyColor":"#a1f000","bodyMetal":1,"bodyRough":0.195,"frameColor":"#23271b","frameMetal":0.85,"frameRough":0.26,"lensColor":"#dfff9b","lensTransmission":0.95,"lensOpacity":0.26,"lensRough":0.41,"lensIor":1.66,"lensThickness":0.13,"envIntensity":1.97,"envAngle":-25,"exposure":1.18,"animate":true,"speed":0.35,"amplitude":0.28,"quality":1.25,"scale":1.24,"modelX":60.1,"modelY":-0.5,"modelAngle":21.5,"guides":false,"keyOn":false,"keyColor":"#d2ff86","keyPower":0,"keyX":-2.5,"keyY":2.2,"keyZ":2.3,"fillOn":true,"fillColor":"#ffffff","fillPower":5,"fillX":2.7,"fillY":0.3,"fillZ":2.4,"rimOn":true,"rimColor":"#ffffff","rimPower":32,"rimX":1.2,"rimY":2,"rimZ":-2,"modelPitch":0,"yawAnimate":true,"yawMin":-1.5,"yawMax":24,"yawDuration":60,"envAnimate":true,"envSweep":45,"envSweepAnimate":true,"envSweepDuration":90,"envDuration":120,"hoverCamera":true,"hoverLight":true,"hoverLightPower":50,"hoverCameraStrength":1};
const schemas=[
 {id:'body',title:'雕像材质',open:true,fields:[['bodyColor','颜色','color'],['bodyMetal','金属感',0,1,.01],['bodyRough','粗糙度',0,1,.005]],hint:'金属感越高，反射越明显；粗糙度越低，表面越像镜面。'},
 {id:'lens',title:'透明镜片',open:true,fields:[['lensColor','玻璃染色','color'],['lensTransmission','透光率',0,1,.01],['lensOpacity','镜片可见度',0,1,.01],['lensRough','磨砂程度',0,.6,.005],['lensIor','折射率',1,2.33,.01],['lensThickness','玻璃厚度',0,.5,.01]],hint:'透光率控制玻璃透射；可见度越低，镜片越透明。折射率 1.45 接近普通玻璃。'},
 {id:'frame',title:'镜框材质',fields:[['frameColor','颜色','color'],['frameMetal','金属感',0,1,.01],['frameRough','粗糙度',0,1,.005]]},
 {id:'environment',title:'环境与动画',open:true,fields:[['exposure','画面曝光',.2,3,.01],['envIntensity','环境反射强度',0,5,.01],['envAngle','反射中心方向（°）',-180,180,1],['envAnimate','反射方向缓慢往返','check'],['envSweep','反射最大往返幅度（°）',5,90,1],['envSweepAnimate','反射幅度缓慢起伏','check'],['envSweepDuration','幅度起伏周期（秒）',10,180,5],['envDuration','反射往返周期（秒）',40,240,5],['animate','自动光影','check'],['speed','变化速度',0,2,.01],['amplitude','变化幅度',0,1,.01],['quality','渲染清晰度',.5,2,.05]],hint:'反射方向往返时，幅度也会在设定上限的 65%～100% 之间平滑起伏；两个周期可独立调整。关闭幅度起伏后，恢复固定幅度。'},
 ...[['key','主光'],['fill','补光'],['rim','轮廓光']].map(([p,title])=>({id:p,title,fields:[[p+'On','开启光源','check'],[p+'Color','灯光颜色','color'],[p+'Power','亮度',0,200,1],[p+'X','左右位置 X',-10,10,.1],[p+'Y','上下位置 Y',-8,10,.1],[p+'Z','前后位置 Z',-10,10,.1]],hint:'X 左右、Y 上下、Z 前后。光源始终朝向雕像；自动光影开启时，会围绕这个位置缓慢变化。'})),
 {id:'hover',title:'鼠标镜头与光源',open:true,fields:[['hoverCamera','镜头推进与轻微转向','check'],['hoverCameraStrength','镜头转向幅度',0,2,.1],['hoverLight','鼠标强光','check'],['hoverLightPower','鼠标光源亮度',0,120,1]],hint:'镜头随鼠标轻微转向并推进，移开后恢复。鼠标光源不投射阴影；滚动离开首页后自动恢复原有光照。'},
 {id:'composition',title:'雕像位置与角度',fields:[['scale','大小',.1,20,.01],['modelX','水平位置（%）',0,100,.1],['modelY','垂直位置',-10,5,.01],['modelAngle','水平朝向（°）',-90,90,1],['modelPitch','纵向朝向（°）',-60,60,.5],['yawAnimate','水平往返动画','check'],['yawMin','起始角度（°）',-90,90,.5],['yawMax','结束角度（°）',-90,90,.5],['yawDuration','往返周期（秒）',8,120,1],['guides','显示光源辅助线','check']]}
];
for(let i=schemas.length-1;i>=0;i--)if(['lens','frame'].includes(schemas[i].id))schemas.splice(i,1);
const fields=schemas.flatMap(s=>s.fields),fieldMap=new Map(fields.map(f=>[f[0],f]));
function sanitize(data){const out={...defaults};for(const [k,v] of Object.entries(data??{})){const f=fieldMap.get(k);if(!f)continue;if(f[2]==='color'&&typeof v==='string'&&/^#[\da-f]{6}$/i.test(v))out[k]=v;else if(f[2]==='check'&&typeof v==='boolean')out[k]=v;else if(typeof f[2]==='number'&&Number.isFinite(v))out[k]=Math.max(f[2],Math.min(f[3],v))}return out}
// Keep saved composition values; new controls inherit defaults without resetting existing ones.
let config={...defaults};try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');config=sanitize(saved)}catch{}
let motionPaused=matchMedia('(prefers-reduced-motion: reduce)').matches,currentYaw=config.modelAngle;
function fmt(v){return Number(v).toFixed(3).replace(/\.?0+$/,'')||'0'}
const controls=$('#controls');for(const group of schemas){const d=document.createElement('details');d.dataset.group=group.id;d.open=!!group.open;const summary=document.createElement('summary');const title=document.createElement('span');title.textContent=group.title;summary.append(title);d.append(summary);for(const f of group.fields){const [id,label,type]=f;const row=document.createElement('div');row.className='control';const l=document.createElement('label');l.htmlFor='param-'+id;l.textContent=label;const input=document.createElement('input');input.id='param-'+id;input.dataset.param=id;if(type==='color'){input.type='color';input.value=config[id]}else if(type==='check'){input.type='checkbox';input.checked=config[id]}else{input.type='range';input.min=type;input.max=f[3];input.step=f[4];input.value=config[id];const output=document.createElement('output');output.htmlFor=input.id;output.dataset.value=id;output.textContent=fmt(config[id]);row.append(l,output,input);d.append(row);input.addEventListener('input',()=>setParam(id,Number(input.value)));continue}row.append(l,input);d.append(row);input.addEventListener('input',()=>setParam(id,type==='check'?input.checked:input.value))}if(group.hint){const p=document.createElement('p');p.className='control-hint';p.textContent=group.hint;d.append(p)}controls.append(d)}
const scaleInput=$('#param-scale'),scaleNumber=document.createElement('input');scaleNumber.type='number';scaleNumber.id='param-scale-number';scaleNumber.setAttribute('aria-label','大小数值');scaleNumber.min=scaleInput.min;scaleNumber.max=scaleInput.max;scaleNumber.step=scaleInput.step;scaleNumber.value=config.scale;scaleInput.parentElement.querySelector('output').hidden=true;scaleInput.before(scaleNumber);scaleNumber.addEventListener('input',()=>{if(scaleNumber.value==='')return;const n=Number(scaleNumber.value);if(!Number.isFinite(n)){scaleNumber.value=config.scale;return}const value=Math.max(.1,Math.min(20,n));scaleNumber.value=value;scaleInput.value=value;setParam('scale',value)});
function showTab(view){for(const group of schemas){const category=['body','lens','frame'].includes(group.id)?'material':group.id==='composition'?'composition':'light';const d=$('details[data-group="'+group.id+'"]');d.hidden=category!==view;if(group.id==='key'&&view==='light')d.open=true;if(group.id==='composition'&&view==='composition')d.open=true}document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===view)));$('#editor').scrollTop=0}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));showTab('composition');
function syncControls(){scaleNumber.value=config.scale;for(const f of fields){const input=$('[data-param="'+f[0]+'"]');if(f[2]==='check')input.checked=config[f[0]];else input.value=config[f[0]];const out=$('[data-value="'+f[0]+'"]');if(out)out.textContent=fmt(config[f[0]])}$('#param-modelAngle').disabled=config.yawAnimate;syncPause()}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(config));status('已自动保存到当前浏览器')}catch{status('当前浏览器无法保存，可使用“导出参数”')}}
function status(message){$('#editor-status').textContent=message}
function setParam(k,v){if(k==='scale')scaleNumber.value=v;if(k==='yawAnimate'&&!v)config.modelAngle=currentYaw;config[k]=v;if(k==='yawAnimate')syncControls();const out=$('[data-value="'+k+'"]');if(out)out.textContent=fmt(v);syncPause();apply();last=0;unfreeze();requestRender();save()}
$('#reset').addEventListener('click',()=>{config={...defaults};time=0;yawTime=0;envTime=0;motionPaused=false;syncControls();apply();unfreeze();requestRender();save()});
$('#export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:4,parameters:config},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sculpture-light-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('参数已导出；当前设置仍保留在此浏览器')});
function setPanel(open){$('.workspace').classList.toggle('panel-hidden',!open);$('#panel-open').hidden=open;$('#editor').inert=!open}
setPanel(false);$('#panel-open').hidden=true;
$('#panel-close').addEventListener('click',()=>{setPanel(false);$('#panel-open').focus()});$('#panel-open').addEventListener('click',()=>{setPanel(true);$('#panel-close').focus()});
const still=document.createElement('img');still.className='still';still.alt='';still.hidden=true;art.append(still);
let heroHover;
let renderer,scene,camera,holder,bodyMat,frameMat,lensMat,lights={},helpers=[],loaded=false,visible=true,inView=true,avatarDocked=false,dockProgress=0,heroScale=0,heroRenderHeight=0,avatarRenderHeight=108,raf=0,last=0,time=0,yawTime=0,envTime=0,frames=0;
function anyMotion(){return(config.animate&&config.speed>0)||config.yawAnimate||config.envAnimate}
function syncPause(){if(!$('#pause'))return;const paused=motionPaused||!anyMotion();$('#pause').setAttribute('aria-pressed',String(paused));$('#pause').setAttribute('aria-label',paused?'Play animation':'Pause animation');$('#pause-icon').textContent=paused?'▷':'Ⅱ';$('#pause-label').textContent=paused?'Play animation':'Pause animation'}
syncPause();$('#param-modelAngle').disabled=config.yawAnimate;
$('#pause')?.addEventListener('click',()=>{if(!anyMotion()){config.animate=true;config.yawAnimate=true;motionPaused=false;syncControls();save()}else motionPaused=!motionPaused;syncPause();last=0;unfreeze();requestRender()});

function updateOrientation(){const low=Math.min(config.yawMin,config.yawMax),high=Math.max(config.yawMin,config.yawMax);currentYaw=config.yawAnimate?low+(high-low)*(1-Math.cos(2*Math.PI*yawTime/config.yawDuration))/2:config.modelAngle;if(holder)holder.rotation.set(THREE.MathUtils.degToRad(config.modelPitch-3*Math.sin(Math.PI*dockProgress)),THREE.MathUtils.degToRad(currentYaw-18*dockProgress),THREE.MathUtils.degToRad(2*Math.sin(Math.PI*dockProgress)),'YXZ');if(config.yawAnimate){$('#param-modelAngle').value=currentYaw;$('[data-value="modelAngle"]').textContent=currentYaw.toFixed(1)}canvas.dataset.yaw=currentYaw.toFixed(3);canvas.dataset.pitch=config.modelPitch.toFixed(3);canvas.dataset.lightTime=time.toFixed(3)}

function draw(){renderer.info.reset();heroHover?.beforeRender();renderer.render(scene,camera);frames++;canvas.dataset.frames=frames;canvas.dataset.triangles=renderer.info.render.triangles;canvas.dataset.lensTransmission=config.lensTransmission;canvas.dataset.lensCount=2}
function freeze(){/* Retain the last GPU frame; avoid a synchronous image readback. */still.hidden=true;canvas.style.removeProperty('opacity')}function unfreeze(){still.hidden=true;canvas.style.removeProperty('opacity')}
function positionLights(){
 const center=holder?.position??new THREE.Vector3();
 for(const [i,p] of ['key','fill','rim'].entries()){
  const l=lights[p];l.position.set(config[p+'X'],config[p+'Y'],config[p+'Z']).add(center);
  if(config.animate){l.position.x+=Math.sin(time*.23*config.speed+i*1.8)*config.amplitude;l.position.y+=Math.cos(time*.19*config.speed+i)*config.amplitude}
 }
 for(const h of helpers){h.visible=config.guides;h.update()}
}
function updateReflection(){const sweepFactor=config.envSweepAnimate?1-.35*(1-Math.cos(2*Math.PI*envTime/config.envSweepDuration))/2:1;const sweep=config.envSweep*sweepFactor;const angle=config.envAngle+(config.envAnimate?Math.sin(2*Math.PI*envTime/config.envDuration)*sweep:0);scene.environmentRotation.y=THREE.MathUtils.degToRad(angle);canvas.dataset.envAngle=angle.toFixed(3);canvas.dataset.envSweep=sweep.toFixed(3)}
function apply(){if(!renderer)return;updateReflection();renderer.toneMappingExposure=config.exposure;scene.environmentIntensity=config.envIntensity;if(bodyMat){bodyMat.color.set(config.bodyColor);bodyMat.metalness=config.bodyMetal;bodyMat.roughness=config.bodyRough;frameMat.color.set(config.frameColor);frameMat.metalness=config.frameMetal;frameMat.roughness=config.frameRough;lensMat.color.set(config.lensColor);lensMat.transmission=config.lensTransmission;lensMat.opacity=config.lensOpacity;lensMat.roughness=config.lensRough;lensMat.ior=config.lensIor;lensMat.thickness=config.lensThickness;}for(const p of ['key','fill','rim']){if(lights[p]){lights[p].color.set(config[p+'Color']);lights[p].intensity=config[p+'On']?config[p+'Power']:0}}resize(false)}
function requestRender(){if(!raf&&loaded&&visible)raf=requestAnimationFrame(render)}
function render(now){raf=0;if(!loaded||!visible)return;if(avatarDocked&&last&&now-last<33){requestRender();return}const dt=last?Math.min((now-last)/1000,.08):0;last=now;if(!motionPaused){if(config.animate)time+=dt;if(config.yawAnimate)yawTime+=dt;if(config.envAnimate)envTime+=dt}updateReflection();updateOrientation();positionLights();draw();if((!motionPaused&&anyMotion())||heroHover?.needsRender())requestRender();else freeze()}
function alignPoster(w,h){
 const picture=art.querySelector('.hero-poster');if(!picture)return;
 const stacked=stackedHero.matches,composition=responsiveComposition(config,stacked),p=dockProgress;
 const homeScale=heroScale||Math.min(1,(w/h)/.62),referenceScale=stacked?1.24*.76:1.24;
 const imageHeight=THREE.MathUtils.lerp(composition.scale*homeScale*(heroRenderHeight||h),1.1*avatarRenderHeight,p)/referenceScale;
 const projection=2*Math.tan(THREE.MathUtils.degToRad(16))*HERO_CAMERA_Z;
 const referenceY=.5-(stacked?-.08:-.5)/projection,targetY=.5-THREE.MathUtils.lerp(composition.y,-.43,p)/projection;
 picture.style.setProperty('--poster-height',imageHeight+'px');picture.style.setProperty('--poster-top',(targetY*h-referenceY*imageHeight)+'px');
 picture.style.setProperty('--poster-left',(w*(.5+(composition.x/100-.5)*(1-p)))+'px');
}
function resize(schedule=true){if(!renderer||!camera)return;const w=art.clientWidth,h=art.clientHeight,surface=dockProgress===0?heroRoot:dockProgress===1?avatarViewport:greenSurface,renderWidth=surface.clientWidth;if(!w||!h||!renderWidth)return;const dpr=Math.min(devicePixelRatio,config.quality,Math.sqrt(2200000/(renderWidth*h)));canvas.style.width=renderWidth+'px';canvas.style.left='0px';if(canvas.width!==Math.floor(renderWidth*dpr)||canvas.height!==Math.floor(h*dpr)){renderer.setPixelRatio(dpr);renderer.setSize(renderWidth,h,false)}alignPoster(w,h);const view=viewportLayout(w,renderWidth,h);camera.fov=32;camera.setViewOffset(view.fullWidth,view.fullHeight,view.offsetX,0,view.viewWidth,view.viewHeight);camera.updateProjectionMatrix();if(holder){const composition=responsiveComposition(config,stackedHero.matches),baseScale=composition.scale*(heroScale||Math.min(1,(w/h)/1.55));const projectedScale=THREE.MathUtils.lerp(baseScale*(heroRenderHeight||h),1.1*avatarRenderHeight,dockProgress);holder.scale.setScalar(projectedScale/h);const hw=Math.tan(THREE.MathUtils.degToRad(16))*HERO_CAMERA_Z*(w/h);holder.position.set(hw*(composition.x/50-1)*(1-dockProgress),THREE.MathUtils.lerp(composition.y,-.43,dockProgress),0);updateOrientation()}if(schedule)requestRender()}

try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.transmissionResolutionScale=.75;renderer.info.autoReset=false;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.05,100);camera.position.set(0,0,HERO_CAMERA_Z);
 const room=new RoomEnvironment();room.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial)o.material.color.set(0x020202);if(o.isLight)o.intensity=0});const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.025).texture;room.dispose();pmrem.dispose();
 for(const p of ['key','fill','rim']){const l=new THREE.PointLight(0xffffff,1,0,2);lights[p]=l;scene.add(l);const h=new THREE.PointLightHelper(l,.15);helpers.push(h);scene.add(h)}
 apply();
 let model;try{model=(await new GLTFLoader().loadAsync('./assets/sculpture-hunyuan-optimized.glb')).scene}catch(error){console.warn('轻量模型加载失败，使用原始模型',error);const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js');model=await new FBXLoader().loadAsync('./assets/sculpture-hunyuan.fbx');const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const scale=4.1/size.y;model.scale.setScalar(scale);model.position.copy(center).multiplyScalar(-scale)}holder=new THREE.Group();holder.add(model);scene.add(holder);
 bodyMat=new THREE.MeshStandardMaterial({side:THREE.DoubleSide});frameMat=new THREE.MeshStandardMaterial({side:THREE.DoubleSide});lensMat=new THREE.MeshPhysicalMaterial({transparent:true,depthWrite:false,metalness:0,side:THREE.DoubleSide,attenuationColor:0xffffff,attenuationDistance:1,specularIntensity:1});
 let lensFaces=0;model.traverse(o=>{if(!o.isMesh)return;if(o.name==='GlassLenses'){o.material=lensMat;o.renderOrder=2;lensFaces+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}else o.material=['RayBanz','TooBig1','TooBig2'].includes(o.name)?frameMat:bodyMat});canvas.dataset.lensFaces=lensFaces;
 loaded=true;apply();updateReflection();positionLights();draw();requestAnimationFrame(()=>{art.classList.add('ready');requestRender()});status('轻量模型已就绪 · 构图参数保持原设置');
 heroHover=setupHeroHover({camera,holder,model,light:lights.key,canvas,hero:heroRoot,getProgress:()=>dockProgress,getConfig:()=>config,wake:()=>{unfreeze();requestRender()}});requestRender();status('轻量雕像已就绪 · 鼠标可控制镜头与光源');
}catch(e){console.error(e);$('#loading').hidden=true;$('#error').hidden=true;art.classList.add('model-unavailable');status('3D 暂不可用，已保留雕像截图')}
new ResizeObserver(()=>resize()).observe(art);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visible=inView&&!document.hidden;if(visible){last=0;requestRender()}}).observe(art);document.addEventListener('visibilitychange',()=>{visible=inView&&!document.hidden;last=0;if(visible)requestRender()});

const dockMotion=matchMedia('(prefers-reduced-motion: reduce)');
const clampDock=v=>Math.min(1,Math.max(0,v));
let dockScheduled=false,previousDock=-1,dockGeometry;
function measureDock(){
 const slot=artHome.getBoundingClientRect(),hero=heroRoot.getBoundingClientRect();
 dockGeometry={left:slot.left,top:slot.top+scrollY,width:slot.width,height:slot.height,heroLeft:hero.left,heroTop:hero.top+scrollY,heroWidth:hero.width,heroHeight:hero.height};
 heroScale=Math.min(1,(slot.width/slot.height)/.62);heroRenderHeight=slot.height;avatarRenderHeight=avatarViewport.getBoundingClientRect().height;
 previousDock=-1;checkDock();
}
function checkDock(){
 dockScheduled=false;if(!dockGeometry)return;
 const g=dockGeometry,start=g.heroTop+g.heroHeight*.10,end=g.heroTop+g.heroHeight*.80;
 const raw=clampDock((scrollY-start)/(end-start));
 dockProgress=dockMotion.matches?(raw>=1?1:0):raw*raw*(3-2*raw);
 if(previousDock===dockProgress)return;previousDock=dockProgress;
 const p=dockProgress,atHome=p===0,docked=p===1,target=avatarViewport.getBoundingClientRect(),mix=(a,b)=>a+(b-a)*p;
 avatarDocked=docked;
 for(const element of heroCopy){element.style.opacity=atHome?'1':'0';element.inert=!atHome}
 if(factsHeading){const reveal=dockMotion.matches?1:clampDock((p-.62)/.28);factsHeading.style.filter=`opacity(${reveal*reveal*(3-2*reveal)})`}
 const ring=clampDock((p-.85)/.15);
 avatarButton.style.setProperty('--dock-ring',String(ring));avatarButton.classList.toggle('is-visible',ring>0);avatarButton.classList.toggle('is-docked',docked);
 avatarButton.inert=!docked;avatarButton.setAttribute('aria-hidden',String(!docked));avatarButton.tabIndex=docked?0:-1;
 if(atHome){
  if(art.parentElement!==artHome)artMarker.after(art);
  if(greenSurface.parentElement!==heroRoot)heroRoot.prepend(greenSurface);
  greenSurface.hidden=false;greenSurface.classList.remove('is-morphing');for(const property of ['left','top','width','height','border-radius','clip-path'])greenSurface.style.removeProperty(property);copyLayer.hidden=true;
  art.classList.remove('is-masked');art.removeAttribute('style');
 }else if(docked){
  if(art.parentElement!==avatarViewport)avatarViewport.append(art);
  greenSurface.hidden=true;art.classList.remove('is-masked');art.removeAttribute('style');
 }else{
  greenSurface.hidden=false;
  if(greenSurface.parentElement!==document.body)document.body.append(greenSurface);
  greenSurface.classList.add('is-morphing');copyLayer.hidden=false;
  const left=mix(g.heroLeft,target.left),top=mix(g.heroTop-start,target.top),baseWidth=mix(g.heroWidth,target.width),baseHeight=mix(g.heroHeight,target.height);
  const width=g.heroWidth>=g.heroHeight?baseHeight+(g.heroWidth-g.heroHeight)*Math.pow(1-p,3):baseWidth;
  const height=g.heroHeight>g.heroWidth?baseWidth+(g.heroHeight-g.heroWidth)*Math.pow(1-p,3):baseHeight;
  const radius=clampDock(p/.65)*Math.min(width,height)/2;
  Object.assign(greenSurface.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px',borderRadius:radius+'px',clipPath:`inset(0 round ${radius}px)`});
  const textFade=clampDock((p-.08)/.26),copyScale=Math.min(width/g.heroWidth,height/g.heroHeight);
  Object.assign(copyLayer.style,{width:g.heroWidth+'px',height:g.heroHeight+'px',transform:`scale(${copyScale})`,opacity:String(1-textFade*textFade*(3-2*textFade))});
  if(art.parentElement!==greenSurface)greenSurface.append(art);
  art.classList.add('is-masked');
  // The portrait recentres inside the same shrinking green mask.
  const q=clampDock((p-.10)/.65),recentre=q*q*(3-2*q),portraitWidth=mix(g.width,target.width);
  Object.assign(art.style,{left:'0px',top:((g.top-g.heroTop)*(1-recentre))+'px',width:(portraitWidth+(width-portraitWidth)*recentre)+'px',height:mix(g.height,height,recentre)+'px'});
 }
 greenSurface.dataset.progress=p.toFixed(3);
 inView=true;visible=!document.hidden;last=0;unfreeze();resize();requestRender();canvas.dataset.docked=String(docked);canvas.dataset.dockProgress=p.toFixed(3);
}
addEventListener('scroll',()=>{if(!dockScheduled){dockScheduled=true;requestAnimationFrame(checkDock)}},{passive:true});
addEventListener('resize',()=>{previousDock=-1;measureDock()});
dockMotion.addEventListener('change',()=>{previousDock=-1;checkDock()});
measureDock();
new ResizeObserver(measureDock).observe(heroRoot);
new ResizeObserver(measureDock).observe(artHome);
setupResumeAvatar({button:avatarButton});
avatarButton.addEventListener('click',()=>{if(loaded){draw();const portrait=$('.contact-portrait img');portrait.src=canvas.toDataURL('image/webp',.95);portrait.classList.add('is-framed')}});
