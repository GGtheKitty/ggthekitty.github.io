const allowedHosts = new Set([
  'static1.e621.net',
  'static1.e926.net',
]);

const allowedFits = new Set([
  'contain',
  'cover',
  'fill',
  'none',
  'scale-down',
]);

window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;
  if (event.data?.type !== 'set-wallpaper-image') return;

  const url = new URL(event.data.url);

  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname) ||
    !url.pathname.startsWith('/data/')
  ) {
    return;
  }

  const image = document.getElementById('media');
  image.style.objectFit = allowedFits.has(event.data.fit)
    ? event.data.fit
    : 'contain';

  image.referrerPolicy = 'strict-origin-when-cross-origin';
  image.src = url.href;
});

window.parent.postMessage({ type: 'media-renderer-ready' }, '*');
