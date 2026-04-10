# Réclamation de promotion – flux complet

Ce document décrit comment fonctionne la **réclamation d’une promotion** (client réclame une offre avec ses points, reçoit un ticket, le vérificateur valide le ticket).

---

## Calcul des points

### Gain de points (crédit)
- **Règle :** à la création d’une commande, les points sont calculés à **12 points par plat** (par quantité commandée), indépendamment du montant.
- **Stockage :** la commande est créée avec `points_earned` (non encore crédités).
- **Crédit effectif :** lorsque le **livreur** valide le code de livraison (`POST /api/orders/{uuid}/validate-code` ou endpoint livreur), le solde de l’utilisateur est incrémenté de `points_earned` et une entrée est créée dans `point_ledgers` (delta positif, raison liée à la livraison). Les points ne sont crédités qu’**une seule fois** par commande.

### Dépense de points (réclamation)
- **Règle :** chaque promotion peut exiger un nombre de points (`points_required`). Si le client réclame la promotion, son solde est **décrémenté** de ce montant.
- **Moment :** au moment du **claim** (`POST /api/promotions/{id}/claim`), dans la même transaction : vérification du solde, décrémentation du solde, création d’une entrée dans `point_ledgers` (delta négatif, raison `promo_claim`).
- Si le solde est insuffisant, la réclamation est refusée (400 « Points insuffisants »).

### Résumé
| Événement              | Effet sur le solde | Table / raison        |
|------------------------|--------------------|------------------------|
| Commande créée         | Aucun (points_earned sur la commande) | — |
| Livraison validée      | + (12 × quantité de plats) | point_ledgers |
| Réclamation promotion  | − points_required | point_ledgers (promo_claim) |

---

## 1. Côté client (frontend)

**Page :** `frontend-next/app/client/promotions/page.jsx`

### Affichage de la promotion
- **Une seule promotion** est affichée : la promotion « courante » (active, la plus récente), chargée via `GET /api/promotions?active_only=1&current=1` ou la première de la liste.
- Affichage type carte : image, titre, description, points requis, échéance, bouton **« Réclamer cette promotion »**.

### Conditions pour que le bouton « Réclamer » soit actif
Le bouton est **désactivé** si :
- une réclamation est déjà en cours ;
- la promotion a une quantité limitée et elle est épuisée (`quantity_limit <= 0`) ;
- la promotion est expirée (`end_at` dans le passé) ;
- l’utilisateur n’a pas assez de points (solde < `points_required` lorsque la promo exige des points).

Le solde de points vient de `GET /api/client/stats` (authentifié).

### Clic sur « Réclamer cette promotion »
1. **Confirmation** : `confirm('Confirmer la réclamation de cette offre ?')`.
2. **Appel API** : `POST /api/promotions/{id}/claim` (avec le token JWT).
3. **Réponse** :
   - Succès : toast avec le message et le **code ticket** (ex. `GXT-XXXXXXXX`), à présenter au vérificateur. Puis rechargement de la promotion affichée et du solde de points.
   - Erreur : toast avec le message d’erreur (ex. « Points insuffisants », « Promotion épuisée »).

---

## 2. Route API (backend)

**Fichier :** `backend/routes/api.php`

- **Route :** `POST /api/promotions/{id}/claim`
- **Contrôleur :** `PromotionController@claim`
- **Middleware :** `auth:api` (utilisateur connecté) + `throttle:20,1` (20 requêtes par minute).

Tout le traitement est fait dans une **transaction** pour garantir la cohérence (points, quantité, création du claim).

---

## 3. Traitement backend (claim)

**Fichier :** `backend/app/Http/Controllers/PromotionController.php` → méthode `claim(Request $request, $id)`.

### Étapes (dans l’ordre)

1. **Promotion**  
   Récupération de la promotion avec verrou : `Promotion::lockForUpdate()->with('menu')->find($id)`.  
   Si introuvable → **404** « Promotion introuvable ».

2. **Dates**  
   - Si `start_at` est défini et dans le futur → **400** « Promotion pas encore active ».  
   - Si `end_at` est défini et dans le passé → **400** « Promotion expirée ».

3. **Quantité**  
   Si `quantity_limit` est défini et ≤ 0 → **400** « Promotion épuisée ».

4. **Points (si requis)**  
   Si `points_required` > 0 :  
   - Récupération du solde du user (`Point::where('user_id', $user->id)->lockForUpdate()->first()`).  
   - Si solde < `points_required` → **400** « Points insuffisants ».  
   - Sinon :  
     - décrémentation du solde (`balance -= points_required`) ;  
     - création d’une entrée dans `point_ledgers` (delta négatif, raison `promo_claim`).

