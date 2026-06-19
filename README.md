# ErsteWörter 📚

Eine einfache, kindgerechte Web-App zum ersten Lesenlernen.
Es wird **ein Bild** gezeigt und darunter **4 Wörter** – das Kind tippt das passende Wort an.

- **Richtig** → grünes ✓, das Wort wird vorgelesen, nächstes Bild.
- **Falsch** → rotes ✗, das Wort wird gesperrt, das Kind versucht es erneut.
- Eine Runde ist geschafft, wenn **alle** Bilder gelöst sind → 🎉

Pro Runde sind **4 bis 10 Bilder** wählbar. Reine HTML/CSS/JavaScript-App,
**kein Backend**, kostenlos über GitHub Pages hostbar.

---

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Das Spiel |
| `admin.html` | Pflege-Seite (PIN-geschützt): Wörter + Bilder hinzufügen |
| `app.js` | Spiel-Logik |
| `admin.js` | Logik der Pflege-Seite |
| `style.css` | Aussehen (kindgerecht, große Buttons) |
| `woerter.json` | Die Grundwörter |
| `/bilder` | Die SVG-Bilder zu den Grundwörtern |

---

## Ein Wort hinzufügen

Es gibt **zwei Wege**:

### A) Bequem über die Pflege-Seite (empfohlen, kein Datei-Gefummel)

1. `admin.html` öffnen und die **PIN** eingeben (Standard: `1234`).
2. **Wort** eintippen, **Kategorie** wählen, **Bild hochladen** (Foto/JPG/PNG/SVG).
3. Auf **„➕ Hinzufügen"** tippen.

Das neue Wort erscheint **sofort** im Spiel – auf **diesem Gerät**.
Die Daten liegen im Browser (localStorage), es wird **nichts hochgeladen**.

> 💾 **Sichern:** Mit **„⬇️ Sichern"** lädst du deine eigenen Wörter als Datei
> (`meine-woerter.json`) herunter – als Backup oder um sie auf ein anderes Gerät
> zu bringen. Dort über **„⬆️ Importieren"** wieder einlesen.

### B) Fest in die App einbauen (für alle Geräte, via GitHub)

So werden Wörter Teil der App für **jeden** Besucher:

1. Bild in den Ordner `/bilder` legen (z. B. `bilder/katze.svg` oder `bilder/katze.jpg`).
2. In `woerter.json` einen Eintrag ergänzen:
   ```json
   { "wort": "KATZE", "bild": "bilder/katze.jpg", "kategorie": "Tiere" }
   ```
3. Änderungen committen und pushen – GitHub Pages aktualisiert sich automatisch.

> **Tipp:** Mindestens **4** Wörter müssen vorhanden sein, damit gespielt werden kann
> (es braucht immer 1 richtige + 3 falsche Auswahlmöglichkeiten).

---

## PIN ändern

In `admin.js` ganz oben:

```js
var PIN = "1234";
```

> ⚠️ Hinweis: Der PIN ist nur ein **Sichtschutz**, damit das Kind nicht aus Versehen
> in die Pflege-Seite kommt – **keine echte Sicherheit** (eine reine statische Seite
> kann das technisch nicht leisten).

---

## Lokal testen

Wegen des Ladens von `woerter.json` muss die App über einen **kleinen Webserver**
laufen (nicht per Doppelklick als `file://`):

```bash
# im Projektordner:
python -m http.server 8000
# dann im Browser öffnen:
# http://localhost:8000
```

---

## Auf GitHub Pages veröffentlichen

1. Repository anlegen (öffentlich), alle Dateien hochladen.
2. **Settings → Pages → Branch `main` / Ordner `/ (root)`** auswählen.
3. Nach kurzer Zeit ist die App unter
   `https://<benutzername>.github.io/<repo-name>/` erreichbar.
