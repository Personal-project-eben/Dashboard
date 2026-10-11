# Préparation à la Soutenance (Défense) - Dashboard

Voici les réponses claires, techniques et explicites pour les 4 questions posées par le jury.

---

### 1. Différence entre le "Timer" et le "Refresh"

**Le concept à expliquer :**
Il faut bien séparer la **mécanique d'horloge** (le timer) et **l'action métier** (le refresh).

- **Le Refresh (Rafraîchissement) :** C'est l'action précise de faire une requête HTTP (fetch) vers notre Backend pour aller chercher les nouvelles données du widget (par exemple, la nouvelle température ou le nouveau cours du Bitcoin), puis de mettre à jour l'affichage sur le Frontend.
- **Le Timer (Minuteur) :** C'est le chef d'orchestre. C'est une boucle (basée sur `setInterval` en JavaScript) qui tourne en arrière-plan pour **chaque widget indépendamment**. Si un utilisateur règle un widget sur 60 secondes, le timer attend 60 secondes, puis déclenche l'action de *Refresh*.

**Le fichier Timer / Les Hooks React :**
Dans notre Frontend, la gestion du temps est isolée dans un "Hook" (ou directement dans le composant du widget). L'élément crucial à expliquer au jury est le **nettoyage (cleanup)** : quand on supprime un widget du dashboard, le composant est détruit (unmount). Il faut absolument faire un `clearInterval()` pour détruire le timer, sinon il continuera de tourner dans le vide et de faire des requêtes (fuite de mémoire).

---

### 2. La Base de Données (Concept)

**Le concept à expliquer :**
Nous avons choisi une architecture **Relationnelle** (SQL) avec **PostgreSQL**, orchestrée par **Prisma ORM**.

- **Le concept relationnel :** Notre base de données n'est pas juste un tas de documents en vrac. Tout est relié par des relations strictes (Clés Étrangères). 
  - L'entité centrale est l'**Utilisateur**.
  - Un utilisateur possède (1-to-N) des **Widgets**.
  - Un utilisateur possède (1-to-N) des **Services** (comme son lien OAuth GitHub).
- **L'intégrité et la sécurité :** Grâce à ce modèle, si un utilisateur est supprimé de la base, tous ses widgets et ses données de service sont supprimés automatiquement en cascade (Cascade Delete).
- **Prisma (L'ORM) :** Prisma nous permet de ne pas écrire de requêtes SQL à la main (qui peuvent être vulnérables aux injections SQL). Prisma traduit notre modèle en base de données et nous fournit des objets de code prêts à l'emploi et ultra sécurisés.

---

### 3. Le "fichier" about.json

**Le concept à expliquer :**
Le piège ici est d'utiliser le mot "fichier". **Ce n'est pas un fichier statique.**

- **C'est une Route API :** Dans notre architecture, `about.json` est une route dynamique (`GET /about.json`) exposée par notre Backend (Express).
- **Pourquoi dynamique ?** Parce que le cahier des charges exige de renvoyer l'adresse IP de celui qui fait la requête (`req.ip`) et l'heure actuelle du serveur (`current_time`). Un simple fichier texte ne peut pas faire cela.
- **La carte d'identité du serveur :** Cette route lit notre fichier de configuration interne (`catalog.js`) et génère en temps réel la liste de tous nos services et de tous nos widgets disponibles. C'est le contrat qui permet à un système externe de savoir ce que notre Dashboard sait faire.

---

### 4. Comment nous gérons les Comptes Externes (External Accounts)

**Le concept à expliquer :**
Il s'agit d'expliquer le flux **OAuth 2.0** et surtout la **sécurité des clés**. Prenons l'exemple de GitHub.

1. **L'Autorisation (OAuth) :** Quand l'utilisateur veut connecter GitHub, il ne nous donne pas son mot de passe. On le redirige vers GitHub. Il accepte, et GitHub nous renvoie un code temporaire.
2. **L'Échange sécurisé :** Notre Backend prend ce code et l'envoie à GitHub accompagné de nos clés secrètes (`GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`). Ces clés sont uniquement dans notre `.env` et ne sont jamais visibles dans le code source ou sur le Frontend.
3. **Le Chiffrement du Token (Point fort pour le jury) :** GitHub nous donne alors un `access_token` (qui permet de lire les données de l'utilisateur). **Nous ne stockons jamais ce token en clair.** Avant de l'enregistrer dans PostgreSQL, notre Backend le chiffre avec un algorithme fort (AES-256-CBC ou GCM). 
4. **L'Utilisation :** Quand un widget a besoin d'afficher les commits, le Backend va chercher le token chiffré dans la base, le déchiffre à la volée, fait la requête à GitHub, et renvoie juste la réponse au Frontend. Le Frontend ne voit jamais le token.
