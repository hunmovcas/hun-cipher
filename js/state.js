/* ══════════════════════════════════════════
   STATE — global variables, constants
   ══════════════════════════════════════════ */

// Auth & Roles
var _loggedIn = false;
var _originalRole = 'normal';
var _currentLoginRole = 'normal';
var _authVia = null;
var _isAdmin = false;

// Navigation & Cipher
var _mode = 'd';
var _hist = [];
var _hidx = -1;
var _lastCongratulatedText = '';
var _letterRegex = /[a-zA-Z]/;

// Data Maps
var _identities = {};
var _blockedIPs = {};
var _isProtected = false;
var _allLogs = [];
var _uniqueLogs = [];
var _allNoti = [];

// System Counters & Offsets
var _rawCounts = {};
var _offsets = {};
var _sessionLogged = false;
var _sessionKeys = { view: null, normal: null, secondary: null, admin: null, head: null, manager: null, cofounder: null, founder: null };

var _vReal = 0, _vUNormal = 0, _vUSec = 0, _vUAdmin = 0, _vUHead = 0, _vUManager = 0, _vUCoFounder = 0, _vUFounder = 0;
var _vOuter = 0, _vNormal = 0, _vSec = 0, _vAdmin = 0, _vHead = 0, _vManager = 0, _vCoFounder = 0, _vFounder = 0;
var _vGuestNormal = 0, _vGuestSec = 0, _vGuestAdmin = 0, _vGuestHead = 0, _vGuestManager = 0, _vGuestCoFounder = 0, _vGuestFounder = 0;
var _vGuestOuter = 0;

// Time Cutoffs for analytics (0 = all time)
var _CUTOFF_TS = 0;
var _UNIQUE_CUTOFF_TS = 0;
var _GUEST_CUTOFF_TS = new Date('2026-05-05T14:44:00+07:00').getTime(); // Mốc thời gian đếm Guest

// Tables & Filters
var _perPage = 15;
var _page = 1;
var _sortField = 'ts';
var _sortDir = 'desc';
var _filter = 'all';

var _pageU = 1;
var _sortFieldU = 'ts';
var _sortDirU = 'desc';
var _filterU = 'all';

var _excludedRanks = [];
var _excludedProfiles = [];
var _guestExcludedRanks = [];
var _ipMode = 'all';

// Pending Actions
var _pendingSingleDelete = null;
var _pendingDeleteKeys = [];
var _pendingDeleteRow = null;
var _pendingAdjustKey = null;
var _pendingClearKey = null;

// RBAC Setup
var ROLE_LEVEL = {
  'secondary': 1,
  'normal': 2,
  'admin': 3,
  'head': 4,
  'manager': 5,
  'cofounder': 6,
  'founder': 7
};