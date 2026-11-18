export function setupHeroDetails({heroRoot,greenSurface,heroCopy,getProgress,pointerAmbient=true}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 for(const heading of heroRoot.querySelectorAll('h1,.statement')){
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  let order=0;
  for(const node of nodes){
   const fragment=document.createDocumentFragment();
   for(const part of node.textContent.match(/\S+|\s+/g)||[]){
    if(/^\s+$/.test(part)){fragment.append(document.createTextNode(part));continue}
    const mask=document.createElement('span'),word=document.createElement('span');
    mask.className='hero-word-mask';word.className='hero-word';word.textContent=part;word.style.setProperty('--word',order++);mask.append(word);fragment.append(mask);
   }
   node.replaceWith(fragment);
  }
 }
 heroRoot.querySelectorAll('.disciplines li').forEach((tag,i)=>tag.style.setProperty('--tag',i));
 // The non-interactive copy travels inside the existing mask as it closes.
 const copyLayer=document.createElement('div');copyLayer.className='hero hero-copy-layer';copyLayer.setAttribute('aria-hidden','true');copyLayer.inert=true;copyLayer.hidden=true;
 for(const element of heroCopy){
  if(getComputedStyle(element).display==='none')continue;
  const clone=element.cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('style');clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));copyLayer.append(clone);
 }
 greenSurface.append(copyLayer);
 let pointerFrame=0,pointer;
 heroRoot.addEventListener('pointermove',event=>{
  if(!pointerAmbient||event.pointerType==='touch'||reduced.matches||!finePointer.matches||getProgress()>0)return;
  pointer={x:event.clientX,y:event.clientY};
  if(pointerFrame)return;
  pointerFrame=requestAnimationFrame(()=>{
   pointerFrame=0;const rect=heroRoot.getBoundingClientRect(),x=pointer.x-rect.left,y=pointer.y-rect.top;
   greenSurface.style.setProperty('--pointer-x',x+'px');greenSurface.style.setProperty('--pointer-y',y+'px');
   greenSurface.style.setProperty('--dot-x',((x/rect.width-.5)*9)+'px');greenSurface.style.setProperty('--dot-y',((y/rect.height-.5)*9)+'px');
   greenSurface.classList.add('is-pointer-active');
  });
 },{passive:true});
 heroRoot.addEventListener('pointerleave',()=>{
  cancelAnimationFrame(pointerFrame);pointerFrame=0;greenSurface.classList.remove('is-pointer-active');greenSurface.style.setProperty('--dot-x','0px');greenSurface.style.setProperty('--dot-y','0px');
 });
 return {copyLayer};
}
