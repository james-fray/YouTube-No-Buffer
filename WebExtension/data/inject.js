'use strict';

// preferences
const prefs = {
  playlist: false,
  visible: false,
  hidden: false,
  method: 'pauseVideo'
};
const script = document.createElement('script');
Object.assign(script.dataset, prefs);
{
  const play = () => {
    script.dispatchEvent(new Event('stop'));
    // document.removeEventListener('play', play, true);
  };
  document.addEventListener('canplay', play, true);
  document.addEventListener('yt-navigate-finish', () => {
    document.removeEventListener('canplay', play, true);
    document.addEventListener('canplay', play, true);
    script.dispatchEvent(new Event('stop'));
  });
  document.addEventListener('mousedown', () => document.removeEventListener('canplay', play, true));
  document.addEventListener('keydown', () => document.removeEventListener('canplay', play, true));
  script.addEventListener('release', () => document.removeEventListener('canplay', play, true));
}

script.textContent = `{
  const script = document.currentScript;
  const prefs = script.dataset;
  const player = () => document.querySelector('.html5-video-player') || {
    stopVideo: () => {},
    pauseVideo: () => {},
    playVideo: () => {}
  };
  const policy = () => {
    const href = location.href;
    return prefs.playlist === 'true' || href.indexOf('&list=') === -1 || href.indexOf('&index=') === -1;
  };
  const stop = () => {
    const method = script.dataset.method;
    if (player().getPlayerState() === -1) {
      script.dispatchEvent(new Event('release'));
    }
    player()[method]();
  };
  script.addEventListener('stop', () => policy() && stop());
  // visibility
  document.addEventListener('visibilitychange', () => {
    if (prefs.visible === 'true' && document.visibilityState === 'visible') {
      player().playVideo();
      if (prefs.hidden === 'false') {
        prefs.visible = 'false';
      }
    }
    if (prefs.hidden === 'true' && document.visibilityState === 'hidden') {
      player().pauseVideo();
    }
  });
}`;
document.documentElement.appendChild(script);
script.remove();
// prefs
chrome.storage.local.get(prefs, prefs => Object.assign(script.dataset, prefs));
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value.newValue);
});
