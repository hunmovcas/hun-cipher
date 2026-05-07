/* ══════════════════════════════════════════
   config.js — Hằng số & giá trị mặc định
   Đây là nơi DUY NHẤT chỉnh sửa cấu hình Firebase
   và các nội dung mặc định của trang.
   ══════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyD8ttUULzdFqPLmeK2J9JOGfEzzG949k8I',
  authDomain:        'hun-cipher.firebaseapp.com',
  databaseURL:       'https://hun-cipher-default-rtdb.firebaseio.com',
  projectId:         'hun-cipher',
  storageBucket:     'hun-cipher.firebasestorage.app',
  messagingSenderId: '1049763241075',
  appId:             '1:1049763241075:web:b5696c5bb26366f3ee9e06',
};

// ── Nội dung mặc định (fallback khi Firebase chưa có dữ liệu) ──

const DEFAULT_HINTS = {
  hint1: "Howl's Moving Castle",
  hint2: 'Cristiano Ronaldo Neymar',
};

const DEFAULT_POPUPS = {
  wrong: "Yikes! Way off..",
  close: "Keep trying! You're so close...",
};

const DEFAULT_NOTES = {
  tagline: '♡ For keyholders only ♡',
  footer:  'Encrypted for the masses, <span>decrypted by one</span>',
};

const DEFAULT_SECRET_MSGS = {
  normal:    'Hint Admin: Justin Bieber + Deep Sea.',
  secondary: '00936382 61215232 81424374 53636352 7463 32217493!',
  admin:     'You complete me <3',
  founder:   'You complete me <3',
};

const DEFAULT_TAB_TITLE  = 'Secret Cipher';
const DEFAULT_MAIN_TITLE = 'The <em>Secret</em><br>Cipher';
const DEFAULT_WELCOME    = '🎏 ✿ WELCOME TO MY PAGE ✿ 🎏';

// ── Phân cấp quyền (dùng để so sánh elevation) ──
const ROLE_HIERARCHY = { founder: 4, admin: 3, normal: 2, secondary: 1 };

// ── Regex nhận biết ký tự chữ cái (dùng để phân biệt cipher / plaintext) ──
const LETTER_REGEX = /[a-zA-ZáàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/;