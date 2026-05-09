/* ══════════════════════════════════════════
   CIPHER ENGINE — encode/decode + UI bindings
   ══════════════════════════════════════════ */

(function() {
  var c2ch = {}, ch2c = {};
  [['21','a'],['22','b'],['23','c'],['31','d'],['32','e'],['33','f'],['34','đ'],
   ['41','g'],['42','h'],['43','i'],['51','j'],['52','k'],['53','l'],['61','m'],
   ['62','n'],['63','o'],['71','p'],['72','q'],['73','r'],['74','s'],['81','t'],
   ['82','u'],['83','v'],['91','w'],['92','x'],['93','y'],['94','z'],
   ['11','ă'],['12','â'],['13','ê'],['14','ô'],['15','ơ'],['16','ư']]
    .forEach(function(p) { c2ch[p[0]] = p[1]; ch2c[p[1]] = p[0]; });

  var t2m = { '00':'', '01':'\u0300', '02':'\u0301', '03':'\u0309', '04':'\u0303', '05':'\u0323' };
  var m2t = { '\u0300':'01', '\u0301':'02', '\u0309':'03', '\u0303':'04', '\u0323':'05' };

  var dv = {
    'à':['a','\u0300'],'á':['a','\u0301'],'ả':['a','\u0309'],'ã':['a','\u0303'],'ạ':['a','\u0323'],
    'è':['e','\u0300'],'é':['e','\u0301'],'ẻ':['e','\u0309'],'ẽ':['e','\u0303'],'ẹ':['e','\u0323'],
    'ì':['i','\u0300'],'í':['i','\u0301'],'ỉ':['i','\u0309'],'ĩ':['i','\u0303'],'ị':['i','\u0323'],
    'ò':['o','\u0300'],'ó':['o','\u0301'],'ỏ':['o','\u0309'],'õ':['o','\u0303'],'ọ':['o','\u0323'],
    'ù':['u','\u0300'],'ú':['u','\u0301'],'ủ':['u','\u0309'],'ũ':['u','\u0303'],'ụ':['u','\u0323'],
    'ỳ':['y','\u0300'],'ý':['y','\u0301'],'ỷ':['y','\u0309'],'ỹ':['y','\u0303'],'ỵ':['y','\u0323'],
    'ằ':['ă','\u0300'],'ắ':['ă','\u0301'],'ẳ':['ă','\u0309'],'ẵ':['ă','\u0303'],'ặ':['ă','\u0323'],
    'ầ':['â','\u0300'],'ấ':['â','\u0301'],'ẩ':['â','\u0309'],'ẫ':['â','\u0303'],'ậ':['â','\u0323'],
    'ề':['ê','\u0300'],'ế':['ê','\u0301'],'ể':['ê','\u0309'],'ễ':['ê','\u0303'],'ệ':['ê','\u0323'],
    'ồ':['ô','\u0300'],'ố':['ô','\u0301'],'ổ':['ô','\u0309'],'ỗ':['ô','\u0303'],'ộ':['ô','\u0323'],
    'ờ':['ơ','\u0300'],'ớ':['ơ','\u0301'],'ở':['ơ','\u0309'],'ỡ':['ơ','\u0303'],'ợ':['ơ','\u0323'],
    'ừ':['ư','\u0300'],'ứ':['ư','\u0301'],'ử':['ư','\u0309'],'ữ':['ư','\u0303'],'ự':['ư','\u0323']
  };
  var cm = {};
  Object.keys(dv).forEach(function(ch) { var p = dv[ch]; cm[p[0]+p[1]] = ch; });

  function dec(w) {
    var r = '', i = 0, isUpper = false;
    while (i < w.length) {
      var tk = w.slice(i, i+2);
      if (tk === '00') { isUpper = true; i += 2; continue; }
      if (tk.length < 2) { r += isUpper ? w[i].toUpperCase() : w[i]; isUpper = false; i++; continue; }
      if (c2ch[tk]) {
        var base = c2ch[tk], tc = w.slice(i+2, i+4), char = '';
        if (tc.length === 2 && t2m[tc] !== undefined) { char = cm[base+t2m[tc]] || (base+t2m[tc]); i += 4; }
        else { char = base; i += 2; }
        r += isUpper ? char.toUpperCase() : char;
        isUpper = false;
      } else {
        r += isUpper ? w[i].toUpperCase() : w[i];
        isUpper = false; i++;
      }
    }
    return r;
  }

  function enc(w) {
    var r = '';
    for (var j = 0; j < w.length; j++) {
      var rawCh = w[j], ch = rawCh.toLowerCase(), isUpper = (rawCh !== ch);
      if (isUpper) r += '00';
      if (dv[ch])       { var p = dv[ch]; r += (ch2c[p[0]]||p[0]) + (m2t[p[1]]||'00'); }
      else if (ch2c[ch]){ r += ch2c[ch]; }
      else               { r += rawCh; }
    }
    return r;
  }

  window._tr = function(text, mode) {
    text = text.normalize('NFC');
    return text.split(' ').map(function(word) {
      if (!word) return word;
      var p = word.match(/^(.*?)([.,?!;:\u2026\u201c\u201d"'()\[\]]+)?$/);
      var body = p[1]||'', punc = p[2]||'';
      return (mode === 'd' ? dec(body) : enc(body)) + punc;
    }).join(' ');
  };
})();

/* ── CIPHER UI BINDINGS ── */
function setMode(m) {
  _mode = m;
  document.getElementById('tab-d').classList.toggle('active', m === 'd');
  document.getElementById('tab-e').classList.toggle('active', m === 'e');
  document.getElementById('lbl-in').textContent  = m === 'd' ? 'Enter cipher'  : 'Enter text';
  document.getElementById('lbl-out').textContent = m === 'd' ? 'Decoded text'  : 'Encoded text';
  document.getElementById('inp').placeholder     = m === 'd' ? 'Enter cipher to decode...' : 'Enter text to encode...';
  clr();
  if (_loggedIn) navPush('main-' + m);
}

function run() {
  var v = document.getElementById('inp').value.trim();
  var o = document.getElementById('out');
  if (!v) { o.textContent = ''; o.classList.add('empty'); _lastCongratulatedText = ''; return; }
  var translated = window._tr(v, _mode);
  o.textContent = translated; o.classList.remove('empty');

  if (_mode === 'd' && _loggedIn && _currentLoginRole !== 'founder') {
    var targetSecret = currentSecretMsgs[_currentLoginRole];
    if (targetSecret) {
      var isTargetCipher = !_letterRegex.test(targetSecret);
      if (isTargetCipher) {
        if (v === targetSecret.trim()) {
          if (_lastCongratulatedText !== targetSecret.trim()) {
            _lastCongratulatedText = targetSecret.trim();
            showCongrats(translated);
          }
        } else { _lastCongratulatedText = ''; }
      } else { _lastCongratulatedText = ''; }
    }
  }
}

function syncLive() { run(); }

function clr() {
  document.getElementById('inp').value = '';
  var o = document.getElementById('out');
  o.textContent = ''; o.classList.add('empty');
  _lastCongratulatedText = '';
}

function cp() {
  var t = document.getElementById('out').textContent;
  if (!t) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(t).then(function() { showToast('✓ Copied to clipboard!'); }).catch(function() { fbCopy(t); });
  } else { fbCopy(t); }
}