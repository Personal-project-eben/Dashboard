# 📊 Point du projet Dashboard — G-WEB-500

> Analyse par rapport aux exigences du sujet PDF (v0.1.2)
> Mise à jour : 25 septembre 2026

---

## 🔢 Exigence de volume (groupe de X étudiants)

Le sujet impose : **au moins (1 + X) services** et **(3 × X) widgets** au total.

| Élément | Requis (binôme X=2) | Implémenté | Statut |
|---|---|---|---|
| Services | ≥ 3 | 3 (Weather, RSS, GitHub) | ✅ |
| Widgets | ≥ 6 | 6 (voir ci-dessous) | ✅ |

### Widgets implémentés

| Service | Widget | Paramètres | Valide ? |
|---|---|---|---|
| Weather | `city_temperature` | `city` (string) | ✅ |
| Weather | `forecast` | `city` (string), `days` (integer) | ✅ |
| RSS | `article_list` | `link` (string), `number` (integer) | ✅ |
| RSS | `feed_headline` | `link` (string) | ✅ |
| GitHub | `recent_commits` | `repo` (string), `number` (integer) | ✅ |
| GitHub | `security_alerts` | `repo` (string) | ✅ |

---

## ✅ Ce qui est FAIT

### Gestion des utilisateurs
- [x] Inscription par email + mot de passe (POST /auth/signup)
- [x] Confirmation du compte avant accès (token loggé en console)
- [x] Connexion par cookie de session httpOnly + sameSite=lax
- [x] Déconnexion (POST /auth/logout)
- [x] Page /confirm?token=... côté frontend
- [x] Mots de passe hashés avec bcrypt (jamais en clair)
- [x] Sessions avec identifiant aléatoire 32 octets

### Identité & permissions
- [x] Authentification par cookie de session
- [x] OAuth 2.0 GitHub (liaison compte → ServiceSubscription)
- [x] Tokens OAuth chiffrés en base via AES-256-GCM
- [x] Ownership des widgets vérifiée (userId systématique, réponse 404 neutre)

### Services & Widgets
- [x] Weather via Open-Meteo (gratuit, sans compte)
- [x] RSS via fast-xml-parser
- [x] GitHub via REST API v3 (nécessite OAuth)
- [x] Tous les widgets ont des paramètres configurables
- [x] Source unique de vérité catalog.js

### Timer
- [x] Chaque widget instance a un refreshRate (secondes)
- [x] Le frontend rafraîchit automatiquement chaque widget selon son propre timer
- [x] Deux instances du même widget avec configs différentes → données distinctes

### Dashboard
- [x] Ajouter un widget (sélection type + config + refreshRate + confirmation)
- [x] Reconfigurer un widget (PATCH /dashboard/widgets/:id)
- [x] Déplacer un widget (position persistée en base)
- [x] Supprimer un widget (DELETE /dashboard/widgets/:id)
- [x] Formulaire d'ajout construit dynamiquement depuis /about.json

### Contrat GET /about.json
- [x] client.host
- [x] server.current_time (Unix timestamp)
- [x] server.services[].name
- [x] server.services[].widgets[].name
- [x] server.services[].widgets[].params[].name
- [x] server.services[].widgets[].params[].type (string | integer)

### Infrastructure
- [x] docker-compose build
- [x] docker-compose up → backend port 8080, frontend port 3000
- [x] PostgreSQL via Docker
- [x] Prisma ORM avec migrations
- [x] CORS configuré pour dev (:5173) et Docker (:3000)
- [x] /health avec vérification DB

### Frontend
- [x] React + Vite + TypeScript
- [x] Routes : /, /login, /register, /dashboard, /confirm
- [x] Interface responsive (mobile, tablette, desktop)
- [x] Protection des routes (redirect /login si non authentifié)
- [x] Client API centralisé avec credentials: 'include'
- [x] Affichage des données réelles pour chaque type de widget
- [x] Gestion d'erreur (erreur API, GitHub non lié → lien OAuth)

---

## ❌ Ce qui RESTE à faire

### 🔴 Priorité haute

#### 1. Page "Services" — abonnement explicite
> "users must first select the services for which they have an account"
- [x] Page dédiée /services montrant les services disponibles
- [x] Statut de connexion : Weather ✓ auto, RSS ✓ auto, GitHub (bouton OAuth)
- [x] Lien "Connecter GitHub" accessible sans devoir ajouter un widget qui échoue
- Actuellement : fait !

#### 2. README.md principal à compléter
> Le sujet exige dans le README :
- [x] Liste des fonctionnalités, services et widgets disponibles
- [x] Étapes précises et reproductibles pour installer et builder
- [x] Vue d'ensemble du but et des cas d'usage
- [x] Instructions claires pour lancer et utiliser
- [x] Description des technologies et de l'architecture
- Actuellement : README complet !

#### 3. Confirmation de compte — meilleure UX
- [x] Actuellement : token affiché dans l'UI via le backend au signup
- [x] Option simple : le backend retourne le token pour que le frontend affiche un lien cliquable
- [x] Option idéale : vrai email via Nodemailer + Mailtrap/Mailpit

### 🟠 Priorité moyenne

#### 4. Section administration
> "an administration section would be very useful"
- [ ] Page /admin pour lister les utilisateurs
- [ ] Voir les comptes non confirmés
- [ ] Réinitialiser / confirmer manuellement un compte
- Actuellement : aucune interface admin

#### 5. Page profil utilisateur
- [ ] Page /profile : email affiché, changer mot de passe
- [ ] Voir et révoquer les services OAuth connectés (notamment GitHub)

#### 6. Accessibilité
> "high-quality, responsive interface with good UX and accessibility features"
- [ ] Attributs aria-label plus complets sur les boutons icônes
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Navigation clavier dans les modals (trap focus)
- [ ] Vérifier les contrastes des textes gris

### 🟡 Priorité basse / bonus

#### 7. Vidéo de démo
> "Recording a short video showcasing your main features"
- [ ] Enregistrer une démo de 2-3 min (OBS, Loom…) du workflow complet

#### 8. Diagramme d'architecture dans le README
- [ ] Schéma simple backend : routes → services → APIs externes
- [ ] Flux OAuth GitHub

#### 9. Gestion réseau côté frontend
- [ ] Toast/notification visuelle si sauvegarde échoue
- [ ] Retry automatique si backend temporairement indisponible

---

## 📋 Récapitulatif priorités

| # | Tâche | Priorité | Effort |
|---|---|---|---|
| 1 | Page /services (abonnement GitHub visible) | 🔴 Haute | ~2h |
| 2 | README.md complet | 🔴 Haute | ~1h |
| 3 | Envoi vrai email de confirmation (Nodemailer) | ✅ Fait | ~30min |
| 4 | Section admin basique | 🟠 Moyenne | ~3h |
| 5 | Page profil utilisateur | 🟠 Moyenne | ~2h |
| 6 | Accessibilité (aria, focus, contraste) | 🟠 Moyenne | ~2h |
| 7 | Vidéo de démo | 🟡 Basse | ~1h |
| 8 | Diagramme architecture | 🟡 Basse | ~30min |
