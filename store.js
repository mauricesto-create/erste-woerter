// Gemeinsamer Wort-Speicher (localStorage), genutzt von Spiel und Verwaltung.
// Beim ersten Start wird die Liste aus woerter.json (plus evtl. alter
// ew_custom-Liste) befüllt; danach sind ALLE Wörter voll bearbeitbar.
(function () {
  "use strict";
  var KEY = "ew_words";

  function uid() {
    return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }

  function set(list) {
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  function normalize(list) {
    return (list || [])
      .filter(function (w) { return w && w.wort && w.bild; })
      .map(function (w) {
        return {
          id: w.id || uid(),
          wort: String(w.wort).toUpperCase(),
          bild: w.bild,
          kategorie: w.kategorie || ""
        };
      });
  }

  function fetchBase() {
    return fetch("woerter.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .catch(function () { return []; });
  }

  // Liste laden; falls noch nicht vorhanden, aus woerter.json (+ alt ew_custom) befüllen
  function ensure() {
    return new Promise(function (resolve) {
      var existing = get();
      if (existing && existing.length) { resolve(existing); return; }
      fetchBase().then(function (base) {
        var custom = [];
        try { custom = JSON.parse(localStorage.getItem("ew_custom") || "[]"); } catch (e) {}
        var seed = normalize(base.concat(custom));
        set(seed);
        resolve(seed);
      });
    });
  }

  // Komplett auf die Grundwörter (woerter.json) zurücksetzen – lokale Änderungen verwerfen
  function reset() {
    return fetchBase().then(function (base) {
      var seed = normalize(base);
      set(seed);
      return seed;
    });
  }

  window.EWStore = {
    KEY: KEY, uid: uid, get: get, set: set,
    normalize: normalize, ensure: ensure, reset: reset
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
