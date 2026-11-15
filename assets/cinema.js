(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const media = 'media/seemarkt/';
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x*x*x*(x*(x*6-15)+10); };
  const span = (t,a,b) => smooth((t-a)/(b-a));
  const visible = (t,a,b,c,d) => span(t,a,b)*(1-span(t,c,d));
  const brand = '<div class="cine-brand"><img src="'+media+'logo.png" alt="">SeeMarkt</div>';
  const top = '<div class="cine-top">'+brand+'<span class="cine-example">Beispiel Ansicht</span></div>';
  const dialog = document.createElement('dialog');
  dialog.className = 'cinema';
  dialog.setAttribute('aria-label','SeeMarkt Kamerafahrt');
  dialog.innerHTML = '<div class="cinema-wash"></div><div class="cinema-viewport"><div class="cinema-rig"><div class="cinema-world"></div></div></div><div class="cine-return"><img alt="SeeMarkt Beispielansicht"></div><div class="cinema-caption"><small></small><h2></h2><p></p></div><div class="cinema-controls"><button type="button" data-pause>Pause</button><input type="range" min="0" max="1000" value="0" aria-label="Fortschritt der Kamerafahrt"><span class="cinema-count"></span></div>';
  document.body.append(dialog);
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'cinema-skip';
  skip.setAttribute('aria-label', 'Kamerafahrt überspringen');
  skip.title = 'Kamerafahrt überspringen';
  skip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  dialog.append(skip);
  const world = dialog.querySelector('.cinema-world');
  const handoverFilm = document.createElement('div');
  handoverFilm.className = 'handover-film';
  handoverFilm.setAttribute('aria-hidden', 'true');
  handoverFilm.hidden = true;
  dialog.querySelector('.cinema-viewport').prepend(handoverFilm);
  const handoverShots = [
    { file: 'school', start: 5, end: 9.6, x: -3, y: 1, zoom: .14 },
    { file: 'meeting', start: 9.6, end: 12.8, x: 2, y: -1, zoom: .10 },
    { file: 'book', start: 12.8, end: 15.8, x: 1, y: -1, zoom: .12 },
    { file: 'received', start: 15.8, end: 20.5, x: -2, y: 1, zoom: -.09 }
  ];
  const shotImages = handoverShots.map(shot => {
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.dataset.src = media + 'handover-' + shot.file + '.webp';
    handoverFilm.append(img);
    return img;
  });
  const shotGrade = document.createElement('div');
  shotGrade.className = 'handover-grade';
  handoverFilm.append(shotGrade);
  let previousShot = -1;
  const rig = dialog.querySelector('.cinema-rig');
  const portal = dialog.querySelector('.cine-return');
  const caption = dialog.querySelector('.cinema-caption');
  const slider = dialog.querySelector('input');
  const pause = dialog.querySelector('[data-pause]');
  const seen = new Set();
  let active = null, clock = 0, last = 0, frame = 0, playing = false;
  let sourceRect = null, focusBefore = null, chapter = -1;

  function purchase() {
    world.innerHTML = '<div class="cine-panel purchase-list"><img class="cine-original" src="'+media+'gui-3.webp" alt="Anzeige Mathematik 10"><div class="cine-request">Kaufanfrage senden →</div><div class="cine-halo"></div><span class="cine-example" style="position:absolute;left:25px;bottom:20px">Beispiel Ansicht</span></div>'+
    '<div class="cine-panel purchase-seller">'+top+'<div class="cine-content"><div class="cine-eyebrow">Verkäuferansicht · Anfragen</div><h3>Jemand möchte dein Buch.</h3><div class="cine-row"><div class="cine-avatar">M</div><div>Mathematik 10 – Gymnasium<div class="cine-muted">12,00 € · Abholung an der Schule</div></div></div><div class="cine-status"><i></i><span>Anfrage erhalten</span></div><p class="cine-muted">Du entscheidest, ob du die Kaufanfrage annimmst.</p><div class="cine-action">Anfrage annehmen ✓</div><div class="cine-status accepted"><i></i>Anfrage angenommen · Chat verfügbar</div></div></div>'+
    '<div class="cine-panel purchase-chat">'+top+'<div class="cine-content"><div class="cine-eyebrow">Gespräch zum Artikel</div><h3>Mathematik 10 – Gymnasium</h3><div class="cine-steps"><span>✓ Anfrage</span><span>✓ Angenommen</span><span>▦ Termin</span><span>◇ Übergabe</span></div><div class="cine-bubble first">Hallo! Passt dir morgen die große Pause?</div><div class="cine-bubble out second">Ja, gerne. Treffen wir uns am Schuleingang?</div><div class="cine-input">Deine Nachricht … <span>▦ Termin &nbsp; Senden ↗</span></div></div></div><div class="cine-packet"></div>';
  }
  function handover() {
    shotImages.forEach(img => {
      if (!img.hasAttribute('src')) img.src = img.dataset.src;
    });
    world.innerHTML='<div class="cine-panel handover-chat">'+top+'<div class="cine-content"><div class="cine-eyebrow">Chat · Termin vorschlagen</div><h3>Ein Treffpunkt. Ein neues Kapitel.</h3><div class="cine-row"><div class="cine-avatar">▦</div><div>Terminvorschlag<div class="cine-muted">Morgen · 10:00 Uhr · Schuleingang</div></div></div><div class="cine-bubble out">Passt. Bis morgen!</div><div class="cine-status"><i></i>Termin vereinbart</div><p class="cine-muted">Vereinbart Zeit und Treffpunkt im Chat.</p></div></div>'+
    '<div class="handover-receipt"><b>✓</b><h3>Übergabe bestätigen.</h3><p>Prüft den Artikel und bestätigt die Übergabe anschließend in SeeMarkt.</p><span class="cine-example">Beispiel Ansicht</span></div>';
  }
  function renderHandover(t) {
    const travel = span(t, 4.6, 7.3);
    const receipt = span(t, 18.3, 20.6);
    const filmOpacity = travel * (1 - span(t, 19, 22.1));
    handoverFilm.hidden = filmOpacity === 0;
    handoverFilm.style.opacity = filmOpacity;
    handoverFilm.style.setProperty('--receipt', receipt);
    const shotIndex = handoverShots.findLastIndex(shot => t >= shot.start);
    if (shotIndex !== previousShot) {
      const src = shotImages[Math.max(0, shotIndex)].src;
      handoverFilm.style.setProperty('--handover-bg', `url("${src}")`);
      previousShot = shotIndex;
    }
    shotImages.forEach((img, index) => {
      img.style.visibility = index === shotIndex ? 'visible' : 'hidden';
      if (index !== shotIndex) return;
      const shot = handoverShots[index];
      const progress = clamp((t - shot.start) / (shot.end - shot.start));
      const distance = motion.matches ? 0 : progress;
      const zoom = (shot.zoom < 0 ? 1.16 : 1.06) + shot.zoom * distance;
      img.style.transform = `translate(${shot.x * distance}%, ${shot.y * distance}%) scale(${zoom})`;
    });
    set(world, 'none');
    set(q('.handover-chat'),
      `translate3d(0,${-170 * travel}px,${370 * travel}px) rotateX(${10 * travel}deg)`,
      1 - span(t, 5.15, 7.1));
    set(q('.handover-receipt'),
      `translate3d(0,${35 * (1 - receipt)}px,${100 * receipt - 90 * span(t, 22, 24)}px)`,
      receipt * (1 - span(t, 22.5, 24)));
  }
  const stories = {
    purchase:{duration:29000,poster:'gui-3.webp',build:purchase,captions:[
      [0,'01 / ENTDECKEN','Aus einer Anzeige wird ein Gespräch.','Prüfe Zustand, Preis und Abholung.'],
      [5,'02 / ANFRAGEN','Dein Interesse kommt an.','Mit der Kaufanfrage kontaktierst du die verkaufende Person.'],
      [11,'03 / ANNEHMEN','Jetzt entscheidet die andere Seite.','Erst nach der Annahme geht es in den gemeinsamen Chat.'],
      [17,'04 / ABSPRECHEN','Von der Anfrage zum Gespräch.','Vereinbart hier Termin und Treffpunkt.'],
      [25,'WEITER IM GANG','Ein Schritt weiter.','Die Kamera kehrt zur Anzeige zurück. Danach folgt der nächste Bildschirm.']
    ]},
    handover:{duration:26000,poster:'gui-5.webp',build:handover,captions:[
      [0,'01 / VEREINBAREN','Ihr habt einen Termin.','Zeit und Treffpunkt legt ihr gemeinsam im Chat fest.'],
      [6,'02 / TREFFEN','Aus dem Chat wird ein Treffen.','Zum Beispiel am Eingang eurer Schule.'],
      [12,'03 / WEITERGEBEN','Wissen wechselt die Hände.','Prüft das Buch gemeinsam bei der persönlichen Übergabe.'],
      [18,'04 / BESTÄTIGEN','Ein neues Kapitel beginnt.','Bestätigt die erfolgte Übergabe auf SeeMarkt.'],
      [23,'WEITER IM GANG','Zurück zu SeeMarkt.','Die Reise geht weiter.']
    ]}
  };
  function set(el,transform,opacity=1) { if(!el)return;el.style.transform=transform;el.style.opacity=clamp(opacity); }
  const q = s=>world.querySelector(s);
  function render() {
    if(!active)return;
    const story=stories[active.type],t=clock/1000,end=story.duration/1000;
    const enter=span(t,0,2.8),out=span(t,end-3,end);
    const scale=Math.min(innerWidth/1180,innerHeight/1100,.95);
    rig.style.transform='scale('+scale+')';
    dialog.style.setProperty('--wash',Math.min(enter*1.35,1)*(1-out));
    const cx=sourceRect.left+sourceRect.width/2-innerWidth/2,cy=sourceRect.top+sourceRect.height/2-innerHeight/2;
    const fromScale=Math.max(.05,sourceRect.width/1000);
    const lens=enter*(1-out);
    set(portal,`translate3d(${cx*(1-lens)}px,${cy*(1-lens)}px,0) scale(${fromScale+(scale*1.15-fromScale)*lens})`,(1-span(t,1.5,3.3))+span(t,end-3,end-1.1));
    rig.style.opacity=visible(t,1.5,3.3,end-3,end-1);
    if(active.type==='purchase') {
      const move=span(t,7,12),chat=span(t,15,19),back=span(t,24,27);
      set(world,`translate3d(${-1100*move+1100*chat}px,${-16*Math.sin(t*.25)}px,${-120*Math.sin(move*Math.PI)-160*Math.sin(chat*Math.PI)}px) rotateY(${12*Math.sin(move*Math.PI)-10*Math.sin(chat*Math.PI)}deg)`);
      set(q('.purchase-list'),`rotateY(${-18*move}deg) scale(${1+.1*span(t,2,6)})`,1-span(t,9,12));
      set(q('.purchase-seller'),'translate3d(1100px,0,-30px) rotateY(-2deg)',visible(t,7,10,17,20));
      set(q('.purchase-chat'),'translate3d(0,0,0)',span(t,16,19)*(1-back*.4));
      set(q('.cine-halo'),`scale(${.3+span(t,4.5,6.8)*2})`,visible(t,4.5,5,6.1,7));
      q('.cine-request').textContent=t>6?'✓ Kaufanfrage gesendet':'Kaufanfrage senden →';
      const fly=span(t,6.2,11);
      set(q('.cine-packet'),`translate3d(${1100*fly}px,${-130*Math.sin(fly*Math.PI)}px,${240*Math.sin(fly*Math.PI)}px) rotateY(${fly*360}deg) rotateZ(${-12*Math.sin(fly*Math.PI)}deg) scale(${1-.55*fly})`,visible(t,6,6.5,10.7,11.4));
      set(q('.accepted'),'translateY('+(20*(1-span(t,13,14)))+'px)',span(t,13,14));
      q('.purchase-seller .cine-action').textContent=t>13?'✓ Angenommen':'Anfrage annehmen ✓';
      set(q('.first'),'translateY('+(25*(1-span(t,19,20.5)))+'px)',span(t,19,20.5));
      set(q('.second'),'translateY('+(25*(1-span(t,21,22.5)))+'px)',span(t,21,22.5));
    } else {
      renderHandover(t);
    }
    let ci=0;story.captions.forEach((c,i)=>{if(t>=c[0])ci=i;});
    if(ci!==chapter){chapter=ci;const c=story.captions[ci];caption.querySelector('small').textContent=c[1];caption.querySelector('h2').textContent=c[2];caption.querySelector('p').textContent=c[3];}
    caption.style.opacity=visible(t,.7,2,end-1,end);
    slider.value=Math.round(clock/story.duration*1000);
    dialog.querySelector('.cinema-count').textContent=Math.floor(t)+' / '+Math.round(end)+'s';
  }
  function tick(now){if(!active||!playing)return;if(last&&!document.hidden)clock+=Math.min(now-last,250);last=now;clock=Math.min(clock,stories[active.type].duration);render();if(clock>=stories[active.type].duration){finish();return;}frame=requestAnimationFrame(tick);}
  function play(value){playing=value;pause.textContent=value?'Pause':'Abspielen';last=0;cancelAnimationFrame(frame);if(value)frame=requestAnimationFrame(tick);}
  function finish(){
    if(!active)return;const done=active;active=null;play(false);dialog.close();handoverFilm.hidden=true;hero.cinemaHold=false;hero.cinemaControl?.lock(false);
    if(done.fromTunnel&&done.next!==undefined)hero.cinemaControl?.go(done.next);
    focusBefore?.focus({preventScroll:true});
  }
  function start(type,options={}) {
    if(active)return;focusBefore=document.activeElement;active={type,...options};clock=0;last=0;chapter=-1;
    const source=options.source||document.querySelector('.vx__win')||document.querySelector('.gate__frame');
    const rect=source?.getBoundingClientRect();sourceRect=rect&&rect.width>100&&rect.height>100?rect:{left:innerWidth*.19,top:innerHeight*.25,width:innerWidth*.62,height:innerWidth*.3875};
    if(options.fromTunnel){hero.cinemaHold=true;hero.cinemaControl?.lock(true);}
    stories[type].build();
    portal.replaceChildren();
    portal.setAttribute('aria-hidden','true');portal.inert=true;
    const img = new Image();
    img.src = media + stories[type].poster;
    img.alt = '';
    portal.append(img);
    dialog.showModal();if(motion.matches){clock=4000;render();play(false);}else{render();play(true);}pause.focus({preventScroll:true});
  }
  skip.addEventListener('click', finish);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });
  pause.addEventListener('click', () => play(!playing));
  slider.addEventListener('input',()=>{play(false);clock=Number(slider.value)/1000*stories[active.type].duration;render();});
  dialog.addEventListener('keydown',e=>{if(e.key===' '&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='INPUT'){e.preventDefault();play(!playing);}});
  ['wheel','touchmove'].forEach(event=>dialog.addEventListener(event,e=>e.stopPropagation(),{passive:true}));
  addEventListener('resize',render);document.addEventListener('visibilitychange',()=>{last=0;});
  // The tunnel supplies its continuous camera position, not a guessed scroll offset.
  hero.addEventListener('cinema-position',event=>{
    if(motion.matches||active||document.querySelector('dialog[open]')||document.documentElement.classList.contains('is-full'))return;
    const x=event.detail;
    for(const [index,type] of [[2,'purchase'],[4,'handover']]){
      if(x>=index-.045&&x<=index+.12&&!seen.has(type)){
        seen.add(type);hero.cinemaControl?.go(index,true);start(type,{fromTunnel:true,next:index+1});break;
      }
    }
  });
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[data-kind="film"]');if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const slug=link.dataset.slug;const type=slug==='seemarkt-anleitung-3'?'purchase':slug==='seemarkt-anleitung-5'?'handover':null;
    if(!type)return;e.preventDefault();e.stopImmediatePropagation();start(type,{source:link.closest('.make__win,.make__mw')||undefined});
  },true);
})();
