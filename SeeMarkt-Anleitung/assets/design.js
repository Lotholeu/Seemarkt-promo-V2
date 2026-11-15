const designRoot = document.documentElement;
const previewFrame = document.querySelector('.make__frame');
const canTrackPointer = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;

function paintPointerLight() {
  pointerFrame = 0;
  designRoot.style.setProperty('--sm-x', `${100 * pointerX / innerWidth}%`);
  designRoot.style.setProperty('--sm-y', `${100 * pointerY / innerHeight}%`);
}
addEventListener('pointermove', event => {
  if (!canTrackPointer.matches || event.pointerType === 'touch') return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointerLight);
}, {passive: true});

previewFrame?.addEventListener('pointermove', event => {
  if (!canTrackPointer.matches || event.pointerType === 'touch') return;
  const rect = previewFrame.getBoundingClientRect();
  previewFrame.style.setProperty('--sm-frame-x', `${100 * (event.clientX - rect.left) / rect.width}%`);
  previewFrame.style.setProperty('--sm-frame-y', `${100 * (event.clientY - rect.top) / rect.height}%`);
}, {passive: true});
