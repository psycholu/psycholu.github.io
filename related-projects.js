const projects=[
  ['reah.html','Reah brand identity','./assets/reah/cover.webp'],
  ['motion.html','Motion videos & animated posters','./assets/motion/01-2016792241185210368.webp'],
  ['genesis-nft.html','Genesis NFT design','./assets/genesis-nft/banner.webp'],
  ['drago.html','DraGo','./assets/drago/00-1.webp'],
  ['safeis.html','SAFEIS','./assets/safeis/00-1.webp'],
  ['safeis-spear.html','SAFEIS Spear · UX','./assets/safeis-spear/00.webp'],
  ['tencent-sports.html','Tencent Sports 7.0','./assets/tencent-sports/00-1.webp'],
  ['tencent-stats.html','Tencent Sports · Stats UI','./assets/tencent-stats/module-00-1.webp'],
  ['tencent-badges.html','Tencent Sports · Growth badges','./assets/tencent-badges/03.webp']
];
const current=location.pathname.split('/').pop();
const strip=document.createElement('nav');
strip.className='related-projects';strip.setAttribute('aria-label','Other projects');
for(const [path,name,cover] of projects){
  if(path===current)continue;
  const link=document.createElement('a');link.className='related-project';link.href='./'+path;link.setAttribute('aria-label','View '+name);
  const img=document.createElement('img');img.src=cover;img.alt=name;img.loading='lazy';img.width=640;img.height=360;
  const label=document.createElement('span');label.textContent=name;
  link.append(img,label);strip.append(link);
}
const footer=document.querySelector('footer');
if(footer)footer.before(strip);else document.querySelector('main').append(strip);
