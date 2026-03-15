# Paiement Shwary (Mobile Money)

L’application utilise **Shwary** pour les paiements Mobile Money (RDC, Kenya, Ouganda) via le SDK officiel `shwary/php-sdk`.

## Configuration

1. **Compte Shwary**  
   Créez un compte sur [Shwary](https://app.shwary.com) et récupérez **Merchant ID** et **Merchant Key** (Settings → API).

2. **Variables d’environnement** (`backend/.env`)  
   - `SHWARY_MERCHANT_ID`  
   - `SHWARY_MERCHANT_KEY`  
   - `SHWARY_SANDBOX=true` en dev (paiements test, pas de vrais prélèvements)  
   - `SHWARY_SANDBOX=false` en production  

3. **Conversion de devise**  
   Les commandes peuvent être en USD/XAF. Pour la RDC (CDF), le backend convertit avec le taux `SHWARY_RATE_USD_TO_CDF` (ex: 2500).  
   Config dans `config/shwary.php` et `.env` :  
   - `SHWARY_RATE_USD_TO_CDF`  
   - `SHWARY_RATE_USD_TO_KES`  
   - `SHWARY_RATE_USD_TO_UGX`  
   - `SHWARY_DEFAULT_ORDER_CURRENCY=USD`

## Flux

1. Le client passe commande → statut `pending_payment`.  
2. Il clique sur « Payer avec Mobile Money » et saisit son numéro (+243XXXXXXXX pour RDC).  
3. Le backend appelle l’API Shwary (SDK) avec le montant converti (ex: CDF) et le numéro.  
4. Shwary envoie une demande de paiement sur le téléphone du client.  
5. **Sandbox** : la transaction est souvent marquée « completed » tout de suite → code de livraison affiché.  
6. **Production** : Shwary envoie un **webhook** à `POST /api/shwary/callback` quand le paiement est confirmé ou échoué.  
7. Le callback met à jour le `Payment` et la `Order` (génération du code de livraison si `completed`).

## Webhook et URL de callback

- **Production** : Shwary exige une URL **HTTPS**. Définissez `SHWARY_CALLBACK_URL=https://votre-domaine.com/api/shwary/callback` dans `.env` et enregistrez-la dans le tableau de bord Shwary.
- **Sandbox (local)** : En mode test (`SHWARY_SANDBOX=true`), aucune URL HTTPS n’est envoyée (le paiement est complété immédiatement, pas de webhook). Vous pouvez tester en local sans ngrok. Pour recevoir le webhook en local, utilisez ngrok et définissez `SHWARY_CALLBACK_URL=https://xxx.ngrok.io/api/shwary/callback`.

## Dépannage

- **« Service de paiement non configuré »**  
  Vérifier `SHWARY_MERCHANT_ID` et `SHWARY_MERCHANT_KEY` dans `.env`.

- **« Le numéro doit commencer par +243 »**  
  Le numéro doit être au format E.164 (ex: +243812345678). Le frontend normalise automatiquement (ajout de +243 si besoin).

- **Montant minimum RDC**  
  Shwary exige au moins **2901 CDF**. Si la commande est en USD, le taux de conversion doit donner au moins ce montant (ex: 1 USD = 2500 CDF → commande min ~1.16 USD).

- **Callback non reçu**  
  En production, vérifier que l’URL de callback est accessible en HTTPS et enregistrée chez Shwary. Consulter les logs : `storage/logs/laravel.log` (entrées « Shwary Callback »).
