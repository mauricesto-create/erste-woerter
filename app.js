// ErsteWörter – Lernspiel: Bild dem richtigen Wort zuordnen
// Es werden N Wörter angezeigt (frei wählbar 4–10). Die Bilder kommen einzeln;
// das passende Wort antippen, bis alle N Wörter "gefüllt" (gelöst) sind.
(function () {
  "use strict";

  var screens = {
    start: document.getElementById("screen-start"),
    game: document.getElementById("screen-game"),
    win: document.getElementById("screen-win"),
  };
  var crumbs = document.getElementById("crumbs");
  var countButtons = document.getElementById("count-buttons");
  var startBtn = document.getElementById("start-btn");
  var startHint = document.getElementById("start-hint");
  var imgEl = document.getElementById("q-image");
  var choicesEl = document.getElementById("choices");
  var progressEl = document.getElementById("progress");
  var feedbackEl = document.getElementById("feedback");

  var pool = [];        // alle Wörter (aus dem Speicher)
  var roundWords = [];  // die N angezeigten Wörter
  var queue = [];       // Reihenfolge der Bilder
  var current = 0;
  var filled = 0;
  var roundSize = 4;
  var locked = false;
  var colorMode = "color";     // "color" | "white"
  var hasRound = false;        // ist eine Runde aktiv?
  var finished = false;        // Runde gewonnen?
  // Spalten pro Reihe je nach Wortanzahl (saubere Reihen)
  var COLS = { 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 3, 10: 5 };

  // ---------- Hilfsfunktionen ----------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.remove("active");
    });
    screens[name].classList.add("active");
  }

  // Anzeige: nur erster Buchstabe groß, Rest klein (z. B. "Fisch")
  function titleCase(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* Sprachausgabe nicht verfügbar */ }
  }

  // ---------- Navigation / Unter-URLs (Hash) ----------
  function viewFromHash() {
    var h = (location.hash || "").replace("#", "");
    return h === "spiel" ? "game" : h === "fertig" ? "win" : "start";
  }

  function updateCrumbs(view) {
    if (view === "game") {
      crumbs.innerHTML = '<a href="#start">🏠 Start</a> <span class="sep">›</span> <span class="here">Spiel</span>';
    } else if (view === "win") {
      crumbs.innerHTML = '<a href="#start">🏠 Start</a> <span class="sep">›</span> <span class="here">🎉 Geschafft</span>';
    } else {
      crumbs.innerHTML = '<span class="here">🏠 Start</span>';
    }
  }

  function renderRoute() {
    var view = viewFromHash();
    // Schutz: Spiel/Gewonnen nur bei passendem Zustand, sonst zurück zum Start
    if (view === "game" && !(hasRound && !finished)) view = "start";
    if (view === "win" && !finished) view = "start";
    if (view === "start") {
      hasRound = false;
      finished = false;
      if (location.hash && location.hash !== "#start") {
        history.replaceState(null, "", "#start");
      }
    }
    show(view);
    updateCrumbs(view);
  }

  function navigate(view) {
    var hash = view === "game" ? "spiel" : view === "win" ? "fertig" : "start";
    if ((location.hash || "#start").replace("#", "") === hash) {
      renderRoute();
    } else {
      location.hash = hash; // löst hashchange -> renderRoute
    }
  }

  window.addEventListener("hashchange", renderRoute);

  // ---------- Startbildschirm ----------
  function buildCountButtons() {
    var max = Math.min(10, pool.length);
    countButtons.innerHTML = "";

    if (pool.length < 4) {
      startHint.textContent = "Es werden mindestens 4 Wörter benötigt. Bitte im Admin weitere hinzufügen.";
      startBtn.disabled = true;
      return;
    }
    startBtn.disabled = false;
    startHint.textContent = "";
    if (roundSize > max) roundSize = max;

    for (var n = 4; n <= max; n++) {
      (function (value) {
        var b = document.createElement("button");
        b.className = "count-btn" + (value === roundSize ? " selected" : "");
        b.textContent = value;
        b.addEventListener("click", function () {
          roundSize = value;
          var kids = countButtons.children;
          for (var i = 0; i < kids.length; i++) {
            kids[i].classList.toggle("selected", Number(kids[i].textContent) === value);
          }
        });
        countButtons.appendChild(b);
      })(n);
    }
  }

  function buildColorButtons() {
    var btns = document.querySelectorAll("#color-buttons .opt-btn");
    btns.forEach(function (b) {
      b.classList.toggle("selected", b.getAttribute("data-mode") === colorMode);
      b.addEventListener("click", function () {
        colorMode = b.getAttribute("data-mode");
        try { localStorage.setItem("ew_color", colorMode); } catch (e) {}
        btns.forEach(function (x) {
          x.classList.toggle("selected", x.getAttribute("data-mode") === colorMode);
        });
      });
    });
  }

  // ---------- Spiel ----------
  function startRound() {
    roundWords = shuffle(pool).slice(0, roundSize);
    queue = shuffle(roundWords.slice());
    current = 0;
    filled = 0;
    locked = false;
    finished = false;
    renderChoices();
    renderProgress();
    showImage();
    hasRound = true;
    navigate("game");
  }

  function renderProgress() {
    progressEl.innerHTML = "";
    for (var i = 0; i < roundSize; i++) {
      var dot = document.createElement("span");
      dot.className = "dot" + (i < filled ? " done" : "");
      progressEl.appendChild(dot);
    }
  }

  function renderChoices() {
    choicesEl.innerHTML = "";
    // Spaltenzahl je nach Wortanzahl + weiß/farbig
    var cols = COLS[roundWords.length] || 3;
    choicesEl.className = "choices c" + cols + (colorMode === "white" ? " plain" : "");
    choicesEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    roundWords.forEach(function (w) {
      var b = document.createElement("button");
      b.className = "choice";
      b.textContent = titleCase(w.wort);
      b.addEventListener("click", function () { onChoose(w.wort, b); });
      choicesEl.appendChild(b);
    });
  }

  function showImage() {
    locked = false;
    feedbackEl.className = "feedback";
    feedbackEl.textContent = "";
    var item = queue[current];
    imgEl.src = item.bild;
    imgEl.alt = item.wort;
  }

  function onChoose(word, btn) {
    if (locked || btn.disabled) return;
    var correct = queue[current].wort;

    if (word === correct) {
      locked = true;
      btn.classList.remove("wrong");
      btn.classList.add("done");
      btn.disabled = true;
      feedbackEl.textContent = "✓";
      feedbackEl.className = "feedback ok";
      speak(correct);
      filled++;
      renderProgress();
      setTimeout(function () {
        current++;
        if (current >= roundSize) {
          finished = true;
          navigate("win");
          speak("Super gemacht!");
        } else {
          showImage();
        }
      }, 950);
    } else {
      feedbackEl.textContent = "✗";
      feedbackEl.className = "feedback no";
      btn.classList.add("wrong");
      setTimeout(function () { btn.classList.remove("wrong"); }, 500);
    }
  }

  // ---------- Verdrahtung ----------
  startBtn.addEventListener("click", startRound);
  document.getElementById("play-again").addEventListener("click", startRound);
  document.getElementById("back-menu").addEventListener("click", function () { navigate("start"); });
  document.getElementById("quit-btn").addEventListener("click", function () { navigate("start"); });

  try { colorMode = localStorage.getItem("ew_color") || "color"; } catch (e) {}
  buildColorButtons();
  EWStore.ensure().then(function (list) {
    pool = list;
    buildCountButtons();
    renderRoute(); // Ansicht aus dem Hash herstellen (normalerweise Start)
  });
})();
