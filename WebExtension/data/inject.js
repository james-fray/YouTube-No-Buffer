'use strict';

var script = document.createElement('script');
script.textContent = `
  var yttools = yttools || [];
  yttools.playlist = false;
  yttools.visible = false;
  yttools.hidden = false;

  yttools.push(e => {
    const pathname = document.location.pathname;
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
    if (pathname.startsWith('/user') || pathname.startsWith('/channel')) {
      try {
        e.stopVideo();
      }
      catch (e) {}
    }
    // Polymer interface
    function stop() {
      if (
        !yttools.playlist &&
        document.location.href.indexOf('&list=') !== -1 &&
        document.location.href.indexOf('&index=') !== -1
      ) {
        return;
      }
      e.stopVideo();
    }
    document.addEventListener('yt-page-data-fetched', stop);
    stop();
  });
  function onYouTubePlayerReady(e) {
    yttools.forEach(c => c(e));
  }

  (function(observe) {
    observe(window, 'ytplayer', ytplayer => {
      observe(ytplayer, 'config', config => {
        if (config && config.args) {
          delete config.args.ad3_module;

          Object.defineProperty(config.args, 'autoplay', {
            configurable: true,
            get: () => '0'
          });
          config.args.fflags = config.args.fflags.replace('legacy_autoplay_flag=true', 'legacy_autoplay_flag=false');
          config.args.jsapicallback = 'onYouTubePlayerReady';
        }
      });
    });
  })(function(object, property, callback) {
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
  });
  // HTML5 spf forward
  document.addEventListener('spfpartprocess', e => {
    if (e.detail && e.detail.part && e.detail.part.data && e.detail.part.data.swfcfg) {
      delete e.detail.part.data.swfcfg.args.ad3_module;
      if (
        !yttools.playlist &&
        document.location.href.indexOf('&list=') !== -1 &&
        document.location.href.indexOf('&index=') !== -1
      ) {
        return;
      }
      e.detail.part.data.swfcfg.args.autoplay = '0';
    }
  });
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
