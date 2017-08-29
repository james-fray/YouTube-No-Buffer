'use strict';

// Load Firefox based resources
var self          = require('sdk/self'),
  data          = self.data,
  sp            = require('sdk/simple-prefs'),
  prefs         = sp.prefs,
  pageMod       = require('sdk/page-mod'),
  tabs          = require('sdk/tabs'),
  timers        = require('sdk/timers');

pageMod.PageMod({
  include: [
    'https://www.youtube.com/*'
  ],
  contentScriptFile: [data.url('./content_script/inject.js')],
  contentScriptWhen: 'start',
  attachTo: ['top', 'existing']
});

exports.storage = {
  read: function (id) {
    return (prefs[id] || prefs[id] + '' === 'false' || !isNaN(prefs[id])) ? (prefs[id] + '') : null;
  },
  write: function (id, data) {
    data = data + '';
    if (data === 'true' || data === 'false') {
      prefs[id] = data === 'true' ? true : false;
    }
    else if (parseInt(data) + '' === data) {
      prefs[id] = parseInt(data);
    }
    else {
      prefs[id] = data + '';
    }
  }
};

exports.tab = {
  open: function (url) {
    tabs.open({url});
  }
};

exports.version = function () {
  return self.version;
};

exports.timer = timers;
