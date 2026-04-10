# Scheduler Laravel sur Render (pawaPay)

Le scheduler Laravel exécute le **fallback de relance pawaPay** toutes les minutes via `CheckPendingPaymentsJob`.

---

## 1. Créer le Cron Job Render

1. Render → **New** → **Cron Job**
2. Utiliser le **même dépôt** que le backend
3. Configurer :
   - **Root Directory** : `backend`
   - **Environment** : `Docker`
   - **Schedule** : `* * * * *`
   - **Command** : `php artisan schedule:run`

Le scheduler appelle ensuite `CheckPendingPaymentsJob::dispatchSync()` depuis `app/Console/Kernel.php`, donc **aucun worker queue séparé n’est requis** pour cette relance.

---

## 2. Variables d’environnement

Le Cron Job doit recevoir les **mêmes variables** que le Web Service backend, en particulier :

- base de données
- `APP_KEY`
- `APP_URL`
- `PAWAPAY_API_TOKEN`
- `PAWAPAY_BASE_URL`
- `PAWAPAY_TIMEOUT`

Sans cela, le polling `GET /v2/deposits/{depositId}` ne pourra pas fonctionner.

---

## 3. Vérification

À contrôler dans les logs :

- exécution régulière du `schedule:run`
- appel de `CheckPendingPaymentsJob`
- mise à jour des paiements `provider = pawapay` encore en `pending`

Résultat attendu :

- `payments.status` passe à `completed` ou `failed`
- la commande associée passe à `paid` ou `cancelled`

---

## 4. Résumé

| Élément | Valeur |
|--------|--------|
| Type | Cron Job Render |
| Fréquence | `* * * * *` |
| Commande | `php artisan schedule:run` |
| Dépendance worker queue | Non pour le fallback pawaPay |
| Variables critiques | DB + `PAWAPAY_*` + `APP_KEY` |
