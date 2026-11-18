/* Loading sweep for the homepage and the case-study pages (Reah and Motion have their own, in their page scripts).
   While a picture or video has not arrived yet, a soft light runs across its box so the empty space reads as
   loading, not as a blank or a still. It is drawn as the element's own background, so it shows only until the
   picture covers it, and only boxes on screen animate, so at most a few repaint at a time. */
(() => {
  const css = `
  .media-loading{background-color:rgba(128,128,128,.10);background-image:linear-gradient(100deg,rgba(255,255,255,0) 20%,rgba(255,255,255,.05) 35%,rgba(255,255,255,.17) 50%,rgba(255,255,255,.05) 65%,rgba(255,255,255,0) 80%);background-size:300% 100%;background-repeat:no-repeat;background-position:100% 0}
  .media-loading.media-loading-on{animation:media-loading-sweep 1.8s cubic-bezier(.4,0,.2,1) infinite}
  @keyframes media-loading-sweep{from{background-position:100% 0}to{background-position:0 0}}
  @media (prefers-reduced-motion:reduce){.media-loading.media-loading-on{animation:none}}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  // animate only what is on screen
  const onScreen = new IntersectionObserver(entries => {
    for (const e of entries) e.target.classList.toggle('media-loading-on', e.isIntersecting);
  });
  const done = el => {
    el.classList.remove('media-loading', 'media-loading-on');
    onScreen.unobserve(el);
  };
  const small = el => {
    const w = +el.getAttribute('width') || el.getBoundingClientRect().width;
    return w > 0 && w < 64; // logos and icons
  };
  const mark = el => {
    if (el.dataset.mediaLoading) return;
    el.dataset.mediaLoading = '1';
    if (small(el) || el.closest('.media-frame,.media-open')) return; // Reah / Motion galleries sweep their own frames
    if (el.tagName === 'IMG') {
      if (el.complete && el.naturalWidth) return;
      el.addEventListener('load', () => done(el), { once: true });
      el.addEventListener('error', () => done(el), { once: true });
    } else {
      if (el.poster || el.readyState >= 2) return;
      el.addEventListener('loadeddata', () => done(el), { once: true });
    }
    el.classList.add('media-loading');
    onScreen.observe(el);
  };
  const scan = root => root.querySelectorAll?.('img,video').forEach(mark);
  scan(document);
  new MutationObserver(list => {
    for (const m of list) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches('img,video')) mark(n); else scan(n);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
