# 👥 Guide des Rôles - Green Express

## Vue d'ensemble du système

Green Express est une **plateforme de commande de repas** qui connecte :
- 🧑‍🍳 **Cuisiniers** qui créent des menus
- 👤 **Clients** qui commandent et paient
- 🚚 **Livreurs** qui livrent les commandes
- ✅ **Vérificateurs** qui valident les codes de réception
- 🏢 **Entreprises** qui gèrent des commandes groupées
- 👨‍💼 **Admins** qui supervisent tout

---

## 🎭 Les 6 Rôles en Détail

### 1️⃣ 👨‍💼 ADMIN (Administrateur)

**Mission** : Superviser et gérer toute la plateforme

#### 🎯 Responsabilités
- Gérer les utilisateurs (attribuer/modifier rôles)
- Valider ou rejeter les menus soumis par les cuisiniers
- Créer et gérer les promotions
- Consulter les statistiques globales
- Gérer les paiements et abonnements
- Générer des rapports

#### 📊 Statistiques visibles
- Nombre total de commandes
- Revenus totaux (USD/CDF)
- Nombre d'abonnements actifs
- Liste des menus récents à valider

#### ⚙️ Actions possibles
```
✅ Valider/Rejeter un menu soumis par un cuisinier
✅ Créer une promotion (ex: -20% avec 50 points)
✅ Changer le rôle d'un utilisateur
✅ Voir tous les paiements
✅ Voir tous les abonnements
✅ Générer des rapports (ventes, revenus, etc.)
✅ Recevoir les notifications système
```

#### 🌐 Pages accessibles
- `/admin` → Dashboard avec statistiques
- `/admin/menus` → Liste tous les menus (approuver/rejeter)
- `/admin/promotions` → Gérer promotions
- `/admin/users` → Liste utilisateurs + attribuer rôles
- `/admin/payments` → Historique paiements
- `/admin/subscriptions` → Liste abonnements
- `/admin/reports` → Générer rapports
- `/admin/notifications` → Notifications système

#### 💡 Cas d'usage typique
```
1. Un cuisinier soumet un menu "Poulet Moambe"
2. Admin reçoit notification
3. Admin consulte /admin/menus
4. Admin valide le menu → status devient "approved"
5. Le menu devient visible pour les clients
```

---

### 2️⃣ 🧑‍🍳 CUISINIER (Chef)

**Mission** : Créer et gérer ses menus/plats

#### 🎯 Responsabilités
- Créer des menus avec prix et description
- Soumettre les menus pour validation admin
- Gérer le statut de disponibilité (dates)
- Uploader photos des plats
- Suivre ses ventes

#### 📊 Statistiques visibles
- Nombre total de menus créés
- Nombre de menus soumis (en attente validation)
- Nombre de menus validés (approuvés)

#### ⚙️ Actions possibles
```
✅ Créer un nouveau menu
   - Titre, description
   - Prix (USD ou CDF)
   - Image du plat
   - Dates de disponibilité
✅ Éditer ses menus existants
✅ Supprimer un menu
✅ Voir l'historique de ses ventes
```

#### 🌐 Pages accessibles
- `/cuisinier` → Dashboard avec stats
- `/cuisinier/menu/create` → Créer un menu
- `/cuisinier/menu/[id]` → Détails/édition d'un menu

#### 💡 Cas d'usage typique
```
1. Cuisinier crée menu "Burger Gourmet" à 12.5 USD
2. Upload photo du burger
3. Soumet pour validation (status: pending)
4. Admin valide le menu
5. Menu devient visible aux clients
6. Cuisinier voit ses statistiques de vente
```

---

### 3️⃣ 👤 CLIENT (Utilisateur final)

**Mission** : Commander des repas et gérer son compte

#### 🎯 Responsabilités
- Parcourir les menus disponibles
- Passer des commandes
- Payer en ligne
- Suivre ses commandes
- Gérer ses abonnements (Semaine/Mois)
- Utiliser ses points fidélité pour obtenir des réductions
- Récupérer/utiliser des getons de remise

