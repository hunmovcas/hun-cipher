/* ══════════════════════════════════════════
   alias.js — Quản lý Identity Profiles
   Cho phép Founder gộp nhiều Device ID thành
   một profile có tên để dễ nhận diện.
   ══════════════════════════════════════════ */

// ── Tag Input Helpers ──

function renderAliasTags() {
  var wrapper = document.getElementById('alias-tags-wrapper');
  wrapper.innerHTML = _currentAliasTags.map(function(tag, idx) {
    return '<div class="alias-tag">' + esc(tag) +
           ' <span onclick="removeAliasTag(' + idx + ')">×</span></div>';
  }).join('');
}

function addAliasTag(val) {
  val = val.trim();
  if (val && _currentAliasTags.indexOf(val) === -1) {
    _currentAliasTags.push(val);
    renderAliasTags();
  }
  document.getElementById('alias-tag-input').value = '';
}

function removeAliasTag(idx) {
  _currentAliasTags.splice(idx, 1);
  renderAliasTags();
}

// ── Form State ──

function resetAliasForm() {
  _editingAlias = null;
  document.getElementById('alias-name-input').value = '';
  _currentAliasTags = [];
  renderAliasTags();
  document.getElementById('alias-tag-input').value = '';
  document.getElementById('btn-save-alias').textContent = 'Save Profile';
  document.getElementById('btn-cancel-alias').style.display = 'none';
}

function editAlias(name) {
  _editingAlias = name;
  document.getElementById('alias-name-input').value = name;
  var ids = (_aliases[name] || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  _currentAliasTags = ids;
  renderAliasTags();
  document.getElementById('btn-save-alias').textContent = 'Update Profile';
  document.getElementById('btn-cancel-alias').style.display = 'inline-block';
}

// ── Open / Close ──

function openAliasManager() {
  if (_isProtected) { showToast('System is protected!'); return; }
  closeAllMenus();
  renderAliasList();
  resetAliasForm();
  document.getElementById('alias-overlay').classList.add('open');
}

function closeAliasManager() {
  document.getElementById('alias-overlay').classList.remove('open');
}

// ── Render Profile List ──

function renderAliasList() {
  var listEl = document.getElementById('alias-list');
  var keys   = Object.keys(_aliases);

  if (keys.length === 0) {
    listEl.innerHTML = '<div style="color:var(--muted);font-style:italic;">No profiles created yet.</div>';
    return;
  }

  listEl.innerHTML = keys.map(function(aliasName) {
    var ids = _aliases[aliasName];
    return '<div style="border-bottom:1px solid var(--border);padding:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
             '<div style="flex:1;min-width:0;">' +
               '<strong style="color:var(--accent2);font-size:12px;">👤 ' + esc(aliasName) + '</strong>' +
               '<br><div style="font-size:9px;color:var(--muted);word-break:break-all;">' + esc(ids) + '</div>' +
             '</div>' +
             '<div style="display:flex;gap:4px;">' +
               '<button style="padding:4px 8px;background:var(--bg);border:1px solid var(--accent2);color:var(--accent2);border-radius:3px;cursor:pointer;font-weight:bold;font-size:9px;" onclick="editAlias(\'' + esc(aliasName) + '\')">Edit</button>' +
               '<button style="padding:4px 8px;background:var(--bg);border:1px solid var(--accent);color:var(--accent);border-radius:3px;cursor:pointer;font-weight:bold;font-size:9px;" onclick="deleteAlias(\'' + esc(aliasName) + '\')">Remove</button>' +
             '</div>' +
           '</div>';
  }).join('');
}

// ── Save Profile ──

function submitAlias() {
  if (_isProtected) { showToast('System is protected!'); return; }

  var aliasName = document.getElementById('alias-name-input').value.trim();
  if (!aliasName || _currentAliasTags.length === 0) {
    showToast('Please provide Profile Name and at least 1 Linked ID!');
    return;
  }

  var idsString = _currentAliasTags.join(', ');
  var updates   = {};

  // Nếu đang edit và đổi tên, xóa key cũ
  if (_editingAlias && _editingAlias !== aliasName) {
    updates['settings/aliases/' + _editingAlias] = null;
  }
  updates['settings/aliases/' + aliasName] = idsString;

  db.ref().update(updates, function(err) {
    if (err) showToast('⚠ Error saving Profile');
    else { showToast('✓ Profile Saved'); resetAliasForm(); }
  });
}

// ── Delete Profile ──

function deleteAlias(aliasName) {
  if (_isProtected) { showToast('System is protected!'); return; }
  if (confirm("Remove identity mapping for '" + aliasName + "'? Data will separate back into original IDs.")) {
    db.ref('settings/aliases/' + aliasName).remove(function(err) {
      if (!err) showToast('✓ Profile removed');
    });
  }
}

// ── Bind tag input events (gọi sau DOMContentLoaded) ──

function initAliasTagInput() {
  var aliasTagInput = document.getElementById('alias-tag-input');
  if (!aliasTagInput) return;

  aliasTagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAliasTag(this.value);
    }
  });

  aliasTagInput.addEventListener('paste', function(e) {
    e.preventDefault();
    var paste = (e.clipboardData || window.clipboardData).getData('text');
    paste.split(/[\n,;]+/).forEach(function(p) { addAliasTag(p); });
  });
}