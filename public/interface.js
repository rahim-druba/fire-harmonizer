(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const loadAnimations = new Map();
  const reveal = element => element.classList.remove('reveal-pending');
  const loadTargets = [...document.querySelectorAll('.landing .masthead, .landing h1, .landing .wrap > .sub, .landing .card, .landing .briefing')];
  if (!reduced.matches) {
    loadTargets.forEach((element, index) => {
      if (!element.animate) return;
      const animation = element.animate([
        {opacity:0, transform:'translateY(6px)'},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:280, delay:index * 60, easing:'cubic-bezier(.2,.7,.2,1)', fill:'backwards'});
      animations.add(animation);
      loadAnimations.set(element, animation);
      animation.onfinish = () => {
        animations.delete(animation);
        loadAnimations.delete(element);
      };
    });
  }
  let entrances;
  if ('IntersectionObserver' in window) {
    entrances = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          entrances.unobserve(entry.target);
        }
      });
    }, {threshold:0.05});
    document.querySelectorAll('.briefing, .sat-box, .narrative, .footer-note').forEach(element => {
      if (!reduced.matches && !loadTargets.includes(element) && element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('reveal-pending');
        entrances.observe(element);
      }
    });
  }
  document.addEventListener('focusin', event => {
    loadAnimations.forEach((animation, element) => {
      if (element.contains(event.target)) {
        animation.cancel();
        animations.delete(animation);
        loadAnimations.delete(element);
      }
    });
    const target = event.target.closest('.reveal-pending');
    if (target) {
      reveal(target);
      entrances?.unobserve(target);
    }
  });
  document.querySelectorAll('#barChart, #trendChart, #result').forEach(element => {
    let active;
    new MutationObserver(() => {
      if (active) { active.cancel(); animations.delete(active); }
      if (reduced.matches || !element.animate) return;
      active = element.animate([{opacity:0.65}, {opacity:1}], {duration:180, easing:'ease-out'});
      animations.add(active);
      const current = active;
      current.onfinish = () => animations.delete(current);
    }).observe(element, {childList:true, subtree:true, characterData:true});
  });
  const applyMotionPreference = () => {
    if (reduced.matches) {
      document.querySelectorAll('.reveal-pending').forEach(reveal);
      entrances?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      loadAnimations.clear();
    }
    if (typeof map !== 'undefined' && map.options) {
      map.options.zoomAnimation = !reduced.matches;
      map.options.fadeAnimation = !reduced.matches;
      map.options.markerZoomAnimation = !reduced.matches;
      map.options.inertia = !reduced.matches;
      if (reduced.matches) map.stop();
    }
  };
  reduced.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
})();
