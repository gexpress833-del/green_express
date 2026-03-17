# Scheduler Laravel sur Render (cron intégré)

Le **job de fallback** (paiements Shwary en attente) est planifié dans Laravel pour s’exécuter **toutes les minutes**. Pour que cela tourne en production, Render peut lancer le scheduler via un **Cron Job** (service dédié).

---

## 1. Créer un Cron Job sur Render

1. **Dashboard Render** → **New** → **Cron Job**.
2. Connecte le **même dépôt GitHub** que ton Web Service backend.
3. **Configuration** :
   - **Name** : `green-express-scheduler` (ou au choix).
   - **Root Directory** : `backend` (comme pour le Web Service).
   - **Environment** : **Docker** (même Dockerfile que le backend).
   - **Schedule** : `* * * * *` (toutes les minutes, en UTC).
   - **Command** :  
     `php artisan schedule:run`
4. **Variables d’environnement** : utilise les **mêmes** que ton Web Service backend (DB, Shwary, etc.), ou un **Environment Group** partagé, pour que Laravel puisse se connecter à la base et appeler l’API Shwary.
5. Enregistre et déploie.

À chaque minute, Render démarre un conteneur, exécute `php artisan schedule:run`, puis l’arrête. Laravel exécute alors les tâches dues (dont `CheckPendingPaymentsJob`).

---

## 2. Coût et limites

- **Facturation** : au temps d’exécution (quelques secondes par minute). Minimum **1 $ / mois** par cron job.
- **Durée max** : une exécution est limitée à **12 heures** ; pour un simple `schedule:run`, c’est largement suffisant.
- **Une seule exécution à la fois** : si la suivante est due alors qu’une run est encore en cours, elle est reportée après la fin.

---

## 3. Vérification

- Dans le **Dashboard Render**, onglet **Logs** du Cron Job : tu dois voir la sortie de `schedule:run` (et éventuellement les logs Laravel).
- Dans les **logs Laravel** (sur le Web Service, si tu centralises les logs, ou en base) : les entrées liées à `CheckPendingPaymentsJob` quand des paiements sont en attente.

---

## 4. Résumé

| Élément        | Valeur                          |
|----------------|---------------------------------|
| Type de service | Cron Job                       |
| Schedule       | `* * * * *` (toutes les minutes) |
| Command        | `php artisan schedule:run`     |
| Env            | Identique au backend (DB, Shwary, etc.) |

Render gère ainsi l’exécution du scheduler ; plus besoin d’endpoint cron externe ni de `CRON_SECRET`.