#### 📊 Statistiques visibles
- Solde de points fidélité
- Nombre de commandes passées
- Nombre d'abonnements actifs

#### ⚙️ Actions possibles
```
✅ Parcourir menus disponibles
✅ Ajouter des plats au panier
✅ Passer une commande
✅ Payer (intégration Shwary/provider)
✅ Suivre statut commande (pending → preparing → delivery → completed)
✅ Voir historique commandes
✅ S'abonner (plan Semaine ou Mois)
✅ Voir promotions disponibles
✅ Utiliser points pour obtenir réduction
✅ Récupérer getons de fidélité
✅ Voir factures
```

#### 🌐 Pages accessibles
- `/client` → Dashboard avec stats
- `/client/orders` → Historique commandes
- `/client/subscriptions` → Gérer abonnements
- `/client/promotions` → Voir offres disponibles
- `/client/getons` → Mes getons de fidélité
- `/client/invoices` → Mes factures

#### 💡 Cas d'usage typique
```
1. Client parcourt menus disponibles
2. Ajoute "Burger Gourmet" + "Salade César" au panier
3. Passe commande (adresse de livraison)
4. Paie 20.5 USD via Shwary
5. Reçoit code de commande (ex: GX-ABC123)
6. Gagne 20 points fidélité
7. Suit statut : preparing → delivery → completed
8. Livreur arrive, client montre code GX-ABC123
9. Vérificateur valide le code
10. Commande complétée
```

---

### 4️⃣ 🚚 LIVREUR (Delivery)

**Mission** : Livrer les commandes aux clients

#### 🎯 Responsabilités
- Consulter ses livraisons assignées
- Récupérer commandes auprès des cuisiniers
- Livrer aux clients
- Valider codes de réception
- Suivre sa performance (note, livraisons complétées)

#### 📊 Statistiques visibles
- Nombre de livraisons assignées (à faire)
- Nombre total de livraisons complétées
- Note moyenne (évaluations clients)

#### ⚙️ Actions possibles
```
✅ Voir liste livraisons assignées
✅ Voir détails commande
   - Adresse client
   - Items commandés
   - Code de livraison
✅ Marquer "En route"
✅ Marquer "Livré" (après validation code)
✅ Voir historique livraisons
✅ Voir sa performance et statistiques
```

#### 🌐 Pages accessibles
- `/livreur` → Dashboard avec stats
- `/livreur/order/[id]` → Détails d'une livraison
- `/livreur/performance` → Stats et historique

#### 💡 Cas d'usage typique
```
1. Admin/Système assigne livraison au livreur
2. Livreur voit nouvelle mission assignée
3. Livreur récupère commande chez cuisinier
4. Livreur se rend à l'adresse client
5. Client montre code (ex: GX-ABC123)
6. Livreur/Vérificateur valide le code
7. Statut devient "completed"
8. Livreur reçoit évaluation du client
```

---

### 5️⃣ ✅ VERIFICATEUR (QR/Code Validator)

**Mission** : Valider les codes de réception/getons

#### 🎯 Responsabilités
- Scanner/valider codes de commande
- Valider getons de fidélité/promotions
- Empêcher fraudes (codes déjà utilisés)
- Générer tickets de réception
- Consulter historique validations

#### 📊 Statistiques visibles
- Nombre total de validations effectuées
- Nombre de codes en attente validation
- Dernière validation effectuée

#### ⚙️ Actions possibles
```
✅ Scanner code QR commande
✅ Valider code manuel (ex: GX-ABC123)
✅ Vérifier validité code
   - Code valide → OK
   - Code déjà utilisé → Rejeté
   - Code inexistant → Erreur
✅ Valider getons de remise
✅ Générer ticket de réception
✅ Voir historique validations
```

#### 🌐 Pages accessibles
- `/verificateur` → Dashboard avec stats
- `/verificateur/history` → Historique validations

#### 💡 Cas d'usage typique
```
1. Client arrive avec code GX-ABC123
2. Vérificateur scanne le code QR
3. Système vérifie : commande payée + code non utilisé
4. Vérificateur valide → Code accepté
5. Client reçoit sa commande
6. Code marqué comme "utilisé" en DB
7. Client gagne points fidélité automatiquement
```

