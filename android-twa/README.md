# Green Express — TWA Android

Wrapper Android (APK / AAB) qui embarque la PWA `green-express-iota.vercel.app` dans une **Trusted Web Activity** : aucun bandeau Chrome, pleine écran, notifications natives FCM, installable depuis le Play Store.

L'app reste **la même PWA web** : aucun code Android à maintenir, juste cette config.

---

## Pré-requis (une seule fois)

| Outil | Version | Installation |
|---|---|---|
| **Node.js** | 18+ | https://nodejs.org |
| **JDK** | 17 | https://adoptium.net (Eclipse Temurin 17) |
| **Android Studio** *(optionnel mais recommandé)* | dernière | https://developer.android.com/studio |
| **Android SDK Platform-Tools** *(pour `adb` install local)* | dernière | inclus avec Android Studio |

Vérification :

```powershell
node --version    # >= 18
java -version     # 17.x
```

Variables d'environnement attendues par Bubblewrap (Android Studio les définit déjà) :

```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17...
ANDROID_HOME=C:\Users\<toi>\AppData\Local\Android\Sdk
```

---

## Étapes (1ère initialisation)

### 1. Initialiser le projet Bubblewrap

```powershell
cd c:\SERVICE\android-twa
.\build.ps1 -Action init
```

Bubblewrap va :
- télécharger le manifest PWA depuis `https://green-express-iota.vercel.app/manifest.webmanifest`
- générer un projet Android + un keystore `android.keystore`
- te demander :
  - **organisation** : `Green Express`
  - **password keystore** : *(NOTE-LE BIEN, perdable = app perdue côté Play Store)*
  - **alias** : `android` (défaut)
  - **password alias** : *(idem)*

Le keystore est gitignoré. **Sauvegarde-le hors du repo** (Drive, gestionnaire de mots de passe, etc.).

### 2. Récupérer le SHA256 et l'inscrire dans `assetlinks.json`

```powershell
.\build.ps1 -Action sha256
```

Tu obtiens une ligne comme :

```
SHA256: A1:B2:C3:D4:...:99
```

Copie **toute la chaîne après `SHA256:`** (avec les `:`).

Édite `c:\SERVICE\frontend-next\public\.well-known\assetlinks.json` et remplace `REPLACE_WITH_SHA256_OF_RELEASE_KEYSTORE` par cette valeur.

### 3. Déployer le frontend pour publier `assetlinks.json`

```powershell
cd c:\SERVICE\frontend-next
git add public/.well-known/assetlinks.json
git commit -m "feat(twa): publish Digital Asset Links for Android TWA"
git push
```

Vérifie que c'est en ligne :

```powershell
Invoke-WebRequest "https://green-express-iota.vercel.app/.well-known/assetlinks.json" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Doit retourner ton JSON avec le SHA256 (Content-Type: `application/json`).

### 4. Construire l'APK + AAB signés

```powershell
cd c:\SERVICE\android-twa
.\build.ps1 -Action build
```

Génère :
- `app-release-signed.apk` → test direct sur appareil
- `app-release-bundle.aab` → upload Play Store

### 5. Tester localement

Branche un téléphone Android en USB (mode développeur activé) :

```powershell
.\build.ps1 -Action install
```

Lance l'app : si `assetlinks.json` est correct, **aucune barre Chrome** ne s'affiche en haut. Si tu vois la barre, c'est que le SHA256 ne correspond pas (vérifie l'étape 2).

---

## Mise à jour

Quand tu modifies `twa-manifest.json` (icône, couleur, version, etc.) ou la PWA :

```powershell
# Incrémenter appVersionCode dans twa-manifest.json
.\build.ps1 -Action update
.\build.ps1 -Action build
```

---

## Publication Play Store

1. Crée un compte développeur Google Play (25 USD une fois)
2. Crée une nouvelle app, remplis la fiche
3. Onglet **Production → Créer une version → Bundle d'app** → upload `app-release-bundle.aab`
4. **App signing by Google Play** : Google va générer une 2ème signature après upload. Ajoute son SHA256 aussi dans `assetlinks.json` (un tableau de fingerprints) :

```json
"sha256_cert_fingerprints": [
  "TON_SHA256_DE_DEV",
  "SHA256_FOURNI_PAR_GOOGLE_PLAY_APP_SIGNING"
]
```

Le SHA256 Google Play est dans **Console Play → Setup → App signing**.

5. Re-déploie le frontend après cet ajout (sinon les utilisateurs Play Store verront la barre Chrome).

---

## Notifications FCM côté TWA

Bonne nouvelle : **rien à faire en plus**. Le TWA délègue à Chrome qui gère déjà :
- Le service worker `firebase-messaging-sw.js`
- Les push FCM existants
- L'affichage écran verrouillé natif (avec les options `priority=high`, `requireInteraction`, `vibrate` qu'on a ajoutées)

Le user installe l'APK → ouvre l'app une fois → accepte la permission notif → c'est tout.

---

## iOS

iOS reste 100% sur la PWA Safari (Add to Home Screen). Aucune modification, aucun App Store iOS pour l'instant. Si tu veux iOS plus tard, il faudra une vraie app native (PWABuilder ou Capacitor).

---

## Dépannage

| Symptôme | Cause | Fix |
|---|---|---|
| Barre Chrome visible en haut | `assetlinks.json` mal servi ou SHA256 incorrect | `Invoke-WebRequest` test, refaire `sha256` |
| `bubblewrap: command not found` | Pas installé | `npm install -g @bubblewrap/cli` |
| Build fail "JAVA_HOME" | JDK 17 manquant ou variable absente | Réinstaller Temurin 17, redémarrer PowerShell |
| `gradle build failed` | Mauvaise version SDK | Lancer Android Studio une fois, accepter les licenses |
| Notifs ne marchent pas dans le TWA | PWA déjà testée hors TWA, token FCM différent | Désinstaller, réinstaller l'APK, ré-accepter les permissions |
