/* ══════════════════════════════════════════
   NAV — history, undo/redo, softReload, applyNav
   ══════════════════════════════════════════ */

function updateNavBtns() {
  if (!_loggedIn) {
    document.getElementById('btn-undo').disabled   = true;
    document.getElementById('btn-redo').disabled   = true;
    document.getElementById('btn-reload').style.display = 'flex';
    return;
  }
  document.getElementById('btn-reload').style.display = 'flex';
  document.getElementById('btn-undo').disabled = (_hidx <= 1);
  document.getElementById('btn-redo').disabled = (_hidx >= _hist.length - 1);
}

function navPush(s) {
  if (_hidx >= 0 && _hist[_hidx] === s) return;
  _hist = _hist.slice(0, _hidx + 1);
  _hist.push(s);
  _hidx = _hist.length - 1;
  updateNavBtns();
}

function navUndo() {
  if (!_loggedIn || _hidx <= 1) return;
  _hidx--;
  applyNav(_hist[_hidx]);
  updateNavBtns();
}

function navRedo() {
  if (!_loggedIn || _hidx >= _hist.length - 1) return;
  _hidx++;
  applyNav(_hist[_hidx]);
  updateNavBtns();
}

function softReload() {
  var btn = document.getElementById('btn-reload');
  var svg = btn.querySelector('svg');
  svg.classList.add('spin-anim');
  setTimeout(function() { svg.classList.remove('spin-anim'); }, 600);

  if (!_loggedIn) {
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  } else {
    var s = _hist[_hidx];
    if (s === 'log') { loadLogs(); } else { run(); }
    showToast('✓ Data refreshed');
  }
}

function applyNav(s) {
  var log  = document.getElementById('log-screen');
  var main = document.getElementById('main-wrap');
  log.style.display  = 'none';
  main.style.display = 'none';

  if (s === 'log') {
    log.style.display = 'block';
    if (_allLogs.length > 0) {
      var statusEl = document.getElementById('log-status');
      if (statusEl) statusEl.style.display = 'none';
      renderLogs();
      renderIpStats();
    } else {
      loadLogs();
    }
  } else {
    main.style.display = 'block';
    var mode = (s === 'main-e') ? 'e' : 'd';
    _mode = mode;
    document.getElementById('tab-d').classList.toggle('active', mode === 'd');
    document.getElementById('tab-e').classList.toggle('active', mode === 'e');
    document.getElementById('lbl-in').textContent  = mode === 'd' ? 'Enter cipher'  : 'Enter text';
    document.getElementById('lbl-out').textContent = mode === 'd' ? 'Decoded text'  : 'Encoded text';
    document.getElementById('inp').placeholder     = mode === 'd' ? 'Enter cipher to decode...' : 'Enter text to encode...';
  }
}