# --- Étape 1 : "builder" ----------------------------------------------
# node:22-SLIM (Debian), pas node:22-alpine. Alpine (musl) a causé des
# échecs répétés de détection OpenSSL avec le moteur natif de Prisma
# (le moteur chargeait une libssl.so.1.1 qui n'existe plus sur les
# Alpine récents, malgré OpenSSL 3.x installé). Debian slim fournit un
# environnement glibc standard où Prisma détecte OpenSSL sans ambiguïté
# — c'est la base recommandée par Prisma lui-même en cas de doute.
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# openssl + ca-certificates : nécessaires pour que Prisma détecte
# correctement la version d'OpenSSL et pour les appels HTTPS sortants
# (météo, GitHub...) que fera ce backend.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copié en premier, séparément du reste : Docker met cette étape en cache
# tant que package*.json ne change pas, donc les reconstructions futures
# sans changement de dépendances seront quasi instantanées.
COPY package*.json ./
RUN npm ci

# Prisma doit lire le schéma AVANT de générer le client, donc ce fichier
# doit être présent dans l'image à ce stade — copié séparément du reste
# du code pour la même raison de cache que ci-dessus.
COPY prisma ./prisma
RUN npx prisma generate

# Le reste du code source (voir .dockerignore pour ce qui est exclu)
COPY . .

# --- Étape 2 : image finale, allégée -------------------------------------
# On repart d'une image Node/Debian fraîche, et on ne récupère de
# l'étape "builder" QUE ce qui est nécessaire à l'exécution.
FROM node:22-slim

WORKDIR /usr/src/app

# Même raison qu'à l'étape "builder" : nécessaire à l'EXÉCUTION du
# moteur Prisma, pas seulement à sa génération.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copie tout ce que "builder" a produit : code source, node_modules
# (avec le client Prisma déjà généré dedans).
COPY --from=builder /usr/src/app ./

# Retire les paquets listés dans devDependencies (nodemon, prisma CLI...)
# — ils ont servi à builder, ils sont inutiles à l'exécution.
RUN npm prune --omit=dev

EXPOSE 8080

CMD ["npm", "start"]
