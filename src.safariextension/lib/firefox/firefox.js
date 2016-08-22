'use strict';

// Load Firefox based resources
var self          = require('sdk/self'),
    data          = self.data,
    sp            = require('sdk/simple-prefs'),
    prefs         = sp.prefs,
    pageMod       = require('sdk/page-mod'),
    tabs          = require('sdk/tabs'),
    timers        = require('sdk/timers'),
    loader        = require('@loader/options'),
    array         = require('sdk/util/array'),
    unload        = require('sdk/system/unload'),
    unload        = require('sdk/system/unload'),
    {Cc, Ci, Cu, Cr} = require('chrome');

Cu.import('resource://gre/modules/Promise.jsm');

exports.contentScript = (function () {
  pageMod.PageMod({
    include: ['*.youtube.com'],
    contentScriptFile: [data.url('./content_script/inject.js')],
    contentScriptWhen: 'start',
    attachTo: ['top']
  });
})();

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
  open: function (url, inBackground, inCurrent) {
    if (inCurrent) {
      tabs.activeTab.url = url;
    }
    else {
      tabs.open({
        url: url,
        inBackground: typeof inBackground === 'undefined' ? false : inBackground
      });
    }
  },
  list: function () {
    var temp = [];
    for each (var tab in tabs) {
      temp.push(tab);
    }
    return Promise.resolve(temp);
  }
};

exports.version = function () {
  return self.version;
};

exports.timer = timers;

exports.options = (function () {
  var workers = [], options_arr = [];
  pageMod.PageMod({
    include: data.url('options/index.html'),
    contentScriptFile: [data.url('options/firefox/firefox.js'), data.url('options/index.js')],
    contentScriptWhen: 'ready',
    contentScriptOptions: {
      base: loader.prefixURI + loader.name + '/'
    },
    onAttach: function(worker) {
      array.add(workers, worker);
      worker.on('pageshow', (w) => array.add(workers, w));
      worker.on('pagehide', (w) => array.remove(workers, w));
      worker.on('detach', (w) => array.remove(workers, w));

      options_arr.forEach(function (arr) {
        worker.port.on(arr[0], arr[1]);
      });
    }
  });
  sp.on('openOptions', function() {
    exports.tab.open(data.url('options/index.html'));
  });
  unload.when(function () {
    exports.tab.list().then(function (tabs) {
      tabs.forEach(function (tab) {
        if (tab.url === data.url('options/index.html')) {
          tab.close();
        }
      });
    });
  });

  return {
    send: function (id, data) {
      workers.forEach(function (worker) {
        if (!worker || !worker.url) {
          return;
        }
        worker.port.emit(id, data);
      });
    },
    receive: (id, callback) => options_arr.push([id, callback])
  };
})();

// manipulating http response to add autoplay = 0
(function () {
  var observerService = Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);
  function TracingListener() {
    this.originalListener = null;
  }
  TracingListener.prototype = {
    onDataAvailable: function(request, context, inputStream, offset, count) {
      var binaryInputStream = Cc['@mozilla.org/binaryinputstream;1']
        .createInstance(Ci.nsIBinaryInputStream);
      var storageStream = Cc['@mozilla.org/storagestream;1']
        .createInstance(Ci.nsIStorageStream);
      var binaryOutputStream = Cc['@mozilla.org/binaryoutputstream;1']
        .createInstance(Ci.nsIBinaryOutputStream);

      binaryInputStream.setInputStream(inputStream);
      var data = binaryInputStream.readBytes(count);

      data = data.replace(/\"autoplay\"\:\s*[^\,]*\,*/, '');
      data = data.replace(/\"ad3_module\"\:\s*[^\,]*\,*/, '');
      if (data.contains('"args":')) {
        data = data.replace(/\"args\"\:\s*\{([^\}]*)\}*/, function (a, b) {
          var c = b;
          c = '"autoplay":"0",' + c;
          return a.replace(b, c);
        });
      }
      count = data.length;
      storageStream.init(8192, count, null);
      binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
      binaryOutputStream.writeBytes(data, count);
      binaryOutputStream.close();

      this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
    },
    onStartRequest: function(request, context) {
      this.originalListener.onStartRequest(request, context);
    },
    onStopRequest: function(request, context, statusCode) {
      this.originalListener.onStopRequest(request, context, statusCode);
    },
    QueryInterface: function (aIID) {
      if (aIID.equals(Ci.nsIStreamListener) ||
          aIID.equals(Ci.nsISupports)) {
          return this;
      }
      throw Cr.NS_NOINTERFACE;
    }
  };

  var httpRequestObserver = {
    observe: function (subject) {
      subject.QueryInterface(Ci.nsIHttpChannel);
      var url = subject.URI.spec;
      if (!url.contains('youtube.com/watch?v=')) {
        return;
      }
      var newListener = new TracingListener();
      subject.QueryInterface(Ci.nsITraceableChannel);
      newListener.originalListener = subject.setNewListener(newListener);
    }
  };
  observerService.addObserver(httpRequestObserver, 'http-on-examine-response', false);
  unload.when(function () {
    observerService.removeObserver(httpRequestObserver, 'http-on-examine-response');
  });
})();
