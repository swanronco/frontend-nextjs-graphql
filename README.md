# Frontend Next.js + GraphQL Auth (TypeScript)

Frontend minimal (Next.js 14 **App Router** + React 18 + TypeScript) d'authentification contre une API GraphQL, livré avec une image **Docker**, des manifests **Kubernetes** (Kustomize) et un pipeline **CI/CD GitHub Actions**.

Fonctionnalités :

- **Inscription** — formulaire `firstName`, `lastName`, `email`, `username`, `password`. Appelle la mutation `createUser(input: UserInput!)`.
- **Connexion** — mutation `login(identifier, password)` qui accepte **email ou username** comme identifiant et renvoie un **JWT** (+ les infos utilisateur). Le JWT est stocké en `localStorage`.
- **Déconnexion** — action dans la barre de navigation : mutation `logout(token)` envoyée avec l'en-tête `Authorization: Bearer <JWT>`, puis nettoyage du token local.

## 🧱 Stack

- **Next.js 14** (App Router, composants `'use client'`)
- **React 18** / **TypeScript 5** (`strict`)
- **ESLint** (`eslint-config-next`)
- **Node.js 18**
- Conteneurisation **Docker** (multi-stage), orchestration **Kubernetes** via **Kustomize**, CI/CD **GitHub Actions** → image publiée sur **GHCR**.

## ⚙️ Endpoint GraphQL

L'endpoint est lu depuis la variable d'environnement **`GRAPHQL_ENDPOINT`** (voir `lib/graphql.ts`). Valeur par défaut si non définie :

```
http://localhost:8080/api/graphql
```

En local, elle est définie dans `.env.local` :

```
GRAPHQL_ENDPOINT=http://localhost:8080/api/graphql
```

