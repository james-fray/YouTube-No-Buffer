'use strict';

var script = document.createElement('script');
script.textContent = `
  var yttools = Object.assign(window.yttools || [], {
    playlist: false,
    visible: false,
    hidden: false
  });

  yttools.push(e => {
    const policy = () => {
      const href = document.location.href;
      return yttools.playlist || href.indexOf('&list=') === -1 || href.indexOf('&index=') === -1;
    };

    // Method 0
    e.stopVideo();
    // Method 1; prevent polymer from starting video
    const playVideo = e.playVideo;
    e.playVideo = function() {
      if (policy()) {
        const err = new Error().stack;
        if (err && err.indexOf('onPlayerReady_') !== -1) {
          return e.stopVideo();
        }
      }
      playVideo.apply(this, arguments);
    };
    // Method 2; stop subsequent plays
    document.addEventListener('yt-page-data-fetched', () => policy() && e.stopVideo && e.stopVideo());

    // visibility
    document.addEventListener('visibilitychange', () => {
      if (yttools.visible && document.visibilityState === 'visible') {
        e.playVideo();
        if (!yttools.hidden) {
          yttools.visible = false;
        }
      }
      if (yttools.hidden && document.visibilityState === 'hidden') {
        e.pauseVideo();
      }
    });
  });

  function onYouTubePlayerReady(e) {
    yttools.forEach(c => c(e));
  }

  {
    function observe(object, property, callback) {
      let value;
      const descriptor = Object.getOwnPropertyDescriptor(object, property);
      Object.defineProperty(object, property, {
        enumerable: true,
        configurable: true,
        get: () => value,
        set: v => {
          callback(v);
          if (descriptor && descriptor.set) {
            descriptor.set(v);
          }
          value = v;
          return value;
        }
      });
    }
    observe(window, 'ytplayer', ytplayer => {
      observe(ytplayer, 'config', config => {
        if (config && config.args) {
          Object.defineProperty(config.args, 'autoplay', {
            configurable: true,
            get: () => '0'
          });
          config.args.fflags = config.args.fflags.replace('legacy_autoplay_flag=true', 'legacy_autoplay_flag=false');
          config.args.jsapicallback = 'onYouTubePlayerReady';
        }
      });
    });
  }

  // prefs
  window.addEventListener('message', e => {
    if (e.data && e.data.cmd === 'pref-changed') {
      yttools = Object.assign(yttools, e.data.prefs);
    }
  });
`;
document.documentElement.appendChild(script);

chrome.storage.local.get({
  playlist: false,
  visible: false,
  hidden: false
}, prefs => {
  window.postMessage({
    cmd: 'pref-changed',
    prefs
  }, '*');
});
chrome.storage.onChanged.addListener(ps => {
  const prefs = Object.keys(ps).filter(n => n === 'playlist' || n === 'visible' || n === 'hidden')
    .reduce((p, n) => {
      p[n] = ps[n].newValue;
      return p;
    }, {});
  window.postMessage({
    cmd: 'pref-changed',
    prefs
  }, '*');
});
