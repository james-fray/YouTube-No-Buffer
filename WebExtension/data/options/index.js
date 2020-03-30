'use strict';

const status = document.getElementById('status');

function restore() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    playlist: false,
    visible: false,
    hidden: false,
    method: 'pauseVideo'
  }, prefs => {
    document.getElementById('playlist').checked = prefs.playlist;
    document.getElementById('visible').checked = prefs.visible;
    document.getElementById('hidden').checked = prefs.hidden;
    document.getElementById('method').checked = prefs.method === 'pauseVideo';
  });
}

function save() {
  const playlist = document.getElementById('playlist').checked;
  const visible = document.getElementById('visible').checked;
  const hidden = document.getElementById('hidden').checked;
  const method = document.getElementById('method').checked ? 'pauseVideo' : 'stopVideo';
  chrome.storage.local.set({
    playlist,
    visible,
    hidden,
    method
  }, () => {
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '&rd=donate'
}));
// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    status.textContent = 'Double-click to reset!';
    window.setTimeout(() => status.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
