# 🏢 Rôle ENTREPRISE - Guide Complet

## 🎯 Concept Principal

Le rôle **ENTREPRISE** permet à une **société** (PME, grande entreprise, ONG, etc.) de :
- Offrir des **repas à ses employés** comme avantage social
- Gérer un **budget alimentaire mensuel** par employé
- Centraliser et **suivre toutes les dépenses** de restauration

C'est comme une **carte restaurant d'entreprise**, mais intégrée directement dans Green Express.

---

## 💡 Cas d'Usage Réel

### Exemple : "TechCorp Kinshasa"

**Contexte** :
- TechCorp a **100 employés**
- Direction veut offrir **déjeuners gratuits** pour améliorer bien-être
- Budget : **50 USD par employé par mois**

#### Comment ça fonctionne ?

**1️⃣ Inscription Entreprise**
```
RH de TechCorp crée compte :
- Email : rh@techcorp.com
- Rôle : entreprise
```

**2️⃣ Configuration Employés**
```
RH ajoute 100 employés dans le système :
- alice@techcorp.com → Budget: 50 USD/mois
- bob@techcorp.com → Budget: 50 USD/mois
- charlie@techcorp.com → Budget: 50 USD/mois
- ... (97 autres)

Total budget entreprise : 100 × 50 = 5,000 USD/mois
```

**3️⃣ Utilisation par Employés**
```
Alice (employée) :
1. Se connecte avec alice@techcorp.com
2. Commande "Burger + Salade" = 15 USD
3. Paie avec budget entreprise (reste 35 USD ce mois)

Bob (employé) :
1. Commande "Poulet Moambe" = 12 USD
2. Paie avec budget entreprise (reste 38 USD ce mois)
```

**4️⃣ Suivi par RH**
```
RH consulte dashboard entreprise :
- Budget total utilisé : 540 USD / 5,000 USD
- Alice : 15 USD dépensés / 50 USD
- Bob : 12 USD dépensés / 50 USD
- 85 employés n'ont pas encore commandé

Rapport mensuel :
- Top 5 plats commandés
- Employés ayant dépassé budget (alertes)
- Économies réalisées
```

---

## 🔧 Fonctionnalités Détaillées

### 1. **Gestion des Employés**

#### Ajouter des employés
```javascript
// Interface RH
{
  email: "alice@techcorp.com",
  nom: "Alice Mukendi",
  departement: "IT",
  budget_mensuel: 50.00,
  devise: "USD"
}
```

