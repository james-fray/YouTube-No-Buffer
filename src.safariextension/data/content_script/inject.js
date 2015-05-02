/* globals unsafeWindow, exportFunction, XPCNativeWrapper */
'use strict';

function player () {
  var elem = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
  if (elem) {
    return XPCNativeWrapper.unwrap (elem);
  }
  else {
    return;
  }
}

function once (fn, context) {
  var result;
  return function () {
    if (fn) {
      result = fn.apply(context || this, arguments);
      fn = null;
    }
    return result;
  };
}

var stop = once(function () {
  console.error('stop is called');
  var p = player();
  if (!p) {
    return;
  }
  if (p.seekTo) {
    p.seekTo(0);
  }
  p.stopVideo();
  p.clearVideo();
});

function init () {
  function iynbListenerChange () {
    stop();
  }
  exportFunction(iynbListenerChange, unsafeWindow, {
    defineAs: 'iynbListenerChange'
  });
  function one () {
    var p = player();
    if (p && p.addEventListener) {
      p.addEventListener('onStateChange', 'iynbListenerChange');
      iynbListenerChange(1);
    }
    else {
      window.setTimeout(one, 300);
    }
  }
  one();
}

window.addEventListener('DOMContentLoaded', once(init), false);
