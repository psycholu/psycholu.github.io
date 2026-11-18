const videos = Array.from(document.querySelectorAll('.case-gallery video'));
const toggle = document.querySelector('#motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const genesis = document.body.classList.contains('genesis-case');
const visible = new Map();
const hasPlayed = new WeakSet();
let paused = reduced.matches;
let active = new Set();

function canPlay(video) {
  return !paused && !document.hidden && active.has(video);
}
function load(video) {
  if (video.getAttribute('src')) return;
  video.src = video.dataset.src;
  video.load();
}
function start(video) {
  load(video);
  if (!hasPlayed.has(video) && video.readyState >= 1 && video.currentTime !== 0) video.currentTime = 0;
  video.play().then(() => {
    if (!canPlay(video)) video.pause();
    video.parentElement.querySelector('.play-retry')?.remove();
  }).catch(error => {
    if (error.name === 'AbortError' || !canPlay(video)) return;
    if (video.parentElement.querySelector('.play-retry')) return;
    const button = document.createElement('button');
    button.className = 'play-retry';
    button.textContent = 'Play video ▷';
    button.addEventListener('click', () => start(video));
    video.parentElement.append(button);
  });
}
function update() {
  if (toggle) {
    toggle.textContent = paused ? 'Play animations ▷' : 'Pause animations Ⅱ';
    toggle.setAttribute('aria-pressed', String(paused));
  }
  const ranked = Array.from(visible).filter(([video, ratio]) => {
    const threshold = genesis ? Math.min(.5, innerHeight / Math.max(1, video.getBoundingClientRect().height) * .5) : .2;
    return ratio >= threshold;
  }).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([video]) => video);
  active = new Set(ranked);
  for (const video of videos) {
    if (canPlay(video)) {
      if (video.paused) start(video);
    } else video.pause();
  }
}
const prepare = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!reduced.matches) load(entry.target);
    prepare.unobserve(entry.target);
  }
}, { rootMargin: '300px' });
const playback = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
    else visible.delete(entry.target);
  }
  update();
}, { threshold: [0, .1, .2, .3, .4, .5, .75, 1] });
for (const video of videos) {
  // Preparation buffers metadata only, so the intro cannot play out offscreen.
  video.autoplay = false;
  video.removeAttribute('autoplay');
  video.preload = 'metadata';
  video.muted = true;
  video.defaultMuted = true;
  video.addEventListener('loadedmetadata', () => {
    if (!hasPlayed.has(video)) video.currentTime = 0;
    if (!canPlay(video)) video.pause();
  });
  video.addEventListener('playing', () => hasPlayed.add(video));
  prepare.observe(video);
  playback.observe(video);
}
toggle?.addEventListener('click', () => { paused = !paused; update(); });
document.addEventListener('visibilitychange', update);
update();
