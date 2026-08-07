# Deployment (eigener Server, nicht Cloudflare)

Dieses Werkzeug braucht ffmpeg, einen echten Chromium-Browser (Playwright) und Python-ML-Modelle
(Piper/faster-whisper) - das läuft **nicht** auf Cloudflare Workers/Pages wie `website/`/`worker/`
(kein Dateisystem, keine nativen Binaries, harte Zeitlimits dort). Deshalb ein eigener, kleiner
Server (VPS). Anleitung für Hetzner Cloud (günstig, EU, gute Doku) - jeder andere
Ubuntu-22.04/24.04-VPS (Contabo, Netcup, DigitalOcean, ...) funktioniert genauso.

**Kosten:** kleinster brauchbarer Hetzner-Server (CX22, 2 vCPU/4GB RAM) ~4,35€/Monat. Domain
falls noch keine vorhanden ist, sonst reicht eine Subdomain der bestehenden.

## Überblick, was am Ende steht

```
Browser (du) --HTTPS--> Caddy (Port 443, Passwortabfrage, Let's-Encrypt-Zertifikat)
                             |
                             '--> node web/server.mjs (Port 5177, nur intern, 127.0.0.1)
```

Der Node-Server bleibt bewusst nur intern erreichbar (`127.0.0.1`, so ist es im Code bereits
fest eingestellt) - Caddy ist die einzige Tür von außen und übernimmt HTTPS + Passwortschutz.
So muss der Node-Code nicht selbst um Auth-Logik erweitert werden, und ein Fehler in der Firewall
öffnet nicht sofort das ganze Tool ungeschützt.

## 1. Server anlegen

1. Bei [Hetzner Cloud](https://console.hetzner.cloud) einen Server erstellen: Ubuntu 24.04,
   Typ CX22, Standort Nürnberg/Falkenstein (EU, DSGVO-nah), SSH-Key hochladen (nicht Passwort-Login).
2. Einloggen: `ssh root@<server-ip>`

## 2. Server absichern (einmalig)

```bash
apt update && apt upgrade -y

# Firewall: nur SSH, HTTP, HTTPS von außen - Port 5177 (das Dashboard selbst) bleibt zu
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Eigenen Nutzer statt dauerhaft als root arbeiten
adduser overhertz
usermod -aG sudo overhertz
```

Ab hier als `overhertz`-Nutzer weiter (`su - overhertz`), nicht mehr als root.

## 3. Abhängigkeiten installieren

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Python, ffmpeg, espeak-ng, Playwright-Systemabhängigkeiten, git
sudo apt install -y python3 python3-venv python3-pip ffmpeg espeak-ng git
```

## 4. Repo holen und Pipeline einrichten

```bash
git clone https://github.com/coulrophobia66666/Trackstar.git
cd Trackstar/tools/video-pipeline

npm install
# Echte Playwright-Browser-Installation (auf einem normalen Server ohne die
# Einschraenkungen dieser Sandbox unproblematisch):
npx playwright install --with-deps chromium

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
```

Falls du eine bessere Stimme willst (statt `espeak-ng`-Fallback):

```bash
source .venv/bin/activate
python3 -m piper.download_voices --download-dir voices de_DE-thorsten-high
deactivate
```

## 5. Dashboard dauerhaft laufen lassen (systemd)

Läuft sonst nur, solange die SSH-Sitzung offen ist. Mit systemd startet es automatisch beim
Boot neu und läuft im Hintergrund weiter.

```bash
sudo tee /etc/systemd/system/overhertz-video.service > /dev/null <<'EOF'
[Unit]
Description=Overhertz Video-Pipeline Dashboard
After=network.target

[Service]
Type=simple
User=overhertz
WorkingDirectory=/home/overhertz/Trackstar/tools/video-pipeline
# Falls du ElevenLabs nutzt: Key hier eintragen (Datei ist nur fuer root/den Dienst lesbar,
# nicht im Git-Repo, nie committen)
Environment=ELEVENLABS_API_KEY=
ExecStart=/usr/bin/node web/server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now overhertz-video
sudo systemctl status overhertz-video   # sollte "active (running)" zeigen
```

## 6. Domain einrichten

Beim Domain-/DNS-Anbieter einen A-Record anlegen, der auf die Server-IP zeigt, z. B.:

```
video.overhertz.app   A   <server-ip>
```

(Subdomain der bestehenden Domain reicht völlig - kein zweiter Domainkauf nötig.)

## 7. Caddy installieren (HTTPS + Passwortschutz, automatisch)

Caddy holt automatisch ein Let's-Encrypt-Zertifikat und erneuert es selbst - kein manuelles
Zertifikats-Handling nötig.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Passwort-Hash erzeugen (das eigentliche Passwort landet nirgends im Klartext in einer Datei):

```bash
caddy hash-password
# Passwort eingeben, den ausgegebenen Hash fuer den naechsten Schritt kopieren
```

Caddy konfigurieren:

```bash
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
video.overhertz.app {
    basic_auth {
        finn <HIER_DEN_HASH_AUS_caddy_hash-password_EINFUEGEN>
    }
    reverse_proxy 127.0.0.1:5177
}
EOF

sudo systemctl restart caddy
sudo systemctl status caddy
```

## 8. Testen

Im Browser `https://video.overhertz.app` öffnen - Passwortabfrage sollte erscheinen (Nutzer
`finn`, das Passwort von eben), danach das Dashboard wie lokal.

## Laufender Betrieb

- **Aktualisieren** (nach neuen Commits): `cd Trackstar && git pull && sudo systemctl restart overhertz-video`
- **Logs ansehen**: `sudo journalctl -u overhertz-video -f`
- **Speicherplatz im Blick behalten**: `out/`, `uploads/` und `voices/` wachsen mit jeder
  Produktion. Regelmäßig aufräumen, z. B. per Cronjob (`crontab -e`):
  ```
  0 4 * * 0 find /home/overhertz/Trackstar/tools/video-pipeline/out -mtime +30 -delete
  ```
  (löscht jeden Sonntag um 4 Uhr alles in `out/`, was älter als 30 Tage ist - Intervall/Ordner
  nach Bedarf anpassen)
- **Absichtlich nicht gemacht**: der Node-Server selbst bekommt keine eigene Login-Logik - der
  Schutz sitzt komplett bei Caddy davor. Port 5177 darf deshalb nie in der Firewall geöffnet
  werden (`ufw` lässt ihn wie oben eingerichtet zu).
