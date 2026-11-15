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
        const key = 'fire-harmonizer:eagle-intro:falcon-v2';
        if (sessionStorage.getItem(key)) return 0;
        // If storage is unavailable, keep the existing entrance without an intro.
        sessionStorage.setItem(key, 'seen');
        eagle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        eagle.setAttribute('viewBox', '140 40 400 420');
        eagle.setAttribute('class', 'eagle-intro');
        eagle.setAttribute('aria-hidden', 'true');
        eagle.setAttribute('focusable', 'false');
        // Embed the model outline so the correct bird is present on the first frame.
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill-rule', 'evenodd');
        path.setAttribute('d', "M171 51.5L167.5 52L169.5 56L179 65.5L180 65.5L194.5 79L194 79.5L192 77.5L189 76.5L187 74.5L181 71.5L179 69.5L176 68.5L174 66.5L159 59.5L155 56.5L152 56.5L151 55.5L148 55.5L147 54.5L145.5 55L147.5 57L149.5 61L155 66.5L156 66.5L169 78.5L170 78.5L188.5 93L188 93.5L183 90.5L181 90.5L172 85.5L170 85.5L156 78.5L150 78.5L149 77.5L147.5 78L153 85.5L154 85.5L157 88.5L158 88.5L161 91.5L162 91.5L165 94.5L170 97.5L184.5 110L183 110.5L180 108.5L178 108.5L175 106.5L173 106.5L170 104.5L168 104.5L165 102.5L158 100.5L157.5 101L163 107.5L164 107.5L186.5 123L186 123.5L185 122.5L174 120.5L173 119.5L165 119.5L164.5 121L173 128.5L176 129.5L178 131.5L181 132.5L188 137.5L195 140.5L197 142.5L214.5 151L213 151.5L212 150.5L210 150.5L206 148.5L203 148.5L196 145.5L193 145.5L189 143.5L179.5 144L186 150.5L191 152.5L198 157.5L205 160.5L207 162.5L224 170.5L227.5 173L226 173.5L225 172.5L221 172.5L220 171.5L216 171.5L215 170.5L211 170.5L210 169.5L206 169.5L205 168.5L201 168.5L197.5 170L202 174.5L204 174.5L220 182.5L222 182.5L223 183.5L228 184.5L231 186.5L233 186.5L234 187.5L239.5 189L237 189.5L236 188.5L226 187.5L225 186.5L221 186.5L220 185.5L211 185.5L209.5 187L215 192.5L219 194.5L221 194.5L232 200.5L234 200.5L239.5 203L231 204.5L230 205.5L228 205.5L227.5 207L232 211.5L234 211.5L237 213.5L239 213.5L242 215.5L244 215.5L247 217.5L249 217.5L252 219.5L257 220.5L260 222.5L262 222.5L267.5 225L244 225.5L243 226.5L238 226.5L232.5 230L238 235.5L243 236.5L246 238.5L248 238.5L255 241.5L258 241.5L262 243.5L265 243.5L266 244.5L272 245.5L273 246.5L278.5 248L269 248.5L268 249.5L261 249.5L260 250.5L257 250.5L256 251.5L252 251.5L251 252.5L248 252.5L246 253.5L241.5 257L247 261.5L249 261.5L250 262.5L258 263.5L259 264.5L263 264.5L264 265.5L268 265.5L269 266.5L274 266.5L277.5 268L269 269.5L268 270.5L260 271.5L254 274.5L246 276.5L240.5 282L244 283.5L246 285.5L253 285.5L254 286.5L273.5 287L272 287.5L268.5 292L270.5 294L270 294.5L256 300.5L251.5 306L257 308.5L278 308.5L279 307.5L284 307.5L285 306.5L289 306.5L290 305.5L295 305.5L296 304.5L299 304.5L299 305.5L297 305.5L294 307.5L290 308.5L286.5 312L286.5 314L291 316.5L293 315.5L300 315.5L304 318.5L308.5 319L297 325.5L294.5 329L294.5 331L298 332.5L310 331.5L310.5 332L305.5 336L308.5 338L308.5 339L305.5 342L311 344.5L314 344.5L315 343.5L322 343.5L322.5 346L319.5 351L319.5 353L318.5 354L319 355.5L326 355.5L327 354.5L330 354.5L331 353.5L342 354.5L343 353.5L351 352.5L356 349.5L357.5 350L337 365.5L333 366.5L330 368.5L328 368.5L316 374.5L314 374.5L300 381.5L298 381.5L290 385.5L277 396.5L275 396.5L251 408.5L240 411.5L238 413.5L237 413.5L231 419.5L228 420.5L218 428.5L217 428.5L214.5 431L212.5 435L213 436.5L215.5 437L213.5 442L219 443.5L220.5 446L219.5 448L220 448.5L222 448.5L223 449.5L227 449.5L239 444.5L239.5 445L238 446.5L233 449.5L229.5 453L231 453.5L235 450.5L235.5 451L234.5 452L236 452.5L240 450.5L242 448.5L245 447.5L250 443.5L253 443.5L254 442.5L254.5 443L253 444.5L252 444.5L249 447.5L244 450.5L239.5 455L241 455.5L252 447.5L270 442.5L270.5 443L269.5 445L259.5 458L260 459.5L274 447.5L274.5 449L272.5 452L273 454.5L275 452.5L278 451.5L280 449.5L283 448.5L290 443.5L290.5 445L286.5 450L285.5 452L286 453.5L310 434.5L313 434.5L317 439.5L321 441.5L323 441.5L325 443.5L330 443.5L331 442.5L337 441.5L340 438.5L341 438.5L347.5 431L349.5 427L349.5 425L351.5 422L352.5 415L354.5 411L356.5 409L356.5 408L362 403.5L370 402.5L371 401.5L388 401.5L389 400.5L393 400.5L405 394.5L407 394.5L408 393.5L416 391.5L419 389.5L424 388.5L427 386.5L434 384.5L439 381.5L441 381.5L451 376.5L453 374.5L460 371.5L465 367.5L468 366.5L470 364.5L474 362.5L477 359.5L481 357.5L484 354.5L491 350.5L494 347.5L495 347.5L505 339.5L506 339.5L516.5 330L516.5 329L520.5 325L520.5 324L527 317.5L531 316.5L532 313.5L533.5 314L534 317.5L535.5 316L535.5 308L527 299.5L517 293.5L511 292.5L510 291.5L502 291.5L501 290.5L496 290.5L495 291.5L487 291.5L486 292.5L481 292.5L480 293.5L477 293.5L473 295.5L470 295.5L467 297.5L460 298.5L454.5 292L447.5 276L446.5 268L445.5 267L445.5 262L444.5 261L443.5 247L442.5 246L442.5 242L441.5 241L443.5 238L442.5 235L427.5 220L427 218.5L426 218.5L406 199.5L405 199.5L400 194.5L399 194.5L383 180.5L382 180.5L378 176.5L377 176.5L374 173.5L369 170.5L365 166.5L364 166.5L349 154.5L345 152.5L342 149.5L335 145.5L329 140.5L326 139.5L324 137.5L319 135.5L317 133.5L311 130.5L305 129.5L304.5 132L305.5 133L305.5 135L309.5 142L309 143.5L307 142.5L297 134.5L296 134.5L286 126.5L285 126.5L282 123.5L281 123.5L278 120.5L264 111.5L261 108.5L247 99.5L244 96.5L237 92.5L234 89.5L233 89.5L201 67.5L198 66.5L191 61.5L186 59.5L184 57.5L179 55.5L177 53.5L175 52.5L172 52.5L171 51.5ZM338 402.5L339.5 405L337 407.5L336.5 405L338 402.5ZM346 404.5L346.5 419L345 420.5L341 420.5L337 422.5L335 424.5L330 425.5L327 427.5L326.5 427L330.5 423L332.5 419L332.5 416L346 404.5ZM329 405.5L329.5 408L327 410.5L320.5 411L329 405.5ZM319 411.5L319.5 412L318 413.5L316 414.5L315.5 414L319 411.5ZM312 412.5L312.5 413L306 418.5L304 419.5L298.5 420L300 417.5L308 413.5L311 413.5L312 412.5ZM293 421.5L293 423.5L291 424.5L289.5 424L293 421.5ZM332 428.5L332.5 429L327 433.5L325 433.5L324 434.5L320.5 434L320.5 432L322 430.5L325 431.5L332 428.5ZM299 428.5L300 429.5L302 429.5L303 432.5L304 431.5L305.5 433L300 436.5L297 439.5L296 439.5L294 441.5L293.5 441L296 438.5L297 438.5L302.5 433L302 432.5L300 432.5L299 433.5L297 433.5L296 434.5L294 434.5L287 437.5L286.5 437L297 428.5L299 428.5Z");
        eagle.appendChild(path);
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
        enter(opening, '.landing .intro-copy > .sub', 0.16);
        enter(opening, '.earth-figure', 0.12, {y:12, rotation:-4, duration:0.8});
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

    select('.sat-box, .narrative, .agency-section').forEach(element => {
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

    const earth = document.querySelector('.earth-drift');
    if (earth && !mobile) {
      track([earth]);
      gsap.to(earth, {
        y:24, x:8, rotation:6, ease:'none',
        scrollTrigger:{trigger:'.landing-intro', start:'top top', end:'bottom top', scrub:0.5}
      });
    }

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
