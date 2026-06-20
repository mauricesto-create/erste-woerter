// Firebase-Initialisierung (es wird nur Firestore genutzt).
// Hinweis: Der apiKey darf öffentlich im Code stehen – das ist kein Passwort,
// sondern nur die Projekt-Kennung. Die Absicherung läuft über die Firestore-Regeln.
(function () {
  "use strict";
  var firebaseConfig = {
    apiKey: "AIzaSyBrIaNwt_ibaw17LmtMP_NENkQ83NkHP-8",
    authDomain: "erste-woerter.firebaseapp.com",
    projectId: "erste-woerter",
    storageBucket: "erste-woerter.firebasestorage.app",
    messagingSenderId: "799516169744",
    appId: "1:799516169744:web:e0cef8a1c4605577779c95"
  };

  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  // Offline-Cache: App funktioniert nach dem ersten Laden auch ohne Netz weiter
  try { db.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
  window.EWDB = db;
})();
