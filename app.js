// ErsteWörter – Lernspiel: Bild dem richtigen Wort zuordnen
// Es werden N Wörter angezeigt (frei wählbar 4–10). Die Bilder kommen einzeln;
// das passende Wort antippen, bis alle N Wörter "gefüllt" (gelöst) sind.
(function () {
  "use strict";

  var STORAGE_KEY = "ew_custom";

  var screens = {
    start: document.getElementById("screen-start"),
    game: document.getElementById("screen-game"),
    win: document.getElementById("screen-win"),
  };
  var countButtons = document.getElementById("count-buttons");
  var startBtn = document.getElementById("start-btn");
  var startHint = document.getElementById("start-hint");
  var imgEl = document.getElementById("q-image");
  var choicesEl = document.getElementById("choices");
  var progressEl = document.getElementById("progress");
  var feedbackEl = document.getElementById("feedback");

  var pool = [];        // alle verfügbaren Wörter (Basis + eigene)
  var roundWords = [];  // die N angezeigten Wörter (feste Reihenfolge der Buttons)
  var queue = [];       // Reihenfolge, in der die Bilder kommen
  var current = 0;      // Index aktuelles Bild in queue
  var filled = 0;       // wie viele Wörter schon gelöst
  var roundSize = 4;    // gewählte Anzahl Wörter
  var locked = false;   // sperrt Eingabe während Übergang
  var colorMode = "color"; // "color" = farbige Buttons, "white" = weiße Buttons
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

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* Sprachausgabe nicht verfügbar – ignorieren */ }
  }

  // ---------- Daten laden ----------
  function loadPool() {
    return fetch("woerter.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .catch(function () { return []; })
      .then(function (base) {
        var custom = [];
        try { custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) {}
        pool = base.concat(custom).filter(function (w) {
          return w && w.wort && w.bild;
        });
        return pool;
      });
  }

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
    roundWords = shuffle(pool).slice(0, roundSize); // N angezeigte Wörter
    queue = shuffle(roundWords.slice());            // Reihenfolge der Bilder
    current = 0;
    filled = 0;
    locked = false;
    show("game");
    renderChoices();
    renderProgress();
    showImage();
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
      b.textContent = (w.wort || "").toUpperCase();
      b.addEventListener("click", function () { onChoose(w.wort, b); });
      choicesEl.appendChild(b);
    });
  }

  function renderProgress() {
    progressEl.innerHTML = "";
    for (var i = 0; i < roundSize; i++) {
      var dot = document.createElement("span");
      dot.className = "dot" + (i < filled ? " done" : "");
      progressEl.appendChild(dot);
    }
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
      btn.classList.add("done");   // Wort ist "gefüllt"
      btn.disabled = true;
      feedbackEl.textContent = "✓";
      feedbackEl.className = "feedback ok";
      speak(correct);
      filled++;
      renderProgress();
      setTimeout(function () {
        current++;
        if (current >= roundSize) {
          show("win");
          speak("Super gemacht!");
        } else {
          showImage();
        }
      }, 950);
    } else {
      // falsch: rotes X + kurzes Wackeln; Wort bleibt wählbar (gehört zu einem späteren Bild)
      feedbackEl.textContent = "✗";
      feedbackEl.className = "feedback no";
      btn.classList.add("wrong");
      setTimeout(function () { btn.classList.remove("wrong"); }, 500);
    }
  }

  // ---------- Verdrahtung ----------
  startBtn.addEventListener("click", startRound);
  document.getElementById("play-again").addEventListener("click", startRound);
  document.getElementById("back-menu").addEventListener("click", function () { show("start"); });
  document.getElementById("quit-btn").addEventListener("click", function () { show("start"); });

  try { colorMode = localStorage.getItem("ew_color") || "color"; } catch (e) {}
  buildColorButtons();
  loadPool().then(function () {
    buildCountButtons();
    show("start");
  });
})();
