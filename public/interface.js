(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Keep map accessibility independent of the optional animation libraries.
  const syncLeafletMotion = () => {
    if (!document.body.classList.contains('region')) return;
    try {
      if (typeof map === 'undefined' || !map.options) return;
      const allowed = !reduced.matches;
      map.options.zoomAnimation = allowed;
      map.options.fadeAnimation = allowed;
      map.options.markerZoomAnimation = allowed;
      map.options.inertia = allowed;
      if (reduced.matches) map.stop();
    } catch (error) {
      // A failed Leaflet download must not prevent the rest of the page loading.
      if (!(error instanceof ReferenceError)) throw error;
    }
  };
  reduced.addEventListener('change', syncLeafletMotion);
  syncLeafletMotion();

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();
  let hasEntered = reduced.matches;
  media.add({
    motion: '(prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 760px)'
  }, context => {
    if (!context.conditions.motion) return;
    const mobile = context.conditions.mobile;
    const ease = 'power3.out';
    const targets = new Set();
    const updates = new Map();
    const reveals = new Map();
    const observers = [];
    let opening;
    let eagle;
    let eagleFlight;
    let introTimeout;
    let eagleRan = false;
    const select = selector => [...document.querySelectorAll(selector)];
    const track = elements => elements.forEach(element => targets.add(element));

    const finish = element => {
      reveals.get(element)?.scrollTrigger?.kill();
      gsap.killTweensOf(element);
      gsap.set(element, {clearProps:'opacity,transform'});
      element.classList.remove('motion-entering');
      updates.delete(element);
    };
    const focused = element => element.contains(document.activeElement);

    const enter = (timeline, selector, position, options = {}) => {
      const elements = select(selector).filter(element => !focused(element));
      if (!elements.length) return;
      track(elements);
      elements.forEach(element => element.classList.add('motion-entering'));
      timeline.from(elements, {
        opacity:0, y:mobile ? 10 : 18, duration:mobile ? 0.38 : 0.52,
        ease, clearProps:'opacity,transform',
        onComplete:() => elements.forEach(element => element.classList.remove('motion-entering')),
        ...options
      }, position);
    };

    const finishEagle = () => {
      clearTimeout(introTimeout);
      eagleFlight?.kill();
      eagle?.remove();
      if (eagleRan) opening?.progress(1);
    };
    const eagleIntro = () => {
      try {
        const key = 'fire-harmonizer:eagle-intro:v1';
        if (sessionStorage.getItem(key)) return 0;
        // If storage is unavailable, keep the existing entrance without an intro.
        sessionStorage.setItem(key, 'seen');
        eagle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        eagle.setAttribute('viewBox', '0 0 220 125');
        eagle.setAttribute('class', 'eagle-intro');
        eagle.setAttribute('aria-hidden', 'true');
        eagle.setAttribute('focusable', 'false');
        const fallback = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        [
          'M103 78C83 69 63 58 45 41L13 9Q12 4 17 6L45 29L27 4Q27 0 32 3L59 32L47 4Q48 0 53 4L76 39L69 12Q70 8 74 13L92 47L91 28Q94 25 96 31L108 61L127 74Z',
          'M113 78C97 80 79 81 63 77L40 65Q36 64 39 68L57 86L30 78Q26 79 30 83L57 99L39 96Q36 98 41 101L76 113Q90 113 111 97L141 86Z',
          'M55 84L20 93L39 97L21 103L48 102L67 99C91 100 111 98 133 91C146 87 154 79 162 77L176 79L184 75L187 68L178 58L166 55L155 63L145 70C132 73 118 70 106 69L88 73Z',
          'M179 63L195 68Q201 71 196 80L191 75L184 74L185 68Z'
        ].forEach((outline, index) => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', outline);
          if (index === 3) path.setAttribute('fill', 'var(--series-viirs)');
          fallback.appendChild(path);
        });
        eagle.appendChild(fallback);
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', 'falcon-intro-mask');
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('x', '0');
        mask.setAttribute('y', '0');
        mask.setAttribute('width', '640');
        mask.setAttribute('height', '480');
        mask.style.maskType = 'alpha';
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('width', '640');
        image.setAttribute('height', '480');
        image.setAttribute('transform', 'translate(640 0) scale(-1 1)');
        const rendered = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rendered.setAttribute('width', '640');
        rendered.setAttribute('height', '480');
        rendered.setAttribute('mask', 'url(#falcon-intro-mask)');
        rendered.setAttribute('visibility', 'hidden');
        image.addEventListener('load', () => {
          if (!eagle.isConnected || reduced.matches) return;
          eagle.setAttribute('viewBox', '140 40 400 420');
          fallback.setAttribute('display', 'none');
          rendered.removeAttribute('visibility');
        }, {once:true});
        image.setAttribute('href', '/falcon-silhouette.png');
        mask.appendChild(image);
        defs.appendChild(mask);
        eagle.appendChild(defs);
        eagle.appendChild(rendered);
        document.body.appendChild(eagle);
        const width = eagle.getBoundingClientRect().width;
        const altitude = Math.min(innerHeight * 0.3, 230);
        eagleRan = true;
        eagleFlight = gsap.timeline({onComplete:() => eagle.remove()});
        eagleFlight.fromTo(eagle, {x:-width, y:altitude + 45, rotation:-5, opacity:0}, {
          x:innerWidth * 0.56, y:altitude, rotation:0, opacity:1,
          duration:mobile ? 0.65 : 0.8, ease:'power2.out'
        }).to(eagle, {
          x:innerWidth + width, y:altitude - 35, rotation:-3, opacity:0,
          duration:0.32, ease:'power2.in'
        });
        return mobile ? 0.57 : 0.72;
      } catch (error) {
        eagleFlight?.kill();
        eagle?.remove();
        eagleRan = false;
        return 0;
      }
    };

    if (!hasEntered) {
      opening = gsap.timeline();
      if (document.body.classList.contains('landing')) {
        opening.delay(eagleIntro());
        enter(opening, '.masthead', 0, {y:mobile ? -4 : -8, duration:0.4});
        enter(opening, '.landing h1', 0.08, {duration:mobile ? 0.45 : 0.6});
        enter(opening, '.landing .wrap > .sub', 0.16);
        enter(opening, '.tool-links .card', 0.22, {
          y:mobile ? 10 : 24, rotationX:mobile ? 0 : 4,
          transformPerspective:900, transformOrigin:'center bottom',
          stagger:mobile ? 0.05 : 0.08, duration:mobile ? 0.4 : 0.6
        });
        enter(opening, '.briefing', 0.32, {y:mobile ? 8 : 16, duration:0.5});
        enter(opening, '.sensor-mark i:first-child', 0.08, {x:-6, y:0, duration:0.5});
        enter(opening, '.sensor-mark i:last-child', 0.12, {x:6, y:0, duration:0.5});
      } else if (document.body.classList.contains('dashboard')) {
        enter(opening, '.dashboard .topnav, .dashboard h1', 0, {stagger:0.05});
        enter(opening, '.cal-head', 0.08);
        enter(opening, '.cal-cell[data-tier]', 0.12, {
          y:mobile ? 4 : 8, duration:0.32, stagger:{amount:0.22, from:'start'}
        });
        enter(opening, '.detail-top', 0.1);
        enter(opening, '.stat', 0.14, {duration:0.36, stagger:0.04});
        enter(opening, '.chart-box', 0.2, {duration:0.38, stagger:0.06});
      } else {
        enter(opening, '.region #panel > nav, .region #panel > h1, .region #panel > .sub, .region #bbox', 0, {
          duration:0.4, stagger:0.05, y:mobile ? 6 : 10
        });
      }
      hasEntered = true;
      if (eagleRan) {
        introTimeout = setTimeout(finishEagle, 1800);
        opening.eventCallback('onComplete', () => clearTimeout(introTimeout));
      }
    }

    select('.sat-box, .narrative').forEach(element => {
      if (element.getBoundingClientRect().top <= window.innerHeight || focused(element)) return;
      track([element]);
      const tween = gsap.from(element, {
        opacity:0, y:mobile ? 6 : 12, duration:0.45, ease,
        clearProps:'opacity,transform',
        scrollTrigger:{trigger:element, start:'top 94%', once:true}
      });
      reveals.set(element, tween);
    });

    const image = document.querySelector('.landing .shot-frame img');
    const briefing = document.querySelector('.landing .briefing');
    let depthTween;
    let resizeFrame;
    context.add('configureDepth', () => {
      if (!image || !briefing || mobile) return;
      if (ScrollTrigger.maxScroll(window) > 24) {
        if (!depthTween) {
          track([image]);
          depthTween = gsap.to(image, {
            y:-6, scale:1.06, ease:'none',
            scrollTrigger:{trigger:briefing, start:'top 85%', end:'bottom top', scrub:0.35, invalidateOnRefresh:true}
          });
        }
      } else if (depthTween) {
        depthTween.scrollTrigger.kill();
        depthTween.kill();
        gsap.set(image, {clearProps:'transform'});
        depthTween = null;
      }
    });
    context.configureDepth();

    // DOM observers only decorate completed renders; they never calculate data.
    context.add('settle', element => {
      if (focused(element)) { finish(element); return; }
      updates.get(element)?.kill();
      track([element]);
      const tween = gsap.fromTo(element, {opacity:0.78, y:mobile ? 3 : 6}, {
        opacity:1, y:0, duration:mobile ? 0.22 : 0.3, ease,
        overwrite:true, clearProps:'opacity,transform',
        onComplete:() => updates.delete(element)
      });
      updates.set(element, tween);
    });
    select('#barChart, #trendChart, #result').forEach(element => {
      const observer = new MutationObserver(() => context.settle(element));
      observer.observe(element, {childList:true, subtree:true, characterData:true});
      observers.push(observer);
    });

    const finishFocused = event => {
      if (eagleRan && opening?.progress() < 1) finishEagle();
      targets.forEach(element => {
        if (element.contains(event.target)) finish(element);
      });
    };
    document.addEventListener('focusin', finishFocused);
    if (eagleRan) document.addEventListener('pointerdown', finishEagle, {capture:true, once:true});
    const refresh = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        context.configureDepth();
      });
    };
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh, {once:true});

    return () => {
      clearTimeout(introTimeout);
      eagleFlight?.kill();
      eagle?.remove();
      document.removeEventListener('pointerdown', finishEagle, true);
      observers.forEach(observer => observer.disconnect());
      updates.forEach(tween => tween.kill());
      targets.forEach(element => element.classList.remove('motion-entering'));
      cancelAnimationFrame(resizeFrame);
      document.removeEventListener('focusin', finishFocused);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('load', refresh);
    };
  });
})();
