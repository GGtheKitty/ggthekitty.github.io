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

  const media = document.getElementById('media');

  const fit = allowedFits.has(event.data.fit)
    ? event.data.fit
    : 'contain';
  
  switch (fit) {
    case 'cover':
      media.style.backgroundSize = 'cover';
      break;
  
    case 'fill':
      media.style.backgroundSize = '100% 100%';
      break;
  
    case 'none':
      media.style.backgroundSize = 'auto';
      break;
  
    case 'scale-down':
    case 'contain':
    default:
      media.style.backgroundSize = 'contain';
      break;
  }
  
  media.style.backgroundImage = `url("${url.href}")`;
});

window.parent.postMessage({ type: 'media-renderer-ready' }, '*');
