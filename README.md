# 🔐 Secret Cipher Project
Dự án cá nhân về công cụ mã hóa và giải mật mã, được xây dựng để sử dụng nội bộ và quản lý quyền truy cập.

## 📁 Cấu trúc thư mục
Dự án được quy hoạch lại theo cấu trúc module để dễ dàng mở rộng tính năng sắp tới:

secret-cipher/
├── index.html ← Chỉ còn lại khung HTML + import
│
├── css/
│ ├── variables.css ← :root variables, reset
│ ├── layout.css ← body, wrap, header, card, tabs
│ ├── components.css ← dropdown, dialog, badge, button, toast
│ ├── screens.css ← pw-screen, log-screen, main-wrap
│ └── animations.css ← spin, sparkle, transitions
│
├── js/
│ ├── config.js ← firebaseConfig, defaultHints, defaultPopups...
│ ├── state.js ← Tất cả biến toàn cục (_sessionKeys, _allLogs...)
│ ├── firebase.js ← initFirebase(), fbIncrement(), fbListenAll()...
│ ├── auth.js ← checkPw(), submitElevate(), switchRole()...
│ ├── ui.js ← renderHints(), renderTitle(), updateStatsUI()...
│ ├── menus.js ← toggleMenu(), closeAllMenus(), toggleNoti()...
│ ├── logs.js ← loadLogs(), renderLogs(), renderIpStats()...
│ ├── alias.js ← openAliasManager(), submitAlias()...
│ ├── cipher.js ← run(), setMode(), clr(), cp()...
│ ├── nav.js ← navPush(), navUndo(), applyNav()...
│ ├── geo.js ← _fetchGeo(), _detectDevice(), _detectBrowser()...
│ └── app.js ← initApp() — điểm khởi tạo, gọi tất cả các module khác
│
└── (cấu hình Firebase riêng)

## 🚀 Công nghệ sử dụng
* HTML5, CSS3, JavaScript (ES6).
* Firebase Realtime Database.
* SHA-256 Password Hashing, Thuật toán Cipher tùy chỉnh.
* VS Code, Git/GitHub, Live Server.

## 📝 Ghi chú
Dự án đang trong quá trình nâng cấp hệ thống phân quyền 7 cấp độ và tích hợp chế độ Ingame.