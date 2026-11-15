(() => {
  const dialog = document.querySelector('#listing-story');
  const trigger = document.querySelector('.listing-trigger');
  const scroller = dialog.querySelector('.listing-scroll');
  const stage = dialog.querySelector('.listing-stage');
  const atmosphere = dialog.querySelector('.listing-atmosphere');
  const table = dialog.querySelector('.listing-table');
  const card = dialog.querySelector('.listing-card');
  const capture = dialog.querySelector('.listing-capture');
  const flash = dialog.querySelector('.listing-flash');
  const slider = dialog.querySelector('input');
  const next = dialog.querySelector('.listing-action');
  const headline = dialog.querySelector('.listing-guide h3');
  const description = dialog.querySelector('.listing-guide p');
  const fields = [...card.querySelectorAll('[data-arrival]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [
    { at: 0, title: 'Ein Buch kann weiter.', copy: 'Scrolle oder wische, um zu sehen, wie du ein Buch einstellst.' },
    { at: .16, title: 'Mach ein Foto vom Buch.', copy: 'Zeig das Cover und fotografiere sichtbare Gebrauchsspuren.' },
    { at: .37, title: 'Sag, was du anbietest.', copy: 'Trag den Titel ein und beschreib den Zustand.' },
    { at: .61, title: 'Leg den Preis fest.', copy: 'Ergänze, wo das Buch abgeholt werden kann.' },
    { at: .77, title: 'Die Anzeige ist fertig.', copy: 'Prüfe deine Angaben, bevor du deine Anzeige veröffentlichst.' },
    { at: .925, title: 'Dein Buch im Marktplatz.', copy: 'Andere können dein Angebot entdecken und eine Kaufanfrage senden.' }
  ];
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (from, to, fraction) => from + (to - from) * fraction;
  function ease(value, start, end) {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  }

  let frame = 0;
  let current = -1;
  let layout;
  const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;

  function measure() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const cardX = card.offsetLeft - card.offsetWidth / 2;
    const cardY = card.offsetTop - card.offsetHeight / 2;
    const preview = card.querySelector('.listing-photo');
    const flyTarget = [...document.querySelectorAll('.vx__win, .gate__frame')]
      .map(node => node.getBoundingClientRect())
      .find(rect => rect.width > 80 && rect.height > 70 && rect.bottom > 0 && rect.top < height);

    layout = {
      width, height, cardX, cardY,
      photoWidth: preview.offsetWidth,
      photoHeight: preview.offsetHeight,
      cardCenterY: card.offsetTop,
      targetX: flyTarget ? flyTarget.left + flyTarget.width / 2 : width * .55,
      targetY: flyTarget ? flyTarget.top + flyTarget.height / 2 : height * .43,
      targetScale: flyTarget ? Math.min(.38, flyTarget.width / card.offsetWidth * .64) : .19
    };
  }

  function render() {
    frame = 0;
    if (!dialog.open) return;
    const progress = clamp(scroller.scrollTop / Math.max(1, maxScroll()));
    const motion = !reduce.matches;
    const approach = ease(progress, 0, .26);
    const photo = ease(progress, .22, .45);
    const depart = ease(progress, .865, .972);
    const { width, height, cardX, cardY, photoWidth, photoHeight, cardCenterY, targetX, targetY, targetScale } = layout;

    table.style.transform = motion
      ? `translateY(${mix(-4, 3, approach)}%) rotate(${mix(-7, 0, approach)}deg) scale(${mix(1.02, 1.28, approach)})` : '';
    table.style.opacity = 1 - ease(progress, .23, .41);
    atmosphere.style.opacity = 1 - ease(progress, .9, 1);
    stage.style.setProperty('--mask', 1 - depart);
    flash.style.opacity = motion
      ? ease(progress, .198, .215) * (1 - ease(progress, .215, .265)) * .34 : 0;

    // The camera crop lands exactly on the photo already sitting in the card.
    capture.style.opacity = ease(progress, .2, .245) * (1 - ease(progress, .431, .45));
    const captureWidth = mix(Math.min(width * .75, height * .70), photoWidth, photo);
    const captureHeight = mix(height * .64, photoHeight, photo);
    const captureX = mix((width - captureWidth) / 2, cardX + 1, photo);
    const captureY = mix(height * .11, cardY + 1, photo);
    capture.style.width = `${captureWidth}px`;
    capture.style.height = `${captureHeight}px`;
    capture.style.transform = `translate3d(${captureX}px, ${captureY}px, 0)`;

    const x = (targetX - width / 2) * depart + Math.sin(depart * Math.PI) * width * .13;
    const y = (targetY - cardCenterY) * depart - Math.sin(depart * Math.PI) * height * .09;
    card.style.transform = motion
      ? `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotateY(${-39 * depart}deg) rotateZ(${-6 * Math.sin(depart * Math.PI)}deg) scale(${mix(1, targetScale, depart)})`
      : 'translate(-50%, -50%)';
    card.style.opacity = ease(progress, .29, .425) * (1 - ease(progress, .978, 1));
    fields.forEach(field => {
      const at = Number(field.dataset.arrival);
      const enter = ease(progress, at, at + .08);
      field.style.opacity = enter;
      field.style.transform = motion ? `translateY(${16 * (1 - enter)}px)` : '';
    });

    const chapter = chapters.findLastIndex(item => progress + .002 >= item.at);
    if (chapter !== current) {
      current = chapter;
      headline.textContent = chapters[chapter].title;
      description.textContent = chapters[chapter].copy;
    }
    next.textContent = progress >= .998 ? 'Fertig' : current === chapters.length - 1 ? 'Zum Gang ↓' : 'Weiter ↓';
    slider.value = Math.round(progress * 1000);
  }

  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function seek(progress, smooth = false) {
    scroller.scrollTo({
      top: maxScroll() * progress,
      behavior: smooth && !reduce.matches ? 'smooth' : 'instant'
    });
    requestRender();
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    dialog.showModal();
    scroller.scrollTop = 0;
    measure();
    render();
    scroller.focus({ preventScroll: true });
  });

  scroller.addEventListener('scroll', requestRender, { passive: true });
  dialog.addEventListener('wheel', event => {
    event.stopPropagation();
    if (scroller.contains(event.target)) return;
    event.preventDefault();
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    scroller.scrollTop += event.deltaY * units;
  }, { passive: false, capture: true });

  slider.addEventListener('input', () => seek(Number(slider.value) / 1000));
  next.addEventListener('click', () => {
    if (Number(slider.value) >= 998) dialog.close();
    else if (current === chapters.length - 1) seek(1, true);
    else seek(chapters[current + 1].at + .005, true);
  });
  dialog.querySelector('.listing-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
  addEventListener('resize', () => {
    if (dialog.open) { measure(); requestRender(); }
  });
  reduce.addEventListener('change', requestRender);
})();
