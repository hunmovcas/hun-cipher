/* ══════════════════════════════════════════
   NOTIFICATIONS — listen, render, mark read, trash
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
      '<button style="position:absolute; right:8px; top:12px; background:none; border:none; cursor:pointer; color:rgba(192,57,43,0.5); padding:4px;" title="Delete" onclick="deleteNoti(\''+String(n._k)+'\', event)">✖</button>' +
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

function deleteNoti(key, e) {
  e.stopPropagation();
  if (!db) return;
  var noti = _allNoti.find(function(n) { return n._k === key; });
  if (!noti) return;
  
  var trashData = Object.assign({}, noti);
  delete trashData._k;
  trashData.deletedAt = Date.now();
  
  var updates = {};
  updates['trash/notifications/' + key] = trashData;
  updates['notifications/' + key] = null;
  db.ref().update(updates);
}

function openNotiTrash(e) {
  if (e) e.stopPropagation();
  closeAllMenus();
  document.getElementById('noti-trash-overlay').classList.add('open');
  var listEl = document.getElementById('noti-trash-list');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spin">⟳</span> Loading...</div>';
  
  if (!db) return;
  db.ref('trash/notifications').once('value', function(snap) {
    var now = Date.now(), items = [], toDelete = {};
    snap.forEach(function(c) {
      var val = c.val();
      // Giữ 7 ngày (7 * 24 * 60 * 60 * 1000 = 604800000 ms)
      if (val && now - (val.deletedAt||0) > 604800000) {
        toDelete['trash/notifications/' + c.key] = null;
      } else {
        items.push(Object.assign({ _k: c.key }, val||{}));
      }
    });
    
    if (Object.keys(toDelete).length > 0) db.ref().update(toDelete);
    items.sort(function(a,b) { return (b.deletedAt||0) - (a.deletedAt||0); });
    
    if (items.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Trash is empty.</div>';
    } else {
      listEl.innerHTML = items.map(function(item) {
        var delD = new Date(item.deletedAt);
        return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:8px 4px;">' +
          '<div style="max-width:250px;"><div style="font-size:11px;word-break:break-word;">'+esc(item.text)+'</div>' +
          '<span style="color:var(--muted);font-size:8px;">Del: '+delD.toLocaleString()+'</span></div>' +
          '<button style="padding:4px 8px;border:1px solid var(--secure);background:transparent;color:var(--secure);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:bold;font-size:10px;border-radius:3px;flex-shrink:0;" onclick="restoreNoti(\''+String(item._k)+'\')">Restore</button>' +
          '</div>';
      }).join('');
    }
  });
}

function closeNotiTrash() { document.getElementById('noti-trash-overlay').classList.remove('open'); }

function restoreNoti(key) {
  if (!db) return;
  db.ref('trash/notifications/' + key).once('value', function(snap) {
    var data = snap.val(); 
    if (!data) return;
    delete data.deletedAt;
    var updates = {}; 
    updates['notifications/' + key] = data; 
    updates['trash/notifications/' + key] = null;
    db.ref().update(updates, function(err) {
      if (!err) { showToast('✓ Notification restored!'); openNotiTrash(); }
    });
  });
}