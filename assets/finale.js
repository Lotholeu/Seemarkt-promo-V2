const scene = document.querySelector('.signature-story');
const logo = scene.querySelector('.signature-finale');
const light = scene.querySelector('.signature-atmosphere');
const mark = logo.querySelector('img');
const bridge = document.querySelector('.signature-bridge');
const fragmentsCanvas = bridge.querySelector('canvas');
const fragmentsContext = fragmentsCanvas.getContext('2d');
const tunnel = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * (3 - 2 * value);
const range = (value, start, end) => ease(clamp((value - start) / (end - start)));
let queued = false;
let fragments = [];

function sampleLogo() {
  const sample = document.createElement('canvas');
  sample.width = 22;
  sample.height = 26;
  const context = sample.getContext('2d', { willReadFrequently: true });
  context.drawImage(mark, 0, 0, sample.width, sample.height);
  let pixels;
  try {
    pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  } catch (error) {
    if (error.name === 'SecurityError') return;
    throw error;
  }
  fragments = [];
  for (let y = 0; y < sample.height; y++) {
    for (let x = 0; x < sample.width; x++) {
      const pixel = (y * sample.width + x) * 4;
      if (pixels[pixel + 3] < 95) continue;
      fragments.push({
        x: (x + .5) / sample.width - .5,
        y: (y + .5) / sample.height - .5,
        color: [pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]],
        seed: ((x * 41 + y * 137) % 211) / 211
      });
    }
  }
  scheduleFinale();
}

let pointOrigins = [];

function drawFragments(phase, center, markY) {
  if (!fragmentsContext || !fragments.length) return;
  const context = fragmentsContext;
  const width = innerWidth;
  const height = innerHeight;
  const density = Math.min(devicePixelRatio, 1.5);
  const pixelWidth = Math.round(width * density);
  const pixelHeight = Math.round(height * density);
  if (fragmentsCanvas.width !== pixelWidth || fragmentsCanvas.height !== pixelHeight) {
    fragmentsCanvas.width = pixelWidth;
    fragmentsCanvas.height = pixelHeight;
    pointOrigins = [];
  }
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, width, height);

  if (phase < .09 || pointOrigins.length === 0) pointOrigins = tunnel.finaleScreenPoints?.() || [];
  const fade = 1 - range(phase, .79, 1.13);
  if (!fade) return;

  const markScale = .7 + .3 * range(phase, .66, 1.11);
  const logoWidth = mark.offsetWidth * markScale;
  const logoHeight = mark.offsetHeight * markScale;
  const count = Math.min(pointOrigins.length, 1050);
  const step = pointOrigins.length / count;
  for (let index = 0; index < count; index++) {
    const origin = pointOrigins[Math.floor(index * step)];
    const fragment = fragments[(index * 173) % fragments.length];
    const seed = fragment.seed;
    const life = phase - origin.onset;
    const release = range(life, .04, .30);
    const gather = range(life, .15 + seed * .055, .79 + seed * .07);
    const tint = range(gather, .12, .97);
    const targetX = center + fragment.x * logoWidth;
    const targetY = markY + fragment.y * logoHeight;
    const curve = Math.sin(gather * Math.PI);
    const swing = curve * (.27 + seed * .31);
    const fromX = origin.x - targetX;
    const fromY = origin.y - targetY;
    const x = targetX + (fromX * Math.cos(swing) - fromY * Math.sin(swing)) * (1 - gather);
    const y = targetY + (fromX * Math.sin(swing) + fromY * Math.cos(swing)) * (1 - gather);
    const radius = .7 + seed * .65 + gather * .75;
    context.globalAlpha = release * fade * (.44 + seed * .26 + gather * .23);
    const channels = fragment.color.map((channel, index) => {
      const from = origin.color[index];
      return Math.round(from + (channel - from) * tint);
    });
    context.fillStyle = `rgb(${channels.join(',')})`;
    context.beginPath();
    if (curve > .12 && seed > .64) {
      context.ellipse(x, y, radius * (1 + curve * 2.4), radius * .68,
        Math.atan2(targetY - origin.y, targetX - origin.x), 0, Math.PI * 2);
    } else {
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawFinale() {
  queued = false;
  const height = innerHeight;
  const top = scene.getBoundingClientRect().top;
  const distance = Math.max(1, scene.offsetHeight - height);
  const phase = 1 - top / height;
  const progress = reduced.matches ? 1 : clamp(-top / distance);
  const reveal = reduced.matches ? 1 : range(phase, .66, 1.11);
  const departure = reduced.matches ? 0 : ease(clamp((progress - .83) / .17));
  mark.style.scale = reduced.matches ? '1' : String(.7 + .3 * reveal);
  const markCenterX = mark.offsetLeft + mark.offsetWidth / 2;
  const markCenterY = mark.offsetTop + mark.offsetHeight / 2;
  scene.style.setProperty('--signature-center-x', `${markCenterX}px`);
  scene.style.setProperty('--signature-center-y', `${markCenterY}px`);
  scene.classList.toggle('is-orbiting', !reduced.matches && phase > .29 && progress < 1);
  const markRect = mark.getBoundingClientRect();
  const renderParticles = !reduced.matches && phase > .005 && phase < 1.13;
  bridge.hidden = !renderParticles;
  if (renderParticles) drawFragments(phase, markRect.left + markRect.width / 2, markRect.top + markRect.height / 2);
  else pointOrigins = [];
  tunnel.style.setProperty('--tunnel-player-opacity', String(1 - range(phase, .005, .16)));
  const backgroundBlend = reduced.matches ? 1 : range(phase, .43, .98);
  scene.style.setProperty('--signature-background-opacity', String(backgroundBlend));
  logo.style.opacity = String(reveal * (1 - .65 * departure));
  const turn = clamp(phase / 1.02) * 32 + progress * 166;
  logo.style.setProperty('--ray-turn', `${turn * .68}deg`);
  light.style.setProperty('--reveal', String(range(phase, .51, 1.09)));
  const converge = ease(clamp(progress / .48));
  const crossing = clamp(1 - Math.abs(progress - .48) / .13);
  const signature = ease(clamp((progress - .46) / .24));
  light.style.setProperty('--orbit-turn', `${-40 + turn}deg`);
  light.style.setProperty('--orbit-spread', `${(1 - converge) * 62}deg`);
  light.style.setProperty('--orbit-scale', String(1.42 - converge * .42));
  scene.style.setProperty('--finale-light', String(reduced.matches ? 0 : crossing));
  logo.style.setProperty('--signature-flare', String(reduced.matches ? 0 : crossing));
  logo.style.setProperty('--signature-caption', String(signature));
  logo.style.setProperty('--signature-visibility', signature > 0 ? 'visible' : 'hidden');
  light.style.setProperty('--dust-turn', `${-turn * .77}deg`);
  light.style.setProperty('--dust-scale', String(.7 + progress * .3));
  light.style.setProperty('--pulse-alpha', String(reduced.matches ? 0 : crossing * .72));
  light.style.setProperty('--pulse-scale', String(.65 + clamp((progress - .36) / .28) * 1.6));
}

function scheduleFinale() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(drawFinale);
}

addEventListener('scroll', scheduleFinale, { passive: true });
addEventListener('resize', scheduleFinale);
reduced.addEventListener('change', scheduleFinale);
if (mark.complete && mark.naturalWidth) sampleLogo();
else mark.addEventListener('load', sampleLogo, { once: true });
drawFinale();

