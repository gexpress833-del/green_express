# Politique des notifications par rôle

Chaque utilisateur ne reçoit que les notifications **qui le concernent** selon son rôle. L’envoi est fait côté backend au moment de la création de la notification ; l’API ne retourne que les notifications déjà adressées à l’utilisateur connecté.

## Origine (expéditeur) des notifications

Chaque notification inclut dans son payload :

- `origin_type` : `client` | `admin` | `livreur` | `verificateur` | `cuisinier` | `entreprise` | `system`
- `origin_user_id` : ID de l’utilisateur à l’origine (si applicable)
- `origin_user_name` : Nom affiché (si applicable)
- `origin_label` : Libellé prêt à afficher (ex. « Marie Dupont (Client) », « Système »)

L’interface peut afficher **« De : {origin_label} »** pour indiquer clairement l’origine.

---

## Qui reçoit quoi

### Client

- **Nouvelle commande** : confirmation de sa propre commande créée.
- **Changement de statut** : pour ses commandes uniquement (payé, en préparation, en livraison, livré, annulé).
- **Réponse à une demande d’événement** : quand un admin a répondu à sa demande (event request).

*Résumé : uniquement ses commandes et ses demandes d’événement.*

---

### Livreur

- **Changement de statut vers `pending`** : nouvelle commande payée à prendre en charge / livrer.
- **Changement de statut vers `delivered`** (ou autre selon le flux) : selon l’implémentation (ex. confirmation livraison).

*Résumé : notifications liées aux commandes à livrer ou qu’il a en charge.*

---

### Vérificateur

- Le vérificateur **ne reçoit aucune notification liée aux commandes ou livraisons**. Son rôle est uniquement de **valider les codes promotion (tickets)** générés par le client lors d’une **réclamation** de promotion (ex. code `GXT-XXXXXXXX` après un claim sur `/client/promotions`). La validation se fait via l’interface Vérificateur > Valider un ticket (`POST /api/verificateur/validate-ticket`). Si des notifications « nouveau ticket à valider » sont ajoutées plus tard, elles seront adressées aux vérificateurs.

*Résumé : uniquement la validation des tickets promotion issus des réclamations client (pas les codes de livraison).*

---

### Cuisinier

- **Nouvelle commande** : non notifié directement par défaut.
- **Changement de statut vers `pending`** : commande payée, à préparer. Seuls les cuisiniers **concernés par les menus de la commande** sont notifiés (créateurs des menus des lignes), sinon fallback sur tous les cuisiniers.

*Résumé : commandes à préparer (menus qu’il a créés).*

---

### Entreprise

- Aucune notification métier spécifique **commande** dans l’implémentation actuelle. Si des notifications « entreprise » sont ajoutées plus tard (ex. commandes pour la société, rapports), elles devront être envoyées uniquement aux utilisateurs du rôle `entreprise` (et limitées à leur `company_id` si applicable).

*Résumé : à définir selon les cas d’usage (ex. commandes liées à la société).*

---

### Admin

- **Nouvelle commande** : toutes les nouvelles commandes.
- **Changement de statut** : tous les changements de statut (payé, en préparation, livré, annulé, etc.).
- Les réponses aux demandes d’événement sont envoyées au **client** ; l’admin n’a pas besoin d’une notification « réponse envoyée » (il est l’auteur). Si besoin, une notification « demande événement à traiter » peut être ajoutée et réservée aux admins.

*Résumé : vue globale sur les commandes et le flux (optionnel : demandes événement à traiter).*

---

## Synthèse par type de notification

| Type                      | Client | Livreur | Vérificateur | Cuisinier | Entreprise | Admin |
|---------------------------|--------|---------|--------------|-----------|------------|-------|
| Nouvelle commande         | Oui (sa commande) | Non     | Non          | Non*      | Non        | Oui   |
| Statut → pending          | Oui (sa commande) | Oui     | Non          | Oui**     | Non        | Oui   |
| Statut → delivered        | Oui (sa commande) | Oui     | Non***       | Non       | Non        | Oui   |
| Statut (autres)           | Oui (sa commande) | Non**** | Non          | Non       | Non        | Oui   |
| Réponse demande événement | Oui (sa demande)  | Non     | Non          | Non       | Non        | Non   |

\* Les cuisiniers ne reçoivent pas « nouvelle commande » ; ils reçoivent le passage en `pending`.  
\** Cuisiniers dont les menus sont dans la commande (sinon tous en fallback).  
\*** Le vérificateur valide uniquement les **codes promotion** (tickets de réclamation client), pas les livraisons ; il ne reçoit donc pas les notifications « statut → delivered ».  
\**** Selon implémentation (ex. `out_for_delivery` pour livreur).

---

## Implémentation technique

- **Envoi** : `OrderNotificationService` et `EventRequestController` (ou équivalent) décident des destinataires selon le type et le contexte (commande, statut, demande d’événement).
- **Lecture** : `NotificationController@index` retourne `$user->notifications()` : aucun filtrage supplémentaire par rôle n’est nécessaire, les notifications étant déjà stockées par destinataire.
- Pour toute nouvelle notification, documenter ici le rôle concerné et mettre à jour le tableau ci‑dessus.