---

### 6️⃣ 🏢 ENTREPRISE (Corporate)

**Mission** : Gérer commandes groupées pour employés

#### 🎯 Responsabilités
- Gérer liste employés
- Passer commandes groupées
- Gérer budget mensuel
- Consulter rapports de consommation
- Gérer abonnements entreprise

#### 📊 Statistiques visibles
- Nombre d'employés enregistrés
- Nombre de commandes entreprise
- Budget restant

#### ⚙️ Actions possibles
```
✅ Ajouter/Retirer employés
✅ Passer commandes groupées
✅ Allouer budget par employé
✅ Voir historique commandes entreprise
✅ Générer rapports de dépenses
✅ Gérer abonnements corporate
```

#### 🌐 Pages accessibles
- `/entreprise` → Dashboard avec stats
- `/entreprise/reports` → Rapports consommation

#### 💡 Cas d'usage typique
```
1. RH d'entreprise s'inscrit
2. Ajoute 50 employés
3. Alloue 100 USD/mois par employé
4. Employés commandent via compte entreprise
5. Dépenses déduites du budget entreprise
6. RH génère rapport mensuel des dépenses
7. Renouvelle budget le mois suivant
```

---

## 🔄 Flux Métier Complet (Exemple)

```
1️⃣ CUISINIER crée menu "Burger Gourmet" (12.5 USD)
   └─> Status: pending

2️⃣ ADMIN valide le menu
   └─> Status: approved
   └─> Menu visible aux clients

3️⃣ CLIENT passe commande
   ├─> Ajoute Burger (12.5 USD)
   ├─> Paie via Shwary
   └─> Reçoit code GX-ABC123

4️⃣ LIVREUR reçoit assignation
   ├─> Récupère burger chez cuisinier
   └─> Livre chez client

5️⃣ CLIENT montre code GX-ABC123

6️⃣ VERIFICATEUR valide code
   ├─> Code vérifié
   ├─> Commande complétée
   └─> Client gagne 12 points fidélité

7️⃣ CLIENT utilise points pour promo
   └─> 50 points = -3 USD sur prochaine commande
```

---

## 🔐 Matrice des Permissions

| Action | Admin | Cuisinier | Client | Livreur | Vérificateur | Entreprise |
|--------|:-----:|:---------:|:------:|:-------:|:------------:|:----------:|
| Valider menus | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer menus | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Passer commandes | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Livrer commandes | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Valider codes | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Créer promotions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gérer utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir tous paiements | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gérer employés | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📱 Exemple Concret d'Utilisation

### Scénario : "Commande de midi"

**Matin** :
- 🧑‍🍳 Chef crée menu "Plat du jour" à 10 USD
- 👨‍💼 Admin valide le menu immédiatement

**11h00** :
- 👤 Client consulte menus disponibles
- 👤 Client passe commande "Plat du jour"
- 👤 Client paie 10 USD

**11h30** :
- 🚚 Livreur récupère commande chez chef
- 🚚 Livreur part livrer

**12h00** :
- 🚚 Livreur arrive chez client
- 👤 Client montre code GX-XYZ789
- ✅ Vérificateur (ou livreur) valide code
- ✅ Commande complétée

**Après-midi** :
- 👤 Client gagne 10 points fidélité
- 👤 Client voit "50 points = réduction disponible"

---

## 🎯 Points Clés à Retenir

1. **Admin** = Contrôle total (validation, gestion, stats)
2. **Cuisinier** = Crée menus, attend validation admin
3. **Client** = Commande, paie, utilise points
4. **Livreur** = Livraison physique des commandes
5. **Vérificateur** = Sécurise transactions (validation codes)
6. **Entreprise** = Gestion groupée pour employés

**Le système fonctionne en boucle fermée** : création → validation → commande → paiement → livraison → validation → fidélité.

---

**💡 Tu veux des précisions sur un rôle en particulier ?**
