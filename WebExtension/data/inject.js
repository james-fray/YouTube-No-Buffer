'use strict';

var prefs = {
  playlist: false,
  visible: false,
  hidden: false
};

var script = document.createElement('script');
// pause the video if spfready is not yet emitted and video is not a playlist
{
  const canplay = e => {
    document.removeEventListener('canplay', canplay);
    if (script.dataset.act !== 'true') {
      const href = location.href;
      if (prefs.playlist === false && (href.indexOf('&list=') !== -1 || href.indexOf('&index=') !== -1)) {
        return;
      }
      e.target.pause();
    }
  };
  document.addEventListener('canplay', canplay, true);
}

Object.assign(script.dataset, prefs);
script.textContent = `
  var yttools = window.yttools || [];
  yttools.noBuffer = {
    prefs: document.currentScript.dataset
  };

  yttools.push(e => {
    const policy = () => {
      const prefs = yttools.noBuffer.prefs;
      const href = location.href;
      return prefs.playlist === 'true' || href.indexOf('&list=') === -1 || href.indexOf('&index=') === -1;
    };
    const stop = () => {
      if (e.stopVideo) {
        yttools.noBuffer.prefs.act = true;
        e.stopVideo();
      }
    };
    // Method 0
    stop();
    // Method 1; stop subsequent plays
    document.addEventListener('yt-page-data-fetched', () => policy() && stop());

    // visibility
    document.addEventListener('visibilitychange', () => {
      const prefs = yttools.noBuffer.prefs;
      if (prefs.visible === 'true' && document.visibilityState === 'visible') {
        e.playVideo();
        if (prefs.hidden === 'false') {
          yttools.noBuffer.prefs.visible = 'false';
        }
      }
      if (prefs.hidden === 'true' && document.visibilityState === 'hidden') {
        e.pauseVideo();
      }
    });
  });

  // install listener
  function onYouTubePlayerReady(e) {
    yttools.forEach(c => {
      try {
        c(e);
      }
      catch (e) {}
    });
  }

  // https://youtube.github.io/spfjs/documentation/events/
  window.addEventListener('spfready', () => {
    if (typeof window.ytplayer === 'object' && window.ytplayer.config) {
      window.ytplayer.config.args.jsapicallback = 'onYouTubePlayerReady';
    }
  });
`;
document.documentElement.appendChild(script);
script.remove();

// preferences
chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value);
});
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value.newValue);
});
