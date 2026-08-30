(() => {
  function message(key, fallback) {
    const translated = globalThis.chrome?.i18n?.getMessage?.(key) ?? '';
    return translated || fallback || key;
  }

  if (globalThis.chrome?.i18n?.getUILanguage) {
    document.documentElement.lang = chrome.i18n.getUILanguage();
  }

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (key) element.textContent = message(key, element.textContent);
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key) element.setAttribute('aria-label', message(key, element.getAttribute('aria-label') ?? ''));
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    const key = element.dataset.i18nAlt;
    if (key) element.setAttribute('alt', message(key, element.getAttribute('alt') ?? ''));
  });

  // The fallback is what a visitor actually sees: this page is served from
  // GitHub Pages, where the extension's locale messages do not resolve.
  document.title = `${message('appName', 'HTML to PNG')} ${message('welcomeInstalled', 'is installed')}`;

  const canvas = document.getElementById('confetti-canvas');
  const trigger = document.getElementById('confetti-trigger');
  if (!(canvas instanceof HTMLCanvasElement) || !(trigger instanceof HTMLElement)) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const colors = ['#7A1848', '#5E1238', '#E4DCE0', '#1A1216'];
  const pieces = [];
  let animationFrame = 0;
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function origin(element) {
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
  }

  function burst(count, element = trigger) {
    if (reducedMotion) return;

    const point = origin(element);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 6;
      pieces.push({
        x: point.x + (Math.random() - 0.5) * 18,
        y: point.y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        gravity: 0.12 + Math.random() * 0.08,
        width: 4 + Math.random() * 4,
        height: 7 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        color: colors[index % colors.length],
        age: 0,
        lifetime: 90 + Math.random() * 45,
      });
    }

    if (!animationFrame) animationFrame = requestAnimationFrame(render);
  }

  function render() {
    context.clearRect(0, 0, width, height);

    for (let index = pieces.length - 1; index >= 0; index -= 1) {
      const piece = pieces[index];
      piece.vy += piece.gravity;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vx *= 0.99;
      piece.rotation += piece.rotationSpeed;
      piece.age += 1;

      context.save();
      context.globalAlpha = Math.max(0, 1 - piece.age / piece.lifetime);
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      context.restore();

      if (piece.age >= piece.lifetime || piece.y > height + 40) pieces.splice(index, 1);
    }

    if (pieces.length) {
      animationFrame = requestAnimationFrame(render);
    } else {
      animationFrame = 0;
      context.clearRect(0, 0, width, height);
    }
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  trigger.addEventListener('click', () => burst(90));
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      burst(90);
    }
  });

  window.setTimeout(() => burst(120), 180);
})();
