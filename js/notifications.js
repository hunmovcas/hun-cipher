/* ══════════════════════════════════════════
   NOTIFICATIONS — listen, render, mark read
   ══════════════════════════════════════════ */

function fbListenNoti() {
  if (!db) return;
  db.ref('notifications').orderByChild('ts').limitToLast(20).on('value', function(snap) {
    _allNoti = [];
    var unreadCount = 0;
    snap.forEach(function(c) {
      var val = c.val();
      _allNoti.push(Object.assign({ _k: c.key }, val));
      if (!val.read) unreadCount++;
    });
    _allNoti.reverse();

    var numEl   = document.getElementById('num-noti');
    var cntNoti = document.getElementById('cnt-noti');
    if (unreadCount > 0) {
      numEl.textContent = unreadCount;
      numEl.style.display = 'inline-block';
      if (cntNoti) cntNoti.style.color = '#e74c3c';
    } else {
      numEl.style.display = 'none';
      if (cntNoti) cntNoti.style.color = 'var(--accent)';
    }
    renderNotiList();
  });
}

function renderNotiList() {
  var listEl = document.getElementById('noti-list');
  if (_allNoti.length === 0) {
    listEl.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:10px;">No new notifications</div>';
    return;
  }
  listEl.innerHTML = _allNoti.map(function(n) {
    var d = new Date(n.ts);
    var timeStr = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return '<div class="noti-item ' + (n.read ? '' : 'unread') + '">' +
      '<div>' + esc(n.text) + '</div>' +
      '<div class="noti-time">' + timeStr + '</div>' +
      '</div>';
  }).join('');
}

function markAllNotiRead(e) {
  e.stopPropagation();
  if (!db) return;
  var updates = {};
  _allNoti.forEach(function(n) { if (!n.read) updates[n._k + '/read'] = true; });
  db.ref('notifications').update(updates);
}