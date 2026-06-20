// ErsteWörter – Verwaltung (lokal, kein Backend)
// Alle Wörter (auch die Grundwörter) sind bearbeitbar: Wort, Kategorie, Bild.
(function () {
  "use strict";

  // ====== PIN HIER ÄNDERN ======
  var PIN = "1234";
  // =============================

  function $(id) { return document.getElementById(id); }

  // Anzeige: nur erster Buchstabe groß, Rest klein (z. B. "Fisch")
  function titleCase(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  var login = $("login");
  var panel = $("panel");
  var imgData = "";       // neu gewähltes Bild (Data-URI) oder ""
  var editId = null;      // wenn gesetzt: vorhandenes Wort wird bearbeitet

  // ---------- Login ----------
  $("login-btn").addEventListener("click", tryLogin);
  $("pin").addEventListener("keydown", function (e) {
    if (e.key === "Enter") tryLogin();
  });
  function tryLogin() {
    if ($("pin").value === PIN) {
      login.classList.remove("active");
      panel.classList.add("active");
      EWStore.ensure().then(render);
    } else {
      $("login-error").textContent = "Falsche PIN.";
      $("pin").value = "";
    }
  }

  // ---------- Bildauswahl (gestylter Knopf) ----------
  $("f-bild-btn").addEventListener("click", function () { $("f-bild").click(); });
  $("f-bild").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      imgData = reader.result;
      $("preview").src = imgData;
      $("preview").classList.add("show");
      $("f-bild-name").textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  // ---------- Hinzufügen / Speichern ----------
  $("add-btn").addEventListener("click", function () {
    var wort = $("f-wort").value.trim().toUpperCase();
    var kat = $("f-kat").value.trim();
    if (!wort) { msg("Bitte ein Wort eingeben."); return; }

    var list = EWStore.get() || [];

    if (editId) {
      // bestehendes Wort bearbeiten
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === editId) {
          list[i].wort = wort;
          list[i].kategorie = kat;
          if (imgData) list[i].bild = imgData; // Bild nur ersetzen, wenn neu gewählt
          break;
        }
      }
      EWStore.set(list);
      msg("„" + wort + "“ gespeichert ✓");
    } else {
      // neues Wort
      if (!imgData) { msg("Bitte ein Bild auswählen."); return; }
      list.push({ id: EWStore.uid(), wort: wort, bild: imgData, kategorie: kat });
      EWStore.set(list);
      msg("„" + wort + "“ hinzugefügt ✓");
    }
    resetForm();
    render();
  });

  $("cancel-btn").addEventListener("click", resetForm);

  function startEdit(id) {
    var list = EWStore.get() || [];
    var item = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { item = list[i]; break; } }
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
    var all = EWStore.get() || [];
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

    $("count").textContent = (list.length === all.length)
      ? all.length
      : (list.length + " von " + all.length);

    var box = $("list");
    box.innerHTML = "";
    if (list.length === 0) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = all.length ? "Keine Treffer." : "Noch keine Wörter.";
      box.appendChild(p);
    }

    list.forEach(function (w) {
      var row = document.createElement("div");
      row.className = "word-row" + (w.id === editId ? " editing" : "");

      var img = document.createElement("img");
      img.src = w.bild; img.className = "thumb"; img.alt = w.wort;

      var name = document.createElement("span");
      name.className = "word-name"; name.textContent = titleCase(w.wort);

      var cat = document.createElement("span");
      cat.className = "word-cat"; cat.textContent = w.kategorie || "";

      var actions = document.createElement("div");
      actions.className = "row-actions";

      var edit = document.createElement("button");
      edit.className = "edit-btn"; edit.textContent = "✏️"; edit.title = "Bearbeiten";
      edit.addEventListener("click", function () { startEdit(w.id); });

      var del = document.createElement("button");
      del.className = "del-btn"; del.textContent = "🗑️"; del.title = "Löschen";
      del.addEventListener("click", function () {
        var arr = (EWStore.get() || []).filter(function (x) { return x.id !== w.id; });
        EWStore.set(arr);
        if (editId === w.id) resetForm();
        render();
      });

      actions.appendChild(edit);
      actions.appendChild(del);
      row.appendChild(img);
      row.appendChild(name);
      row.appendChild(cat);
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
    var data = JSON.stringify(EWStore.get() || [], null, 2);
    var blob = new Blob([data], { type: "application/json" });
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
          EWStore.set(EWStore.normalize(data));
          resetForm();
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

  // ---------- Zurücksetzen ----------
  $("reset-btn").addEventListener("click", function () {
    if (!window.confirm("Alle Wörter auf die Grundwörter zurücksetzen? Deine eigenen Änderungen gehen verloren.")) return;
    EWStore.reset().then(function () {
      resetForm();
      render();
      msg("Auf Grundwörter zurückgesetzt ✓");
    });
  });
})();
