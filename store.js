// Cloud-Wortspeicher (Firestore). Echtzeit-Synchronisation über alle Geräte.
// Bilder werden als verkleinerte Data-URI direkt im Dokument gespeichert.
(function () {
  "use strict";

  var COL = "woerter";
  var db = window.EWDB;

  var cache = [];
  var listeners = [];
  var seeding = false;
  var readyOnce = false;
  var resolveReady;
  var ready = new Promise(function (res) { resolveReady = res; });

  function up(s) { return String(s || "").toUpperCase(); }

  function mapDoc(d) {
    var x = d.data() || {};
    return { id: d.id, wort: x.wort || "", bild: x.bild || "", kategorie: x.kategorie || "" };
  }

  function emit() {
    listeners.forEach(function (f) { try { f(cache); } catch (e) {} });
  }

  function subscribe(cb) {
    listeners.push(cb);
    cb(cache); // sofort mit aktuellem Stand
    return function () { listeners = listeners.filter(function (f) { return f !== cb; }); };
  }

  // Beim allerersten Mal (leere Sammlung) die 28 Grundwörter aus woerter.json anlegen.
  // Feste Dokument-IDs (b0..bN) => auch bei gleichzeitigem Seeden keine Duplikate.
  function seedBase() {
    if (seeding) return;
    seeding = true;
    fetch("woerter.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .catch(function () { return []; })
      .then(function (base) {
        var batch = db.batch();
        base.forEach(function (w, i) {
          batch.set(db.collection(COL).doc("b" + i), {
            wort: up(w.wort), bild: w.bild, kategorie: w.kategorie || "", created: i
          });
        });
        return batch.commit();
      })
      .catch(function (e) { console.warn("Seed fehlgeschlagen:", e); });
  }

  db.collection(COL).orderBy("created").onSnapshot(
    function (snap) {
      cache = snap.docs.map(mapDoc);
      emit();
      if (!readyOnce) { readyOnce = true; resolveReady(cache); }
      if (snap.empty && !seeding) { seedBase(); }
    },
    function (err) {
      console.warn("Firestore-Fehler:", err && err.code, err && err.message);
      if (!readyOnce) { readyOnce = true; resolveReady(cache); }
    }
  );

  function add(w) {
    return db.collection(COL).add({
      wort: up(w.wort), bild: w.bild || "", kategorie: w.kategorie || "", created: Date.now()
    });
  }

  function update(id, w) {
    var data = { wort: up(w.wort), kategorie: w.kategorie || "" };
    if (w.bild) data.bild = w.bild; // Bild nur ersetzen, wenn ein neues gewählt wurde
    return db.collection(COL).doc(id).update(data);
  }

  function remove(id) {
    return db.collection(COL).doc(id).delete();
  }

  function resetAll() {
    return db.collection(COL).get().then(function (snap) {
      var batch = db.batch();
      snap.docs.forEach(function (d) { batch.delete(d.ref); });
      return batch.commit();
    }).then(function () { seeding = false; seedBase(); });
  }

  function importMany(list) {
    var batch = db.batch();
    (list || []).forEach(function (w) {
      if (!w || !w.wort || !w.bild) return;
      batch.set(db.collection(COL).doc(), {
        wort: up(w.wort), bild: w.bild, kategorie: w.kategorie || "", created: Date.now()
      });
    });
    return batch.commit();
  }

  window.EWStore = {
    subscribe: subscribe,
    add: add, update: update, remove: remove,
    resetAll: resetAll, importMany: importMany,
    ready: ready,
    current: function () { return cache; }
  };

  // Regel: nur EXTERNE Links öffnen in einem neuen Tab (interne Navigation bleibt im Tab)
  document.addEventListener("DOMContentLoaded", function () {
    var host = location.host;
    [].forEach.call(document.querySelectorAll("a[href]"), function (a) {
      var href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href) && a.host !== host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });
  });
})();
