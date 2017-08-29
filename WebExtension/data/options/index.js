'use strict';

function restore () {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    playlist: false,
    embedded: true,
    enablejs: true,
    visible: false,
    hidden: false
  }, (prefs) => {
    document.getElementById('playlist').checked = prefs.playlist;
    document.getElementById('embedded').checked = prefs.embedded;
    document.getElementById('enablejs').checked = prefs.enablejs;
    document.getElementById('visible').checked = prefs.visible;
    document.getElementById('hidden').checked = prefs.hidden;
  });
}

function save () {
  const embedded = document.getElementById('embedded').checked;
  const enablejs = document.getElementById('enablejs').checked;
  const playlist = document.getElementById('playlist').checked;
  const visible = document.getElementById('visible').checked;
  const hidden = document.getElementById('hidden').checked;
  chrome.storage.local.set({
    enablejs,
    embedded,
    playlist,
    visible,
    hidden
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
