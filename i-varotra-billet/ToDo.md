# Cahier des Charges
## Application Mobile de Gestion d’Événements et de Billetterie

### 1. Contexte du projet
L’objectif du projet est de développer une application mobile de gestion d’événements et de billetterie permettant aux organisateurs de créer des événements, générer des billets, suivre les ventes et gérer la présence des participants.
L’application sera développée avec React Native afin de fonctionner sur Android et iOS.
Elle permettra notamment :
- la création d’événements
- la génération et la gestion des billets
- la gestion des paiements des billets
- le contrôle de présence via QR Code
- la visualisation des événements dans un calendrier

### 2. Objectifs de l’application
Les objectifs principaux sont :
- Simplifier la création et la gestion d’événements
- Faciliter la vente et le suivi des billets
- Permettre une gestion flexible des paiements (paiement partiel ou total)
- Assurer un contrôle rapide des entrées via QR code
- Donner une vue calendrier des événements

### 3. Utilisateurs cibles
L’application est destinée principalement à :
- Organisateurs d’événements
- Églises
- Associations
- Entreprises organisant des événements
- Responsables de billetterie

### 4. Fonctionnalités principales

#### 4.1 Gestion des événements
L’application doit permettre de créer et gérer des événements.
**Informations d’un événement**
- *Champs obligatoires :* Date de l’événement
- *Champs facultatifs :* Nom de l’événement, Description, Slogan (teny fikasana), Image ou visuel de l’événement (optionnel)

**Fonctionnalités**
- Créer un événement
- Modifier un événement
- Supprimer un événement
- Consulter la liste des événements
- Voir les événements dans un calendrier

#### 4.2 Gestion des billets
Après la création d’un événement, l’utilisateur peut créer des billets pour cet événement.
**Création des billets**
- Définir le nombre de billets
- Chaque billet possède : un numéro unique, un QR code, les informations de l’événement

**Affichage du billet**
Chaque billet possède un modèle visuel recto / verso contenant :
- *Recto :* Nom de l’événement, Date, Numéro du billet, QR code, Slogan éventuel
- *Verso :* Description, Informations complémentaires

#### 4.3 Gestion des acheteurs
Chaque billet peut être attribué à une personne.
- *Informations possibles :* Nom de l’acheteur, Téléphone, Statut du paiement
- *Fonctionnalités :* Associer un billet à un acheteur, Modifier les informations de l’acheteur, Voir la liste des billets vendus

#### 4.4 Gestion des paiements
L’application doit permettre un paiement flexible.
- *Statuts possibles :* Non payé, Partiellement payé, Payé
- *Fonctionnalités :* Enregistrer un paiement, Permettre un paiement en plusieurs fois, Voir le reste à payer, Historique des paiements
- *Exemple :* Prix billet : 20 000 Ar -> 10 000 Ar payé, 5 000 Ar payé, reste : 5 000 Ar.

#### 4.5 Gestion des présences
Le jour de l’événement, l’application permet de contrôler les entrées.
Deux méthodes :
1. **Scan QR Code :** Scanner le QR code du billet.
2. **Recherche manuelle :** Entrer le numéro du billet.
- *Résultat :* Billet valide, Billet déjà utilisé, Billet inexistant.

#### 4.6 Calendrier des événements
Un module calendrier permet de visualiser :
- les événements par date
- les détails d’un événement
- *Fonctionnalités :* Voir les événements du mois, Cliquer sur une date pour voir les événements.

### 5. Technologies envisagées

**Application mobile**
React Native (compatible Android et iOS).

**Stockage des données (local)**
SQLite (expo-sqlite). Avantages : fonctionne hors-ligne, rapide, données locales.

**Gestion des données (Service Layer)**
- EventService
- TicketService
- PaymentService
- AttendanceService

**Génération de QR Code**
`react-native-qrcode-svg`. Le QR code contiendra l'ID du billet, le numéro et l'ID de l'événement.

**Scan des QR Code**
`expo-barcode-scanner` ou `react-native-camera`.

### 6. Architecture finale
```
Mobile App (React Native)
├── UI Screens
├── Services (Logique métier)
│     ├── EventService
│     ├── TicketService
│     ├── PaymentService
│     └── AttendanceService
├── Local Database (SQLite)
└── QR Code (Génération & Scan)
```

### 7. Sécurité et gestion des données
L’application devra :
- garantir l’unicité des numéros de billets
- empêcher l’utilisation multiple d’un billet
- sécuriser les données des utilisateurs
- sauvegarder les données dans une base fiable

### 8. Résultats attendus
- Création simple d’événements
- Génération automatique de billets avec QR code
- Gestion des ventes et des paiements
- Contrôle rapide des entrées
- Visualisation via calendrier
