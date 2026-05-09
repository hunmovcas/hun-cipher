/* ══════════════════════════════════════════
   CONFIG — Firebase, defaults, password hashes
   ══════════════════════════════════════════ */

var firebaseConfig = {
  apiKey:            "AIzaSyD8ttUULzdFqPLmeK2J9JOGfEzzG949k8I",
  authDomain:        "hun-cipher.firebaseapp.com",
  databaseURL:       "https://hun-cipher-default-rtdb.firebaseio.com",
  projectId:         "hun-cipher",
  storageBucket:     "hun-cipher.firebasestorage.app",
  messagingSenderId: "1049763241075",
  appId:             "1:1049763241075:web:b5696c5bb26366f3ee9e06"
};

var defaultHints      = { hint1: "Howl's Moving Castle", hint2: "Cristiano Ronaldo Neymar" };
var defaultPopups     = { wrong: "Sorry! You're not the one I'm looking for.", close: "Come on! Almost there..." };
var defaultNotes      = { tagline: "♡ For keyholders only ♡", footer: "Encrypted for the masses, <span>decrypted by one</span>" };
var defaultSecretMsgs = {
  normal:    "Hint Admin: Justin Bieber + Deep Sea.",
  secondary: "00936382 61215232 81424374 53636352 7463 32217493!",
  admin:     "You complete me <3",
  founder:   "You complete me <3"
};
var defaultTabTitle  = "Secret Cipher";
var defaultMainTitle = "The <em>Secret</em><br>Cipher";
var defaultWelcome   = "🎏 ✿ WELCOME TO MY PAGE ✿ 🎏";

// Populated at runtime from Firebase
var currentHashes     = { normal: '', secondary: '', admin: '', founder: '' };
var currentHints      = Object.assign({}, defaultHints);
var currentPopups     = Object.assign({}, defaultPopups);
var currentNotes      = Object.assign({}, defaultNotes);
var currentSecretMsgs = Object.assign({}, defaultSecretMsgs);
var currentTabTitle   = defaultTabTitle;
var currentMainTitle  = defaultMainTitle;
var currentWelcome    = defaultWelcome;