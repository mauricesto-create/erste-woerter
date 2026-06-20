# ErsteWörter 📚

Eine einfache, kindgerechte Web-App zum ersten Lesenlernen.
Es wird **ein Bild** gezeigt und darunter **4 Wörter** – das Kind tippt das passende Wort an.

- **Richtig** → grünes ✓, das Wort wird vorgelesen, nächstes Bild.
- **Falsch** → rotes ✗, das Wort wird gesperrt, das Kind versucht es erneut.
- Eine Runde ist geschafft, wenn **alle** Bilder gelöst sind → 🎉

Pro Runde sind **4 bis 10 Wörter** wählbar. HTML/CSS/JavaScript-App auf GitHub
Pages, Wörter & Bilder werden **online in Firebase Firestore** gespeichert und über
alle Geräte synchronisiert (kostenloser Firebase-Tarif).

---

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Das Spiel |
| `admin.html` | Pflege-Seite (PIN-geschützt): Wörter + Bilder hinzufügen |
| `app.js` | Spiel-Logik |
| `admin.js` | Logik der Pflege-Seite |
| `firebase-config.js` | Firebase-Initialisierung (Projekt-Config) |
| `store.js` | Online-Wortspeicher (Firestore), Echtzeit-Sync, von Spiel + Pflege genutzt |
| `style.css` | Aussehen (kindgerecht, große Buttons) |
| `woerter.json` | Grundwörter-Vorlage (wird beim ersten Start einmalig in die Cloud übernommen) |
| `/bilder` | Die SVG-Bilder zu den Grundwörtern |

---

## Wörter verwalten (hinzufügen / bearbeiten / löschen)

Über die Pflege-Seite lassen sich **alle** Wörter bearbeiten – auch die Grundwörter,
inkl. Bild. Alles wird **online** gespeichert (Firebase Firestore) und ist damit
**auf allen Geräten** sichtbar. Hochgeladene Bilder werden automatisch verkleinert.

1. `admin.html` öffnen (oder im Spiel unten **„⚙️ Wörter verwalten"**) und **PIN** eingeben (Standard: `1234`).
2. **Hinzufügen:** Wort eintippen, Kategorie wählen, **„📷 Bild wählen"** (Foto/JPG/PNG/SVG), dann **„➕ Hinzufügen"**.
3. **Bearbeiten:** in der Liste auf **✏️** tippen – Wort/Kategorie ändern, optional ein neues Bild wählen, **„💾 Speichern"**. Ohne neues Bild bleibt das alte erhalten.
4. **Löschen:** in der Liste auf **🗑️** tippen.
5. **Filter:** Suchfeld + Kategorie-Auswahl über der Liste.

Neue/geänderte Wörter erscheinen **sofort und überall** (Echtzeit-Sync).

> 💾 **Sichern:** **„⬇️ Sichern"** lädt die komplette Wortliste als `meine-woerter.json`
> herunter (Backup). **„⬆️ Importieren"** fügt Wörter aus einer solchen Datei wieder hinzu.
>
> ♻️ **Zurücksetzen** stellt online wieder die Grundwörter her (verwirft alle Änderungen).

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

---

## Online-Speicher (Firebase)

Wörter & Bilder liegen in **Firebase Firestore** (Collection `woerter`). Die Projekt-Config
steht in `firebase-config.js` (der `apiKey` darf öffentlich sein – kein Passwort).

Beim allerersten Start (leere Collection) werden die 28 Grundwörter aus `woerter.json`
automatisch in die Cloud übernommen. Bilder werden vor dem Speichern auf max. 480 px
verkleinert und als kleine JPEG-Data-URI direkt im Dokument abgelegt.

**Firestore-Regeln** (Console → Firestore → Regeln): öffentliches Lesen, Schreiben nur
mit gültigem Eintrag (es gibt keinen Login – die PIN ist nur ein Sichtschutz):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /woerter/{id} {
      allow read: if true;
      allow delete: if true;
      allow create, update: if
        request.resource.data.wort is string
        && request.resource.data.wort.size() > 0
        && request.resource.data.wort.size() <= 40
        && request.resource.data.bild is string
        && request.resource.data.bild.size() <= 900000;
    }
  }
}
```