En cluster, elle est injectée par la `ConfigMap` `graphql-endpoint-config` (différente selon l'overlay dev/prod).

> ⚠️ **CORS** : le backend doit autoriser l'origine du frontend (http://localhost:3000 en dev) et l'en-tête `Authorization`.
>
> ℹ️ Les requêtes GraphQL partent du **navigateur** (composants client). Pour qu'une valeur d'environnement soit réellement exposée au navigateur avec Next.js, elle doit en principe être préfixée `NEXT_PUBLIC_`. La variable actuelle s'appelle `GRAPHQL_ENDPOINT` (alignée sur la ConfigMap K8s) ; à garder en tête si tu changes l'endpoint sans voir l'effet côté client.

## 🔧 Mutations GraphQL attendues du backend

Inscription :

```graphql
mutation SignUp($input: UserInput!) {
  createUser(input: $input) {
    firstName
    lastName
    email
    username
  }
}
# $input = { firstName, lastName, email, username, password }
```

Connexion :

```graphql
mutation Login($identifier: String!, $password: String!) {
  login(identifier: $identifier, password: $password) {
    token
    user { id username email }
  }
}
```

Déconnexion :

```graphql
mutation Logout($token: String!) {
  logout(token: $token) {
    success
    message
  }
}
```

## 🚀 Démarrage (local)

```bash
# 1) Installer les dépendances
npm install

# 2) Lancer en développement
npm run dev          # ou ./launch.sh
# -> http://localhost:3000
```

Autres scripts (`package.json`) :

```bash
npm run build        # build de production Next.js
npm start            # lance le serveur de production (après build)
npm run lint         # ESLint
```

## 📁 Pages

- `/` — accueil ; affiche un message de bienvenue si un JWT est présent.
- `/signup` — création de compte. Redirige vers `/` si déjà connecté.
- `/login` — connexion par identifiant (email ou username) + mot de passe ; stocke le JWT. Redirige vers `/` si déjà connecté.

La **déconnexion** n'est pas une page : c'est un bouton de la barre de navigation (`components/NavBarAuth.tsx`).

## 🗂️ Structure

```
app/
  layout.tsx          # layout racine + <NavBar/>
  page.tsx            # accueil
  globals.css         # styles globaux
  login/page.tsx      # connexion
  signup/page.tsx     # inscription
components/
  NavBar.tsx          # wrapper (import dynamique, ssr:false)
  NavBarAuth.tsx      # nav auth (liens + déconnexion + état connecté)
  TextInput.tsx       # champ de formulaire réutilisable
lib/
  graphql.ts          # client fetch GraphQL (lecture GRAPHQL_ENDPOINT)
  mutations.ts        # mutations login / logout / createUser
  auth.ts             # token localStorage + cookie d'état UI (auth_logged)
  hash.ts             # SHA-256 (Web Crypto) — utilitaire (non utilisé actuellement)
Dockerfile            # image multi-stage (build + runtime)
k8s/                  # manifests Kubernetes (Kustomize)
.github/workflows/    # CI/CD GitHub Actions
launch.sh             # raccourci: npm run dev
```

## 🔑 Gestion de session

- Le JWT est stocké dans `localStorage` sous la clé `auth.token`.
- Un cookie **non sensible** `auth_logged=1` (SameSite=Lax) sert uniquement à afficher l'état « connecté » dans l'UI sans flash au chargement ; il ne contient pas le token.
- La déconnexion appelle `logout`, puis supprime le token `localStorage` et le cookie.

## 🐳 Docker

Image multi-stage basée sur `node:18-alpine` (étape `builder` qui fait `npm run build`, puis étape `runner` qui lance `npm start`). Le conteneur expose le port **3000**.

```bash
docker build -t ghcr.io/swanronco/frontend-nextjs-graphql:latest .
docker run -p 3000:3000 \
  -e GRAPHQL_ENDPOINT=http://localhost:8080/api/graphql \
  ghcr.io/swanronco/frontend-nextjs-graphql:latest
```

## ☸️ Kubernetes (Kustomize)

Manifests dans `k8s/`, déployés dans le namespace **`frontend`** :

```
k8s/base/        deployment, service (:3000), hpa (2→4 pods @80% CPU),
                 serviceaccount, namespace, resourcequota, limitrange
k8s/overlays/dev faible empreinte : 1 replica, NODE_ENV=development,
                 GRAPHQL_ENDPOINT -> backend interne au cluster
k8s/overlays/prod 2 replicas, NODE_ENV=production, stratégie maxUnavailable,
                 GRAPHQL_ENDPOINT à renseigner (vide par défaut)
```

Rendu / application :

```bash
# Visualiser le rendu (validation locale, sans cluster)
kustomize build k8s/overlays/dev
kustomize build k8s/overlays/prod

# Appliquer
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/prod
```

L'image déployée est `ghcr.io/swanronco/frontend-nextjs-graphql` (tag `latest`, fixé dans chaque overlay).

## 🔁 CI/CD (GitHub Actions)

Workflow : `.github/workflows/deploy.yml`. Déclenché sur push et PR vers `main`.

- **Valider les manifests Kubernetes** — `kustomize build` des overlays dev et prod.
- **Garde-fou qualité** — `npm ci`, `npm run lint`, `npm run build` (vérification ; l'artefact n'est pas conservé).
- **Build & push de l'image Docker** — sur `main` uniquement : build via Buildx (cache GitHub Actions) et push sur GHCR, tags `latest` + SHA du commit.
- **Déploiement Kubernetes** — étape `rollout restart` présente mais **commentée** (à activer avec un secret `KUBECONFIG`).

## 🔐 Notes sécurité

- **Hachage du mot de passe** : le formulaire d'inscription envoie actuellement le mot de passe **en clair** (`password`) au backend, qui doit donc le hacher et l'étirer (Argon2 / bcrypt) côté serveur, **impérativement** au-dessus de TLS. L'utilitaire `lib/hash.ts` (SHA-256 Web Crypto) est présent mais n'est plus branché sur le formulaire.
- **JWT en `localStorage`** : simple mais sensible aux attaques XSS. Envisager des cookies `HttpOnly` si le backend le permet.
