const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const previews = [...document.querySelectorAll('.work-preview')].filter(preview => !preview.closest('.handoff-final-frame'));
const visibility = new Map();
const visibilityObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    visibility.set(entry.target, entry.isIntersecting);
    syncPreview(entry.target);
  }
}, {threshold: 0});

function syncPreview(preview) {
  preview.classList.toggle('is-preview-engaged', preview.dataset.engaged === 'true' && !document.hidden);
  const active = preview.dataset.engaged === 'true' && finePointer.matches && !reduced.matches && !document.hidden && visibility.get(preview) !== false;
  preview.classList.toggle('is-preview-active', active);
}

for (const preview of previews) {
  const card = preview.closest('.project-card,.archive-card') || preview;
  const track = preview.querySelector('.work-preview-track');
  const measure = () => preview.style.setProperty('--pan-distance', `${track ? Math.max(0, track.scrollHeight - preview.clientHeight) : 0}px`);
  const sizeObserver = new ResizeObserver(measure);
  sizeObserver.observe(preview);
  if (track) sizeObserver.observe(track);
  for (const image of track?.querySelectorAll('img') || []) image.addEventListener('load', measure);
  let hovered = false, keyboardFocused = false;
  const engage = value => { preview.dataset.engaged = String(value); syncPreview(preview); };
  card.addEventListener('pointerenter', event => {if (event.pointerType !== 'touch') {hovered = true; engage(true);}});
  card.addEventListener('pointerleave', () => {hovered = false; engage(keyboardFocused);});
  card.addEventListener('focusin', event => {keyboardFocused = event.target.matches(':focus-visible'); engage(hovered || keyboardFocused);});
  card.addEventListener('focusout', event => {if (!card.contains(event.relatedTarget)) {keyboardFocused = false; engage(hovered);}});
  card.addEventListener('pointermove', event => {
    const rect = preview.getBoundingClientRect();
    preview.style.setProperty('--view-x', `${Math.max(40, Math.min(rect.width - 40, event.clientX - rect.left))}px`);
    preview.style.setProperty('--view-y', `${Math.max(22, Math.min(rect.height - 22, event.clientY - rect.top))}px`);
  });
  visibilityObserver.observe(preview);
  measure();
}
const refreshPreviews = () => previews.forEach(syncPreview);
document.addEventListener('visibilitychange', refreshPreviews);
reduced.addEventListener('change', refreshPreviews);
finePointer.addEventListener('change', refreshPreviews);
