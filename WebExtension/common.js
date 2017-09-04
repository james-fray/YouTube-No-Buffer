'use strict';

// stop auto-playing for embedded players
var installed = false;

var prefs = {
  enablejs: true,
  embedded: true
};

function observe(d) {
  let url = d.url;
  if (url.indexOf('autoplay=') !== -1) {
    url = url.replace('autoplay=1', 'autoplay=0');
  }
  if (prefs.enablejs === false) {
    url = url.replace('enablejsapi=1', 'enablejsapi=0');
  }
  if (d.url !== url) {
    return {
      redirectUrl: url
    };
  }
}
var properties = {
  urls: [
    '*://www.youtube.com/embed/*',
  ]
};

function update() {
  if (prefs.embedded && !installed) {
    chrome.webRequest.onBeforeRequest.addListener(observe, properties, ['blocking']);
    installed = true;
  }
  if (!prefs.embedded) {
    chrome.webRequest.onBeforeRequest.removeListener(observe);
    installed = false;
  }
}

chrome.storage.local.get(prefs, ps => {
  prefs = Object.assign(prefs, ps);
  update();
});
chrome.storage.onChanged.addListener(ps => {
  Object.entries(ps).forEach(([key, value]) => {
    prefs[key] = value.newValue;
  });
  if (ps.embedded) {
    update();
  }
});

// FAQs and Feedback
chrome.storage.local.get('version', prefs => {
  const version = chrome.runtime.getManifest().version;
  const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  if (isFirefox ? !prefs.version : prefs.version !== version) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/youtube-tools.html?from=buffer&version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
