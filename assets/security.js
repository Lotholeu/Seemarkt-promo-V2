(() => {
  const dialog = document.querySelector('#security');
  const trigger = document.querySelector('.security-trigger');
  const slides = Array.from(dialog.querySelectorAll('.security-slide'));
  const stepButtons = Array.from(dialog.querySelectorAll('.security-step'));
  const playButton = dialog.querySelector('[data-security-play]');
  const previous = dialog.querySelector('[data-security-prev]');
  const next = dialog.querySelector('[data-security-next]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 10000;
  const entrance = 2050;
  let index = 0;
  let elapsed = 0;
  let remains = 0;
  let lastTime = 0;
  let frame = 0;
  let playing = false;

  function drawProgress() {
    stepButtons[index].style.setProperty('--fill', elapsed / duration);
  }

  function updateControls() {
    const ended = index === slides.length - 1 && elapsed >= duration;
    const label = playing ? 'Pausieren' : ended ? 'Erneut abspielen' : 'Abspielen';
    playButton.dataset.state = playing ? 'playing' : ended ? 'ended' : 'paused';
    playButton.setAttribute('aria-label', label);
    playButton.title = label;
  }

  function showSlide(target) {
    index = Math.max(0, Math.min(target, slides.length - 1));
    elapsed = 0;
    slides.forEach((slide, position) => { slide.hidden = position !== index; });
    stepButtons.forEach((button, position) => {
      if (position === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.style.setProperty('--fill', position < index ? 1 : 0);
    });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    updateControls();
  }

  function tick(now) {
    if (!playing || !dialog.open) return;
    const delta = lastTime ? now - lastTime : 0;
    lastTime = now;
    const wait = Math.min(remains, delta);
    remains -= wait;
    elapsed = Math.min(duration, elapsed + delta - wait);
    drawProgress();
    if (elapsed >= duration) {
      if (index < slides.length - 1) showSlide(index + 1);
      else {
        playing = false;
        updateControls();
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function setPlaying(active) {
    cancelAnimationFrame(frame);
    playing = active;
    lastTime = 0;
    updateControls();
    if (playing) frame = requestAnimationFrame(tick);
  }

  function navigate(target) {
    if (target < 0 || target >= slides.length) return;
    remains = 0;
    setPlaying(false);
    showSlide(target);
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    const bounds = trigger.getBoundingClientRect();
    dialog.style.setProperty('--security-origin-x', `${bounds.left + bounds.width / 2}px`);
    dialog.style.setProperty('--security-origin-y', `${bounds.top + bounds.height / 2}px`);
    remains = motion.matches ? 0 : entrance;
    showSlide(0);
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    setPlaying(!motion.matches);
  });
  dialog.querySelector('[data-security-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    setPlaying(false);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => navigate(index - 1));
  next.addEventListener('click', () => navigate(index + 1));
  stepButtons.forEach((button, position) => button.addEventListener('click', () => navigate(position)));
  playButton.addEventListener('click', () => {
    if (!playing && elapsed >= duration) showSlide(0);
    if (!playing) remains = 0;
    setPlaying(!playing);
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    navigate(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  dialog.addEventListener('wheel', event => event.stopPropagation());
})();
