// ErsteWörter – Verwaltung (lokal, kein Backend)
(function () {
  "use strict";

  // ====== PIN HIER ÄNDERN ======
  var PIN = "1234";
  // =============================

  var STORAGE_KEY = "ew_custom";
  function $(id) { return document.getElementById(id); }

  var login = $("login");
  var panel = $("panel");
  var imgData = "";

  // ---------- Login ----------
  $("login-btn").addEventListener("click", tryLogin);
  $("pin").addEventListener("keydown", function (e) {
    if (e.key === "Enter") tryLogin();
  });
  function tryLogin() {
    if ($("pin").value === PIN) {
      login.classList.remove("active");
      panel.classList.add("active");
      render();
    } else {
      $("login-error").textContent = "Falsche PIN.";
      $("pin").value = "";
    }
  }

  // ---------- Speicher ----------
  function getCustom() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setCustom(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // ---------- Bildauswahl ----------
  $("f-bild").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      imgData = reader.result;
      $("preview").src = imgData;
      $("preview").classList.add("show");
    };
    reader.readAsDataURL(file);
  });

  // ---------- Hinzufügen ----------
  $("add-btn").addEventListener("click", function () {
    var wort = $("f-wort").value.trim().toUpperCase();
    var kat = $("f-kat").value.trim() || "Eigene";
    if (!wort) { msg("Bitte ein Wort eingeben."); return; }
    if (!imgData) { msg("Bitte ein Bild auswählen."); return; }

    var arr = getCustom();
    arr.push({ wort: wort, bild: imgData, kategorie: kat });
    setCustom(arr);

    $("f-wort").value = "";
    $("f-kat").value = "";
    $("f-bild").value = "";
    imgData = "";
    $("preview").src = "";
    $("preview").classList.remove("show");
    msg("„" + wort + "“ hinzugefügt ✓");
    render();
  });

  function msg(t) { $("form-msg").textContent = t; }

  // ---------- Liste rendern ----------
  function render() {
    var arr = getCustom();
    $("count").textContent = arr.length;

    var list = $("list");
    list.innerHTML = "";
    if (arr.length === 0) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Noch keine eigenen Wörter.";
      list.appendChild(p);
    }

    arr.forEach(function (w, index) {
      var row = document.createElement("div");
      row.className = "word-row";

      var img = document.createElement("img");
      img.src = w.bild; img.className = "thumb"; img.alt = w.wort;

      var name = document.createElement("span");
      name.className = "word-name"; name.textContent = w.wort;

      var cat = document.createElement("span");
      cat.className = "word-cat"; cat.textContent = w.kategorie || "";

      var del = document.createElement("button");
      del.className = "del-btn"; del.textContent = "🗑️";
      del.title = "Löschen";
      del.addEventListener("click", function () {
        var a = getCustom();
        a.splice(index, 1);
        setCustom(a);
        render();
      });

      row.appendChild(img);
      row.appendChild(name);
      row.appendChild(cat);
      row.appendChild(del);
      list.appendChild(row);
    });

    // Kategorie-Vorschläge
    var seen = {};
    var dl = $("kat-list");
    dl.innerHTML = "";
    arr.forEach(function (w) {
      if (w.kategorie && !seen[w.kategorie]) {
        seen[w.kategorie] = true;
        var o = document.createElement("option");
        o.value = w.kategorie;
        dl.appendChild(o);
      }
    });
  }

  // ---------- Export ----------
  $("export-btn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(getCustom(), null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "meine-woerter.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Import ----------
  $("import-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          setCustom(data);
          render();
          msg("Importiert ✓");
        } else {
          msg("Datei hat das falsche Format.");
        }
      } catch (err) {
        msg("Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
})();
