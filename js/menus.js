/* ══════════════════════════════════════════
   MENUS — dropdowns, modals toggle
   ══════════════════════════════════════════ */

var _profileOpen = false, _trafficOpen = false, _authOpen = false, _notiOpen = false, _switchOpen = false, _excludeMenuOpen = false;

function closeAllMenus() {
  _profileOpen = _trafficOpen = _authOpen = _notiOpen = _switchOpen = _excludeMenuOpen = false;
  document.querySelectorAll('.dropdown-menu.open').forEach(function(el) { el.classList.remove('open'); });
}

function toggleMenu(e, menuVarName, menuId) {
  e.stopPropagation();
  var wasOpen = window[menuVarName];
  closeAllMenus();
  if (!wasOpen) {
    window[menuVarName] = true;
    document.getElementById(menuId).classList.add('open');
  }
}

function toggleProfileMenu(e) { toggleMenu(e, '_profileOpen', 'profile-dropdown'); }
function toggleTrafficMenu(e)  { toggleMenu(e, '_trafficOpen', 'traffic-dropdown'); }
function toggleAuthMenu(e)     { toggleMenu(e, '_authOpen',    'auth-dropdown'); }
function toggleNoti(e)         { toggleMenu(e, '_notiOpen',    'noti-dropdown'); }
function toggleExcludeMenu(e)  { 
  if (typeof renderExcludeProfilesList === 'function') renderExcludeProfilesList();
  toggleMenu(e, '_excludeMenuOpen', 'exclude-dropdown'); 
}

function toggleSwitchMenu(e) {
  e.stopPropagation();
  if (sessionStorage.getItem('hun_known_founder') !== 'true') {
    document.getElementById('admin-deny-overlay').classList.add('open');
    closeAllMenus();
    return;
  }
  toggleMenu(e, '_switchOpen', 'switch-dropdown');
}

function closeAdminDenyModal() { document.getElementById('admin-deny-overlay').classList.remove('open'); }

function admGoLog(e) {
  e.stopPropagation();
  closeAllMenus();
  navPush('log');
  applyNav('log');
}

function doLogout(e) {
  if (e) e.stopPropagation();
  closeAllMenus();
  sessionStorage.removeItem('hun_known_founder');

  if (db) {
    db.ref('settings/counter_offsets').off();
    db.ref('logs').off();
    db.ref('notifications').off();
  }

  _loggedIn = false; _isAdmin = false; _hist = []; _hidx = -1;
  _currentLoginRole = 'normal'; _originalRole = 'normal';
  _sessionKeys = { view: null, normal: null, secondary: null, admin: null, founder: null };

  document.body.classList.remove('role-founder');
  document.getElementById('main-wrap').style.display   = 'none';
  document.getElementById('log-screen').style.display  = 'none';
  document.getElementById('nav-btns').style.display    = 'none';

  ['div-switch','cnt-switch','div-secret','cnt-secret','div-elevate','cnt-elevate',
   'div-shield','cnt-shield','div-noti','cnt-noti','div-traffic','cnt-traffic',
   'div-auth','cnt-auth','div-profile','cnt-profile'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  var pw = document.getElementById('pw-screen');
  pw.style.display = 'flex'; pw.style.opacity = '0';
  setTimeout(function() { pw.style.transition = 'opacity .3s'; pw.style.opacity = '1'; }, 10);

  if (db) fbListenOuter();
  var inp = document.getElementById('pw-input');
  inp.value = '';
  setTimeout(function() { inp.focus(); }, 350);
  updateNavBtns();
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.cnt') && !e.target.closest('.dropdown-menu') && !e.target.closest('#btn-exclude-menu')) {
    closeAllMenus();
  }
});