#### Actions possibles
- ✅ Ajouter nouvel employé
- ✅ Modifier budget individuel
- ✅ Désactiver employé (départ entreprise)
- ✅ Importer liste CSV (100+ employés d'un coup)

#### Exemple de gestion
```
Janvier :
- 100 employés actifs
- Budget : 50 USD/employé

Février :
- +10 nouvelles recrues = 110 employés
- Budget ajusté : 5,500 USD total

Mars :
- -5 démissions = 105 employés
- Budget : 5,250 USD
```

---

### 2. **Commandes Groupées**

#### Qu'est-ce que c'est ?
L'entreprise peut **commander pour tous les employés** en une seule fois.

#### Exemple : Réunion d'équipe
```
Scénario : TechCorp organise séminaire avec 50 personnes

RH passe commande groupée :
- 50 × Burger Gourmet (12 USD) = 600 USD
- 50 × Boisson (2 USD) = 100 USD
- Total : 700 USD

Livraison : Salle de conférence, 12h00
Code unique : GX-CORP-789

Avantages :
✅ Une seule commande au lieu de 50
✅ Prix négocié (remise volume possible)
✅ Livraison groupée
✅ Paiement centralisé
```

#### Types de commandes groupées
1. **Événement ponctuel** (réunion, formation)
2. **Récurrente** (tous les vendredis, déjeuner équipe)
3. **Sur demande** (employés commandent individuellement)

---

### 3. **Allocation Budgétaire**

#### Comment ça marche ?

```
Configuration par entreprise :

Option A : Budget fixe mensuel
- Chaque employé : 50 USD/mois
- Reset automatique le 1er du mois
- Non cumulable

Option B : Budget flexible
- Pool commun : 5,000 USD/mois
- Employés puisent dedans
- Limite par commande : 20 USD max

Option C : Budget par département
- IT : 60 USD/mois par personne
- Admin : 40 USD/mois par personne
- Direction : 80 USD/mois par personne
```

#### Exemple réel

**Alice (Développeuse - IT) :**
```
Budget mensuel : 50 USD
Devise : USD

Semaine 1 :
- Lundi : Burger (12 USD) → Reste 38 USD
- Mercredi : Salade (8 USD) → Reste 30 USD
- Vendredi : Pizza (10 USD) → Reste 20 USD

Semaine 2 :
- Lundi : Poulet (15 USD) → Reste 5 USD
- Mercredi : Tente commander 12 USD
  ❌ REJETÉ : Budget insuffisant
- Alice paie 7 USD de sa poche

1er du mois suivant :
✅ Budget reset à 50 USD
```

#### Gestion des dépassements

**Politique 1 : Blocage strict**
```
Budget épuisé → Impossible de commander
→ Employé paie de sa poche s'il veut
```

**Politique 2 : Tolérance avec alerte**
```
Budget dépassé de 10% max autorisé
RH reçoit alerte
Employé remboursé sur salaire si abus
```

**Politique 3 : Crédit**
```
Employé peut "emprunter" sur mois suivant
Max : 20% du budget mensuel
```

---

### 4. **Rapports et Analytics**

#### Dashboard Entreprise

```
Vue Globale :
┌─────────────────────────────────────┐
│ Budget Mensuel : 5,000 USD          │
│ Dépensé : 3,240 USD (64.8%)         │
│ Reste : 1,760 USD                   │
│                                     │
│ Employés actifs : 100               │
│ Commandes ce mois : 432             │
│ Économie réalisée : 340 USD (promos)│
└─────────────────────────────────────┘
```

#### Rapports disponibles

**1. Rapport de consommation**
```csv
Employé,Département,Budget,Dépensé,Reste,%
Alice Mukendi,IT,50.00,45.00,5.00,90%
Bob Kabongo,Admin,50.00,12.00,38.00,24%
Charlie Mutombo,IT,50.00,50.00,0.00,100%
...
```

**2. Rapport par département**
```
IT (30 employés) :
- Budget total : 1,500 USD
- Dépensé : 1,245 USD (83%)
- Moyenne par personne : 41.50 USD

Admin (20 employés) :
- Budget total : 1,000 USD
- Dépensé : 540 USD (54%)
- Moyenne par personne : 27 USD

→ Insight : IT dépense plus (déjeuners au bureau)
```

**3. Top menus commandés**
```
1. Burger Gourmet : 145 commandes (33%)
2. Poulet Moambe : 98 commandes (23%)
3. Pizza Margherita : 76 commandes (18%)
4. Salade César : 54 commandes (12%)
5. Autres : 59 commandes (14%)

→ Possibilité : Négocier tarif préférentiel sur Burger
```

**4. Rapport temporel**
```
Lundi : 120 commandes (28%)
Mardi : 95 commandes (22%)
Mercredi : 110 commandes (25%)
Jeudi : 80 commandes (18%)
Vendredi : 27 commandes (7%) ← Beaucoup sortent déjeuner

→ Insight : Proposer offre spéciale vendredi
```

**5. Analyse coûts**
```
Janvier 2026 :
- Budget alloué : 5,000 USD
- Réellement dépensé : 3,240 USD
- Économie : 1,760 USD (35%)

Comparaison tickets restaurant traditionnels :
- Coût tickets papier : 5,000 USD + 250 USD gestion
- Coût Green Express : 3,240 USD (pas de gestion)
- Économie totale : 2,010 USD/mois

→ ROI annuel : 24,120 USD économisés
```

---

## 🎯 Avantages pour l'Entreprise

### ✅ Avantages Financiers
1. **Contrôle des coûts** : Budget plafonné
2. **Pas de gaspillage** : Paiement à l'utilisation réelle
3. **Traçabilité** : Chaque centime tracé
4. **Optimisation** : Analytics pour négocier tarifs

### ✅ Avantages RH
1. **Attractivité** : Avantage social moderne
2. **Rétention** : Employés satisfaits restent
3. **Productivité** : Moins de temps perdu (livraison au bureau)
4. **Bien-être** : Repas sains et variés

### ✅ Avantages Administratifs
1. **Automatisation** : Plus de tickets papier à gérer
2. **Reporting** : Tableaux de bord en temps réel
3. **Conformité** : Exports comptables directs
4. **Flexibilité** : Ajuster budgets en 1 clic

---

## 💼 Flux Complet : Exemple Journée Type

### Matin (8h00)
```
RH de TechCorp :
1. Se connecte sur /entreprise
2. Voit alerte : "10 employés ont épuisé budget"
3. Décide d'augmenter budget IT de 10 USD ce mois
4. Envoie notification aux employés
```

### Midi (12h00)
```
Alice (employée IT) :
1. Ouvre Green Express sur son téléphone
2. Parcourt menus du jour
3. Commande "Poulet + Riz" (15 USD)
4. Sélectionne "Payer avec budget entreprise"
5. Budget entreprise débité automatiquement
6. Reçoit code livraison : GX-XYZ456

Bob (admin) commande au même moment
Carol (dev) commande aussi
→ 3 livraisons différentes, mais budget entreprise
```

### 12h30 (Livraison)
```
Livreur arrive bureau TechCorp avec 3 commandes :
- GX-XYZ456 (Alice)
- GX-ABC789 (Bob)
- GX-DEF012 (Carol)

Réceptionniste (vérificateur) scanne les 3 codes
→ Toutes validées
→ Employés récupèrent leurs repas
```

### Fin de mois (30/01)
```
RH génère rapport mensuel :
1. Export Excel de toutes les dépenses
2. Envoie à comptabilité
3. Analyse tendances
4. Ajuste budgets pour février
5. Renouvelle contrat avec Green Express
```

---

## 🔐 Sécurité et Contrôles

### Prévention Abus

**1. Limite par commande**
```
Règle : Max 25 USD par commande
→ Empêche employé de commander pour 5 personnes
```

**2. Limite quotidienne**
```
Règle : 1 commande par jour maximum
→ Empêche double commande midi + soir
```

**3. Plages horaires**
```
Règle : Commandes autorisées 11h-14h seulement
→ Uniquement pour déjeuners, pas dîners
```

**4. Validation hiérarchique**
```
Commande > 30 USD → Approbation manager requise
```

**5. Audit trail**
```
Toutes les actions logguées :
- Qui a commandé quoi, quand
- Modifications de budget
- Alertes de dépassement
```

---

## 📊 Exemples de Politiques Entreprise

### Politique 1 : Startup Tech (Flexible)
```
Budget : 60 USD/employé/mois
Horaires : 24/7 (beaucoup de nuit)
Limite : Aucune
Philosophie : "Mangez quand vous voulez"
```

### Politique 2 : Banque (Stricte)
```
Budget : 40 USD/employé/mois
Horaires : 12h-14h seulement
Limite : 15 USD/commande max
Philosophie : "Contrôle strict des coûts"
```

### Politique 3 : ONG (Équitable)
```
Budget : 30 USD/employé/mois (même pour tous)
Horaires : 11h30-13h30
Bonus : +5 USD si réunion après 18h
Philosophie : "Équité et reconnaissance"
```

---

## 🎓 En Résumé Simple

**ENTREPRISE = Gestionnaire de Cantine Virtuelle**

```
Avant Green Express :
- Tickets restaurant papier
- Gestion lourde
- Pas de contrôle précis
- Employés limités aux restos acceptant tickets

Avec Green Express (rôle Entreprise) :
- Budget digital flexible
- Suivi temps réel
- Analytics détaillés
- Choix varié de cuisiniers locaux
- Livraison au bureau possible
- Zéro gestion administrative
```

---

## 💡 Questions Fréquentes

**Q : Que se passe-t-il si un employé quitte l'entreprise ?**
R : RH désactive le compte, budget restant retourne au pool entreprise

**Q : Budget non utilisé en fin de mois ?**
R : Perdu (comme tickets restaurant) OU reportable selon politique entreprise

**Q : Employé peut commander pour un collègue ?**
R : Non, chaque commande liée à 1 compte. Sauf commandes groupées validées RH.

**Q : Prix différents pour entreprise vs clients individuels ?**
R : Possible ! Entreprises peuvent négocier tarifs préférentiels avec cuisiniers.

**Q : Facturation entreprise ?**
R : Mensuelle, basée sur consommation réelle + frais plateforme (ex: 5%)

---

**🏢 Le rôle Entreprise transforme Green Express en solution B2B complète de restauration d'entreprise ! 🚀**
