# Réparer les tables MySQL « crashed » (sessions, cache, etc.)

Si tu as des erreurs du type : **La table '…' est marquée 'crashed' et devrait être réparée**, répare les tables concernées.

## Tables souvent concernées

- **sessions** : utilisée par `SESSION_DRIVER=database`
- **cache** : utilisée par `CACHE_STORE=database` (rate limiting, etc.)

## Option 1 : Réparer sessions + cache (Tinker)

```powershell
cd c:\SERVICE\backend
php artisan tinker --execute="DB::statement('REPAIR TABLE sessions'); DB::statement('REPAIR TABLE cache');"
```

## Option 2 : Réparer toutes les tables (MySQL)

```bash
mysql -u root -p db_gexpress -e "REPAIR TABLE sessions, cache;"
# ou réparer toutes les tables de la base :
mysql -u root -p db_gexpress -e "SET FOREIGN_KEY_CHECKS=0; SELECT CONCAT('REPAIR TABLE \`', table_name, '\`;') FROM information_schema.tables WHERE table_schema='db_gexpress' AND engine='MyISAM';" | tail -n +2 | mysql -u root -p db_gexpress
```
(Mot de passe dans ton `.env` : `DB_PASSWORD=1999`)

## Option 3 : phpMyAdmin / MySQL Workbench

1. Ouvre la base `db_gexpress`.
2. Pour chaque table concernée (`sessions`, `cache`) : sélectionne la table → **Opérations** → **Réparer la table**.

Après la réparation, redémarre le serveur Laravel si besoin et réessaie sur le frontend.
