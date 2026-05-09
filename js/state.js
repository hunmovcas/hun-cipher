/* ══════════════════════════════════════════
   STATE — all global mutable variables
   ══════════════════════════════════════════ */

// Firebase instance
var db = null;

// Role Hierarchy Level mapping
var ROLE_LEVEL = { secondary: 1, normal: 2, admin: 3, head: 4, manager: 5, cofounder: 6, founder: 7 };

// Auth state
var _loggedIn         = false;
var _isAdmin          = false;
var _currentLoginRole = 'normal';   // 'normal' | 'secondary' | 'admin' | 'head' | 'manager' | 'cofounder' | 'founder'
var _originalRole     = 'normal';
var _isProtected      = false;
var _blockedIPs       = {};

// Session keys — used to upgrade / wipe traces on elevate
var _sessionKeys = { view: null, normal: null, secondary: null, admin: null, head: null, manager: null, cofounder: null, founder: null };
var _sessionLogged = false;

// Cutoff Dates
var _CUTOFF_TS = new Date('2026-05-09T00:00:00+07:00').getTime();
var _UNIQUE_CUTOFF_TS = new Date('2026-05-05T14:14:00+07:00').getTime();

// Raw Counter values
var _rawCounts = { outer: 0, real_visitors: 0, inner_normal: 0, inner_secondary: 0, admin: 0, head: 0, manager: 0, cofounder: 0, founder: 0, unique_normal: 0, unique_secondary: 0, unique_admin: 0, unique_head: 0, unique_manager: 0, unique_cofounder: 0, unique_founder: 0 };
var _offsets   = { outer: 0, real_visitors: 0, inner_normal: 0, inner_secondary: 0, admin: 0, head: 0, manager: 0, cofounder: 0, founder: 0, unique_normal: 0, unique_secondary: 0, unique_admin: 0, unique_head: 0, unique_manager: 0, unique_cofounder: 0, unique_founder: 0 };

// Final visible counters
var _vOuter = 0, _vReal = 0, _vNormal = 0, _vSec = 0, _vAdmin = 0, _vHead = 0, _vManager = 0, _vCoFounder = 0, _vFounder = 0;
var _vUNormal = 0, _vUSec = 0, _vUAdmin = 0, _vUHead = 0, _vUManager = 0, _vUCoFounder = 0, _vUFounder = 0;

// Logs & Identities
var _allLogs = [];
var _uniqueLogs = [];
var _identities = {}; // Stores mappings of ProfileName -> [DeviceIDs]

// Notifications
var _allNoti = [];

// Pending action state
var _pendingClearKey     = null;
var _pendingAdjustKey    = null;
var _pendingDeleteKeys   = [];
var _pendingDeleteRow    = null;
var _pendingSingleDelete = null;

// Log screen pagination / filter / sort (Total)
var _filter    = 'all';
var _page      = 1;
var _perPage   = 25;
var _sortField = 'ts';
var _sortDir   = 'desc';

// Log screen pagination / filter / sort (Unique)
var _filterU    = 'all';
var _pageU      = 1;
var _sortFieldU = 'ts';
var _sortDirU   = 'desc';

// IP Stats
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