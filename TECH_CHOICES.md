# Choix Technologiques

Pour chaque couche du projet, nous avons évalué au moins trois options avant de prendre une décision.

### Framework Backend

| Option | Testé (POC) | Notes |
|---|---|---|
| **Express** ✅ | Oui | Minimaliste, très bien documenté, énorme écosystème. Facile à structurer avec des routeurs. |
| Fastify | Oui | Plus rapide qu'Express, bon support TypeScript, mais plus opinionné et moins familier pour l'équipe. |
| Hono | Oui | Très léger, fonctionne aussi sur les runtimes edge, mais son écosystème est plus petit et la documentation moins étoffée. |

**Choix : Express.** On doit exploiter des données depuis plusieurs APIs externes hétérogènes en parallèle (météo, RSS, GitHub etc..) puis les recombiner pour chaque widget — un cas d'usage pour lequel le modèle asynchrone non-bloquant de Node.js (event loop, async/await) est directement adapté, puisqu'il traite plusieurs appels réseau concurrents sans thread dédié par requête, contrairement à un modèle synchrone par thread comme celui de PHP ou Java par défaut. Le choix de JavaScript côté backend permet aussi de partager le même langage avec le frontend React, ce qui réduit la friction dans une équipe de deux développeurs qui doivent se relire mutuellement. Enfin, l'écosystème npm a permis de couvrir rapidement des besoins précis sans réinventer la roue (Prisma pour l'ORM, fast-xml-parser pour le RSS)

---

### Framework Frontend

| Option | Testé (POC) | Notes |
|---|---|---|
| **React** ✅ | Oui | Modèle par composants, large écosystème, les hooks sont très expressifs pour la récupération de données et les timers. |
| Vue 3 | Oui | Syntaxe agréable, bonne documentation, mais l'équipe n'avait aucune expérience préalable avec. |
| Svelte | Oui | Très peu de code standard (boilerplate), pas de DOM virtuel, mais modèle mental très différent et écosystème plus restreint. |


---

### Base de données

| Option | Testé (POC) | Notes |
|---|---|---|
| **PostgreSQL** ✅ | Oui | Relationnelle, robuste, supporte des requêtes complexes, très utilisée en production. |
| SQLite | Oui | Zéro configuration, basée sur un fichier, mais inadaptée pour des déploiements multi-conteneurs Docker. |
| MongoDB | Oui | Schéma flexible, mais la nature relationnelle de nos données (utilisateurs → widgets → sessions) s'adapte mal aux documents. |

**Choix : PostgreSQL.** Nos données sont intrinsèquement relationnelles (un utilisateur possède des instances de widgets, qui font référence à des services et des configurations). Les clés étrangères et les garanties transactionnelles de PostgreSQL étaient un choix naturel. Elle s'exécute également proprement en tant que service Docker.

---

### ORM (Object-Relational Mapping)

| Option | Testé (POC) | Notes |
|---|---|---|
| **Prisma** ✅ | Oui | Orienté schéma, types générés automatiquement, migrations intégrées, excellente expérience développeur (DX). |
| Sequelize | Oui | Mature mais verbeux ; les définitions de modèles semblent répétitives sans génération de code TypeScript. |
| Drizzle | Oui | Orienté SQL et très léger, mais encore jeune et documentation parfois éparse. |

**Choix : Prisma.** Le fichier de schéma agit comme une source unique de vérité à la fois pour la structure de la base de données et les types TypeScript. Le système de migration (`prisma migrate dev`) et le script d'initialisation (seed) ont facilité la mise en place d'un environnement reproductible à partir de zéro avec une seule commande.

---

### Connaissances préalables de l'équipe

| Membre | Connaissances existantes | Impact sur les décisions |
|---|---|---|
| Membre 1 | React, bases d'Express, bases de PostgreSQL | A confirmé React + Express comme des choix sûrs et rapides. |
| Membre 2 | React, un peu de Node.js, bases de SQL | A renforcé le choix de la même stack ; nous a poussés à explorer Prisma comme une meilleure alternative au SQL brut. |

Le recoupement de nos connaissances préalables a été le facteur décisif : choisir des technologies que les deux membres comprenaient déjà signifiait que nous pouvions répartir le travail efficacement et relire le code de l'autre sans créer de silos de connaissances.
