/* ══════════════════════════════════════════
   cipher.js — Bộ mã hoá / giải mã
   IIFE để tránh ô nhiễm namespace toàn cục.
   Expose duy nhất window._tr(text, mode).
   ══════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Bảng mã ký tự ──
  // Mỗi cặp [mã số, ký tự] ánh xạ hai chiều
  var CHAR_TABLE = [
    ['21','a'],['22','b'],['23','c'],['31','d'],['32','e'],['33','f'],['34','đ'],
    ['41','g'],['42','h'],['43','i'],['51','j'],['52','k'],['53','l'],
    ['61','m'],['62','n'],['63','o'],['71','p'],['72','q'],['73','r'],['74','s'],
    ['81','t'],['82','u'],['83','v'],['91','w'],['92','x'],['93','y'],['94','z'],
    ['11','ă'],['12','â'],['13','ê'],['14','ô'],['15','ơ'],['16','ư'],
  ];

  var c2ch = {}, ch2c = {};
  CHAR_TABLE.forEach(function(p) { c2ch[p[0]] = p[1]; ch2c[p[1]] = p[0]; });

  // ── Bảng thanh điệu ──
  // '00' = không dấu, '01'–'05' = huyền/sắc/hỏi/ngã/nặng
  var t2m = { '00':'', '01':'\u0300', '02':'\u0301', '03':'\u0309', '04':'\u0303', '05':'\u0323' };
  var m2t = {};
  Object.keys(t2m).forEach(function(k) { if (t2m[k]) m2t[t2m[k]] = k; });

  // ── Bảng nguyên âm có dấu → [base, combining mark] ──
  var VOWEL_MAP = {
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
    'ừ':['ư','\u0300'],'ứ':['ư','\u0301'],'ử':['ư','\u0309'],'ữ':['ư','\u0303'],'ự':['ư','\u0323'],
  };

  // Bảng ngược: base + combining mark → ký tự có dấu
  var cm = {};
  Object.keys(VOWEL_MAP).forEach(function(ch) {
    var p = VOWEL_MAP[ch];
    cm[p[0] + p[1]] = ch;
  });

  // ── Decode: cipher text → plaintext ──
  function decode(word) {
    var result = '', i = 0, isUpper = false;

    while (i < word.length) {
      var token = word.slice(i, i + 2);

      // '00' = ký tự tiếp theo viết hoa
      if (token === '00') { isUpper = true; i += 2; continue; }

      if (token.length < 2) {
        result += isUpper ? word[i].toUpperCase() : word[i];
        isUpper = false;
        i++;
        continue;
      }

      if (c2ch[token]) {
        var base     = c2ch[token];
        var toneCode = word.slice(i + 2, i + 4);
        var char;

        if (toneCode.length === 2 && t2m[toneCode] !== undefined) {
          char = cm[base + t2m[toneCode]] || (base + t2m[toneCode]);
          i += 4;
        } else {
          char = base;
          i += 2;
        }

        result += isUpper ? char.toUpperCase() : char;
        isUpper = false;
      } else {
        result += isUpper ? word[i].toUpperCase() : word[i];
        isUpper = false;
        i++;
      }
    }
    return result;
  }

  // ── Encode: plaintext → cipher text ──
  function encode(word) {
    var result = '';
    for (var j = 0; j < word.length; j++) {
      var rawCh   = word[j];
      var ch      = rawCh.toLowerCase();
      var isUpper = rawCh !== ch;

      if (isUpper) result += '00';

      if (VOWEL_MAP[ch]) {
        var p = VOWEL_MAP[ch];
        result += (ch2c[p[0]] || p[0]) + (m2t[p[1]] || '00');
      } else if (ch2c[ch]) {
        result += ch2c[ch];
      } else {
        result += rawCh;
      }
    }
    return result;
  }

  /**
   * Translate toàn bộ text, xử lý từng từ, giữ nguyên dấu câu.
   * @param {string} text
   * @param {'d'|'e'} mode  — 'd' = decode, 'e' = encode
   * @returns {string}
   */
  window._tr = function(text, mode) {
    text = text.normalize('NFC');
    return text.split(' ').map(function(word) {
      if (!word) return word;
      // Tách phần thân từ và dấu câu cuối
      var match = word.match(/^(.*?)([.,?!;:\u2026\u201c\u201d"'()\[\]]+)?$/);
      var body  = match[1] || '';
      var punc  = match[2] || '';
      return (mode === 'd' ? decode(body) : encode(body)) + punc;
    }).join(' ');
  };

})();