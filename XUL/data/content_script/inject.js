'use strict';

var script = document.createElement('script');
script.textContent = `
  var yttools = yttools || [];
  yttools.push(function (e) {
    try {
      let pathname = document.location.pathname;
      if (pathname.startsWith('/user') || pathname.startsWith('/channel')) {
        e.stopVideo();
      }
    }
    catch(e) {}
  });
  function onYouTubePlayerReady (e) {
    yttools.forEach(c => c(e));
  }

  (function (observe) {
    observe(window, 'ytplayer', (ytplayer) => {
      observe(ytplayer, 'config', (config) => {
        if (config && config.args) {
          Object.defineProperty(config.args, 'autoplay', {
            configurable: true,
            get: () => '0'
          });
          config.args.fflags = config.args.fflags.replace("legacy_autoplay_flag=true", "legacy_autoplay_flag=false");
          config.args.jsapicallback = 'onYouTubePlayerReady';
          delete config.args.ad3_module;
        }
      });
    });
  })(function (object, property, callback) {
    let value;
    let descriptor = Object.getOwnPropertyDescriptor(object, property);
    Object.defineProperty(object, property, {
      enumerable: true,
      configurable: true,
      get: () => value,
      set: (v) => {
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
  document.addEventListener('spfpartprocess', function (e) {
    if (e.detail && e.detail.part && e.detail.part.data && e.detail.part.data.swfcfg) {
      delete e.detail.part.data.swfcfg.args.ad3_module;
      if (document.location.href.indexOf('&list=') !== -1 && document.location.href.indexOf('&index=') !== -1) {
        return;
      }
      e.detail.part.data.swfcfg.args.autoplay = '0';
    }
  });
`;
document.documentElement.appendChild(script);
