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
| `store.js` | Gemeinsamer Wort-Speicher (localStorage), von Spiel + Pflege genutzt |
| `style.css` | Aussehen (kindgerecht, große Buttons) |
| `woerter.json` | Die Grundwörter (Startbestand) |
| `/bilder` | Die SVG-Bilder zu den Grundwörtern |

---

## Wörter verwalten (hinzufügen / bearbeiten / löschen)

Über die Pflege-Seite lassen sich **alle** Wörter bearbeiten – auch die Grundwörter,
inkl. Bild. Es wird **nichts hochgeladen**, alles liegt im Browser des Geräts
(localStorage). Damit hat jedes Gerät seine eigene Wortliste.

1. `admin.html` öffnen (oder im Spiel unten **„⚙️ Wörter verwalten"**) und **PIN** eingeben (Standard: `1234`).
2. **Hinzufügen:** Wort eintippen, Kategorie wählen, **„📷 Bild wählen"** (Foto/JPG/PNG/SVG), dann **„➕ Hinzufügen"**.
3. **Bearbeiten:** in der Liste auf **✏️** tippen – Wort/Kategorie ändern, optional ein neues Bild wählen, **„💾 Speichern"**. Ohne neues Bild bleibt das alte erhalten.
4. **Löschen:** in der Liste auf **🗑️** tippen.

Neue/geänderte Wörter erscheinen **sofort** im Spiel (auf diesem Gerät).

> 💾 **Sichern / Übertragen:** **„⬇️ Sichern"** lädt die komplette Wortliste als
> `meine-woerter.json` herunter (Backup oder Gerätewechsel). Auf dem anderen Gerät
> über **„⬆️ Importieren"** einlesen.
>
> ♻️ **Zurücksetzen** stellt wieder die Grundwörter aus `woerter.json` her
> (verwirft lokale Änderungen).

### Grundbestand fest ändern (für alle Geräte, via GitHub)

Die **Startwörter** (die jedes neue Gerät zuerst sieht) stehen in `woerter.json`:
Bild nach `/bilder` legen und einen Eintrag ergänzen, dann committen/pushen:

```json
{ "wort": "KATZE", "bild": "bilder/katze.jpg", "kategorie": "Tiere" }
```

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
