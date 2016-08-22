'use strict';

if (window === window.top) {
  var script = document.createElement('script');
  script.textContent =
'    (function (observe) {' +
'      observe(window, "ytplayer", function (ytplayer) {' +
'        observe(ytplayer, "config", function (config) {' +
'          if (config) {' +
'            Object.defineProperty(config, "html5", {' +
'              configurable: true,' +
'              get: function () {false;}' +
'            });' +
'          }' +
'        });' +
'      });' +
'    })(function (object, property, callback) {' +
'      var value;' +
'      var descriptor = Object.getOwnPropertyDescriptor(object, property);' +
'      Object.defineProperty(object, property, {' +
'        enumerable: true,' +
'        configurable: true,' +
'        get: function () {return value;},' +
'        set: function (v) {' +
'          callback(v);' +
'          if (descriptor && descriptor.set) {' +
'            descriptor.set(v);' +
'          }' +
'          value = v;' +
'          return value;' +
'        }' +
'      });' +
'    });';
  document.documentElement.appendChild(script);
}

