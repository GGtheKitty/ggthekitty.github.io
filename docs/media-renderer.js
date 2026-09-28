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

const imageExtensions = new Set([
  'avif',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'webp',
]);

const videoExtensions = new Set(['mp4', 'ogg', 'webm']);
const image = document.getElementById('media-image');
const video = document.getElementById('media-video');

let videoControlMode = 'full';

function isEnabled(value) {
  return value === true || value === 'true';
}

function getFit(value) {
  return allowedFits.has(value) ? value : 'contain';
}

function getMediaUrl(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !allowedHosts.has(url.hostname) ||
      !url.pathname.startsWith('/data/')
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function getMediaType(url) {
  const extension = url.pathname.split('.').pop().toLowerCase();
  if (videoExtensions.has(extension)) return 'video';
  if (imageExtensions.has(extension)) return 'image';
  return null;
}

function clearVideo() {
  video.pause();
  video.removeAttribute('src');
  video.style.display = 'none';
  video.load();
}

function clearImage() {
  image.style.backgroundImage = 'none';
  image.style.display = 'none';
}

function clearMedia() {
  clearImage();
  clearVideo();
}

function setImage(url, fit) {
  clearVideo();

  const backgroundSizes = {
    cover: 'cover',
    fill: '100% 100%',
    none: 'auto',
    'scale-down': 'contain',
    contain: 'contain',
  };

  image.style.backgroundSize = backgroundSizes[fit];
  image.style.backgroundImage = `url("${url.href}")`;
  image.style.display = 'block';
}

function setVideo(url, fit, options) {
  clearImage();

  videoControlMode = ['full', 'noUI', 'none'].includes(options.controls)
    ? options.controls
    : 'full';
  video.controls = videoControlMode === 'full';
  video.autoplay = isEnabled(options.autoplay);
  video.loop = isEnabled(options.loop);
  video.muted = Boolean(options.muted);

  const volume = Number(options.volume);
  video.volume = Number.isFinite(volume)
    ? Math.min(1, Math.max(0, volume))
    : 1;

  video.style.objectFit = fit;
  video.style.display = 'block';
  video.src = url.href;
  video.load();

  if (video.autoplay) {
    video.play().catch(() => {});
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;

  if (event.data?.type === 'clear-wallpaper-media') {
    clearMedia();
    return;
  }

  if (
    event.data?.type !== 'set-wallpaper-media' &&
    event.data?.type !== 'set-wallpaper-image'
  ) {
    return;
  }

  const url = getMediaUrl(event.data.url);
  if (!url) return;

  const mediaType = getMediaType(url);
  const fit = getFit(event.data.fit);

  if (mediaType === 'image') {
    setImage(url, fit);
  } else if (mediaType === 'video') {
    setVideo(url, fit, event.data);
  }
});

video.addEventListener('volumechange', () => {
  window.parent.postMessage(
    {
      type: 'media-renderer-video-state',
      volume: video.volume,
      muted: video.muted,
    },
    '*'
  );
});

video.addEventListener('click', () => {
  if (videoControlMode === 'noUI') {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }
});

video.addEventListener('error', () => {
  window.parent.postMessage(
    {
      type: 'media-renderer-error',
      mediaType: 'video',
      code: video.error?.code || 0,
    },
    '*'
  );
});

window.parent.postMessage(
  {
    type: 'media-renderer-ready',
    version: 2,
    capabilities: ['image', 'video'],
  },
  '*'
);
