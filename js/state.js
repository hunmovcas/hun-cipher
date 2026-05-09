/* ══════════════════════════════════════════
   STATE — all global mutable variables
   ══════════════════════════════════════════ */

// Firebase instance
var db = null;

// Auth state
var _loggedIn         = false;
var _isAdmin          = false;
var _currentLoginRole = 'normal';   // 'normal' | 'secondary' | 'admin' | 'founder'
var _originalRole     = 'normal';
var _isProtected      = false;
var _blockedIPs       = {};

// Session keys — used to upgrade / wipe traces on elevate
var _sessionKeys = { view: null, normal: null, normalType: null, admin: null, founder: null };
var _sessionLogged = false;

// Counter values (live-synced from Firebase)
var _vOuter = 0, _vReal = 0, _vNormal = 0, _vSec = 0, _vAdmin = 0, _vFounder = 0;

// Logs
var _allLogs = [];

// Notifications
var _allNoti = [];

// Pending action state
var _pendingClearKey    = null;
var _pendingAdjustKey   = null;
var _pendingDeleteKeys  = [];
var _pendingDeleteRow   = null;
var _pendingSingleDelete = null;

// Log screen pagination / filter / sort
var _filter    = 'all';
var _page      = 1;
var _perPage   = 25;
var _sortField = 'ts';
var _sortDir   = 'desc';
var _ipMode    = 'all';

// Navigation history
var _hist = [];
var _hidx = -1;

// Cipher mode
var _mode = 'd';

// Cipher helpers
var _letterRegex = /[a-zA-ZáàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/;
var _lastCongratulatedText = "";

// IP detection
window._myIP = '';