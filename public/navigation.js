(() => {
  'use strict';
  document.querySelectorAll('[data-go-back]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const canGoBack = window.navigation ? window.navigation.canGoBack : window.history.length > 1;
      if (canGoBack) {
        event.preventDefault();
        window.history.back();
      }
    });
  });
})();