5. **Quantité de la promotion**  
   Si `quantity_limit` est défini : décrémentation de 1 (avec `max(0, ...)`), puis sauvegarde de la promotion.

6. **Ticket**  
   Génération d’un code unique : `GXT-` + 8 caractères aléatoires (uppercase).  
   Boucle tant qu’un `PromotionClaim` existe déjà avec ce `ticket_code`.

7. **Enregistrement du claim**  
   Création d’un enregistrement dans `promotion_claims` :
   - `user_id`, `promotion_id`, `points_deducted` (= points_required), `status` = `'claimed'`, `ticket_code`.

8. **Réponse**  
   JSON 200 avec :  
   `message`, `promotion`, `ticket_code`, `claim_id`.

En cas d’erreur métier (promo introuvable, pas encore active, expirée, épuisée, points insuffisants), la transaction est annulée et une réponse 400/404 est renvoyée.

---

## 4. Modèle PromotionClaim

**Fichier :** `backend/app/Models/PromotionClaim.php`

- **Champs :** `user_id`, `promotion_id`, `points_deducted`, `status`, `ticket_code`, `validated_at`.
- **Relations :** `user()`, `promotion()`.
- **Statuts :**  
  - `claimed` : ticket généré, pas encore validé par le vérificateur.  
  - `validated` : le vérificateur a validé le ticket (`validated_at` renseigné).

---

## 5. Consultation des réclamations par le client

- **Route :** `GET /api/my-promotion-claims` (authentifié).
- **Contrôleur :** `PromotionController@myClaims`.  
  Retourne les `PromotionClaim` du user connecté, avec `promotion` et `promotion.menu`, paginés.

Utilisé côté frontend pour afficher « Mes réclamations » (ex. page getons / historique).

---

## 6. Validation du ticket par le vérificateur

**Route :** `POST /api/verificateur/validate-ticket`  
**Contrôleur :** `VerificateurController@validatePromotionTicket`  
**Middleware :** `auth:api` + `role:verificateur`.

### Body attendu
`{ "ticket_code": "GXT-XXXXXXXX" }` (code reçu par le client après réclamation).

### Logique de validation
1. Recherche d’un `PromotionClaim` avec ce `ticket_code`.
2. **Si aucun** → 404, `valid: false`, message « Ticket introuvable. Vérifiez le code. ».
3. **Si déjà validé** (`status === 'validated'`) → 200, `valid: true`, message « Ce ticket a déjà été validé », avec les infos du claim (sans le re-valider).
4. **Sinon** : mise à jour du claim (`status = 'validated'`, `validated_at = now()`), puis 200 avec `valid: true`, message « Ticket validé avec succès » et détail du claim : `id`, `ticket_code`, `promotion` (titre de la promotion, depuis `promotion.title` ou `promotion.menu.title`), `user_id`, `validated_at`.

Le client présente son code **GXT-XXXXXXXX** au vérificateur ; celui-ci le saisit dans l’interface (page Vérificateur > Valider un ticket). Le backend marque le ticket comme validé une seule fois.

---

## 7. Résumé du flux

```
[Client] Page /client/promotions
    → Voit les promos (GET /api/promotions?active_only=1)
    → Voit son solde (GET /api/client/stats)
    → Clic « Réclamer » → confirm() → POST /api/promotions/{id}/claim

[Backend] PromotionController@claim
    → Vérifie promo, dates, quantité, points
    → Décrémente points (point_ledgers)
    → Décrémente quantity_limit de la promo
    → Crée PromotionClaim (status=claimed, ticket_code=GXT-XXXXXXXX)
    → Retourne ticket_code au client

[Client] Affiche le ticket (ex. toast) : « À présenter au vérificateur »

[Vérificateur] Saisit le code → POST /api/verificateur/validate-ticket
    → Backend met le claim en status=validated, validated_at=now()
```

---

## 8. Fichiers concernés

| Rôle | Fichier |
|------|--------|
| Frontend – liste et réclamation | `frontend-next/app/client/promotions/page.jsx` |
| API – claim | `backend/routes/api.php` (POST promotions/{id}/claim) |
| Backend – logique claim | `backend/app/Http/Controllers/PromotionController.php` (claim, myClaims) |
| Backend – validation ticket | `backend/app/Http/Controllers/VerificateurController.php` (validatePromotionTicket) |
| Modèle | `backend/app/Models/PromotionClaim.php` |
