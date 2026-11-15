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

    if (!hasEntered) {
      const opening = gsap.timeline();
      if (document.body.classList.contains('landing')) {
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
      targets.forEach(element => {
        if (element.contains(event.target)) finish(element);
      });
    };
    document.addEventListener('focusin', finishFocused);
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
