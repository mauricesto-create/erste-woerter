// ErsteWörter – Verwaltung (Online via Firestore).
// Alle Wörter (auch die Grundwörter) sind bearbeitbar: Wort, Kategorie, Bild.
// Bilder werden vor dem Speichern verkleinert und online abgelegt.
(function () {
  "use strict";

  // ====== PIN HIER ÄNDERN ======
  var PIN = "1234";
  // =============================

  function $(id) { return document.getElementById(id); }
  function titleCase(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

  var login = $("login");
  var panel = $("panel");
  var imgData = "";     // verkleinertes Bild (Data-URI) oder ""
  var editId = null;    // wenn gesetzt: vorhandenes Wort wird bearbeitet
  var allWords = [];    // aktueller Cloud-Stand
  var unsub = null;

  // ---------- Login ----------
  $("login-btn").addEventListener("click", tryLogin);
  $("pin").addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });
  function tryLogin() {
    if ($("pin").value === PIN) {
      login.classList.remove("active");
      panel.classList.add("active");
      if (!unsub) {
        unsub = EWStore.subscribe(function (list) { allWords = list; render(); });
      }
    } else {
      $("login-error").textContent = "Falsche PIN.";
      $("pin").value = "";
    }
  }

  // ---------- Bild auswählen + verkleinern ----------
  $("f-bild-btn").addEventListener("click", function () { $("f-bild").click(); });
  $("f-bild").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    msg("Bild wird verkleinert…");
    resizeImage(file, 480, function (dataUri) {
      imgData = dataUri;
      $("preview").src = imgData;
      $("preview").classList.add("show");
      $("f-bild-name").textContent = file.name;
      msg("");
    });
  });

  // verkleinert ein Bild auf max. maxDim Pixel (Kante) und gibt eine kleine JPEG-Data-URI zurück
  function resizeImage(file, maxDim, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width || maxDim, h = img.height || maxDim;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        try { cb(canvas.toDataURL("image/jpeg", 0.82)); }
        catch (e) { cb(reader.result); }
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- Hinzufügen / Speichern ----------
  $("add-btn").addEventListener("click", function () {
    var wort = $("f-wort").value.trim().toUpperCase();
    var kat = $("f-kat").value.trim();
    if (!wort) { msg("Bitte ein Wort eingeben."); return; }

    if (editId) {
      msg("Speichert…");
      EWStore.update(editId, { wort: wort, kategorie: kat, bild: imgData })
        .then(function () { resetForm(); msg("Gespeichert ✓"); })
        .catch(failMsg);
    } else {
      if (!imgData) { msg("Bitte ein Bild auswählen."); return; }
      msg("Speichert…");
      EWStore.add({ wort: wort, kategorie: kat, bild: imgData })
        .then(function () { resetForm(); msg("Hinzugefügt ✓"); })
        .catch(failMsg);
    }
  });

  function failMsg(e) {
    var code = e && e.code ? e.code : "";
    if (code === "permission-denied") msg("Abgelehnt – bitte die Firestore-Regeln prüfen.");
    else msg("Speichern fehlgeschlagen (Internet?).");
    console.warn(e);
  }

  $("cancel-btn").addEventListener("click", resetForm);

  function startEdit(id) {
    var item = null;
    for (var i = 0; i < allWords.length; i++) { if (allWords[i].id === id) { item = allWords[i]; break; } }
    if (!item) return;
    editId = id;
    imgData = "";
    $("f-wort").value = titleCase(item.wort);
    $("f-kat").value = item.kategorie || "";
    $("preview").src = item.bild;
    $("preview").classList.add("show");
    $("f-bild-name").textContent = "Aktuelles Bild (zum Ändern neu wählen)";
    $("form-title").textContent = "Wort bearbeiten";
    $("add-btn").textContent = "💾 Speichern";
    $("cancel-btn").hidden = false;
    msg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    editId = null;
    imgData = "";
    $("f-wort").value = "";
    $("f-kat").value = "";
    $("f-bild").value = "";
    $("preview").src = "";
    $("preview").classList.remove("show");
    $("f-bild-name").textContent = "Keine Datei gewählt";
    $("form-title").textContent = "Neues Wort";
    $("add-btn").textContent = "➕ Hinzufügen";
    $("cancel-btn").hidden = true;
  }

  function msg(t) { $("form-msg").textContent = t; }

  // ---------- Filter ----------
  function buildCatFilter(all) {
    var sel = $("filter-cat");
    var current = sel.value;
    var cats = [];
    var seen = {};
    all.forEach(function (w) {
      var c = w.kategorie || "";
      if (c && !seen[c]) { seen[c] = true; cats.push(c); }
    });
    cats.sort();
    sel.innerHTML = '<option value="">Alle Kategorien</option>';
    cats.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
    sel.value = (cats.indexOf(current) !== -1) ? current : "";
  }

  $("filter-text").addEventListener("input", render);
  $("filter-cat").addEventListener("change", render);

  // ---------- Liste rendern ----------
  function render() {
    var all = allWords;
    buildCatFilter(all);

    var q = ($("filter-text").value || "").trim().toLowerCase();
    var cat = $("filter-cat").value || "";
    var list = all.filter(function (w) {
      var okText = !q
        || w.wort.toLowerCase().indexOf(q) !== -1
        || (w.kategorie || "").toLowerCase().indexOf(q) !== -1;
      var okCat = !cat || (w.kategorie || "") === cat;
      return okText && okCat;
    });

    $("count").textContent = (list.length === all.length) ? all.length : (list.length + " von " + all.length);

    var box = $("list");
    box.innerHTML = "";
    if (list.length === 0) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = all.length ? "Keine Treffer." : "Noch keine Wörter (oder lädt…).";
      box.appendChild(p);
    }

    list.forEach(function (w) {
      var row = document.createElement("div");
      row.className = "word-row" + (w.id === editId ? " editing" : "");

      var img = document.createElement("img");
      img.src = w.bild; img.className = "thumb"; img.alt = w.wort;

      var name = document.createElement("span");
      name.className = "word-name"; name.textContent = titleCase(w.wort);

      var cat2 = document.createElement("span");
      cat2.className = "word-cat"; cat2.textContent = w.kategorie || "";

      var actions = document.createElement("div");
      actions.className = "row-actions";

      var edit = document.createElement("button");
      edit.className = "edit-btn"; edit.textContent = "✏️"; edit.title = "Bearbeiten";
      edit.addEventListener("click", function () { startEdit(w.id); });

      var del = document.createElement("button");
      del.className = "del-btn"; del.textContent = "🗑️"; del.title = "Löschen";
      del.addEventListener("click", function () {
        if (editId === w.id) resetForm();
        EWStore.remove(w.id).catch(function (e) { console.warn(e); });
      });

      actions.appendChild(edit);
      actions.appendChild(del);
      row.appendChild(img);
      row.appendChild(name);
      row.appendChild(cat2);
      row.appendChild(actions);
      box.appendChild(row);
    });

    // Kategorie-Vorschläge (für das Formular) – aus allen Wörtern
    var seen = {};
    var dl = $("kat-list");
    dl.innerHTML = "";
    all.forEach(function (w) {
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
    var data = JSON.stringify(allWords.map(function (w) {
      return { wort: w.wort, bild: w.bild, kategorie: w.kategorie };
    }), null, 2);
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "meine-woerter.json"; a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Import (fügt Wörter online hinzu) ----------
  $("import-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          msg("Importiert…");
          EWStore.importMany(data)
            .then(function () { msg("Importiert ✓"); })
            .catch(function () { msg("Import fehlgeschlagen."); });
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

  // ---------- Zurücksetzen ----------
  $("reset-btn").addEventListener("click", function () {
    if (!window.confirm("Alle Wörter online auf die Grundwörter zurücksetzen? Eigene Änderungen gehen verloren.")) return;
    msg("Setzt zurück…");
    EWStore.resetAll()
      .then(function () { resetForm(); msg("Auf Grundwörter zurückgesetzt ✓"); })
      .catch(function () { msg("Zurücksetzen fehlgeschlagen."); });
  });
})();
