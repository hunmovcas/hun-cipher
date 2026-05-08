/* ══════════════════════════════════════════
   state.js — Trạng thái toàn cục của ứng dụng
   Tất cả biến runtime được khai báo tại đây để dễ
   theo dõi và tránh xung đột tên biến.
   ══════════════════════════════════════════ */

// ── Firebase instance ──
var db = null;

// ── Dữ liệu cài đặt (đồng bộ từ Firebase) ──
var currentHashes     = { normal: '', secondary: '', admin: '', founder: '' };
var currentHints      = Object.assign({}, DEFAULT_HINTS);
var currentPopups     = Object.assign({}, DEFAULT_POPUPS);
var currentNotes      = Object.assign({}, DEFAULT_NOTES);
var currentSecretMsgs = Object.assign({}, DEFAULT_SECRET_MSGS);
var currentTabTitle   = DEFAULT_TAB_TITLE;
var currentMainTitle  = DEFAULT_MAIN_TITLE;
var currentWelcome    = DEFAULT_WELCOME;

// ── Identity/Alias profiles ──
var _aliases = {};   // { profileName: 'ID1, ID2, ...' }

// ── Trạng thái xác thực & phân quyền ──
var _loggedIn        = false;
var _isAdmin         = false;
var _currentLoginRole = 'normal';   // 'normal' | 'secondary' | 'admin' | 'founder'
var _originalRole    = 'normal';    // role đã đăng nhập ban đầu (trước khi elevate)

// ── Session keys (dùng để xoá log trùng khi Founder đăng nhập sau) ──
var _sessionKeys = {
  view:       null,
  secondary:  null,
  normal:     null,
  admin:      null,
  founder:    null,
};
var _sessionLogged = false; // đã ghi log "view" trong session này chưa

// ── System flags ──
var _isProtected = false;
var _blockedIPs  = {};

// ── IP của người dùng hiện tại (lấy từ geo API) ──
window._myIP = '';

// ── Counters (đồng bộ realtime từ Firebase) ──
var _vOuter = 0, _vReal = 0, _vNormal = 0, _vSec = 0, _vAdmin = 0, _vFounder = 0;

// ── Log data ──
var _allLogs = [];
var _allNoti = [];

// ── Cipher mode ──
var _mode = 'd';  // 'd' = decode, 'e' = encode
var _lastCongratulatedText = '';

// ── Navigation history (Undo/Redo) ──
var _hist = [];
var _hidx = -1;

// ── Log screen state ──
var _filter    = 'all';
var _page      = 1;
var _perPage   = 25;
var _sortField = 'ts';
var _sortDir   = 'desc';
var _ipMode    = 'all';

// ── Menu open/close state ──
var _profileOpen = false;
var _trafficOpen = false;
var _authOpen    = false;
var _notiOpen    = false;
var _switchOpen  = false;

// ── Pending action state (confirm dialogs) ──
var _pendingClearKey   = null;
var _pendingAdjustKey  = null;
var _pendingDeleteKeys = [];
var _pendingDeleteRow  = null;
var _pendingSingleDelete = null;

// ── Alias manager state ──
var _currentAliasTags = [];
var _editingAlias     = null;

// ── Change password state ──
var _pwChangeType = 'normal';