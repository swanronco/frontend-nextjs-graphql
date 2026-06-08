# Commandes — frontend-nextjs-graphql

Aide-mémoire des commandes fréquentes du projet.

## Développement local

```bash
npm install        # installer les dépendances
npm run dev        # serveur de dev -> http://localhost:3000   (équivaut à ./launch.sh)
npm run lint       # ESLint
npm run build      # build de production Next.js
npm start          # servir le build de production (après npm run build)
```

Endpoint GraphQL ciblé : variable `GRAPHQL_ENDPOINT` (défaut `http://localhost:8080/api/graphql`), définie dans `.env.local`.

## Docker

```bash
# Construire l'image (nom aligné sur GHCR)
docker build -t ghcr.io/swanronco/frontend-nextjs-graphql:latest .

# Lancer le conteneur sur le port 3000
docker run -p 3000:3000 \
  -e GRAPHQL_ENDPOINT=http://localhost:8080/api/graphql \
  ghcr.io/swanronco/frontend-nextjs-graphql:latest

# Pousser sur GHCR (après login)
echo "$GHCR_TOKEN" | docker login ghcr.io -u swanronco --password-stdin
docker push ghcr.io/swanronco/frontend-nextjs-graphql:latest
```

## Kubernetes (Kustomize, namespace `frontend`)

```bash
# Fusionne base + overlay (replicas, ressources, ConfigMap/Secret, tag image...)
# et IMPRIME le YAML final sur la sortie standard, SANS rien envoyer au cluster.
# Idéal pour vérifier/valider en local ce qui sera réellement déployé.
# Sort en ERREUR (code non-zéro) si le build échoue : fichier référencé manquant,
# patch invalide, champ inconnu, YAML mal formé... -> d'où son usage comme garde-fou en CI.
# Limite : ne valide que le RENDU, pas le cluster (namespace inexistant, schéma API,
# webhooks d'admission...) -> ces erreurs-là n'apparaissent qu'au "apply".
kubectl kustomize k8s/overlays/dev          # ou: kustomize build k8s/overlays/dev

# Applique = même fusion base + overlay, PUIS envoi du résultat au cluster ("build + apply")
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/prod

# Suivre / inspecter
kubectl -n frontend get pods,svc,ingress,hpa
kubectl -n frontend logs -l app=frontend-nextjs-graphql -f
# Redémarrage progressif des pods (rolling restart).
# Force le cluster à re-pull l'image derrière le tag actuel (utile avec :latest).
# ⚠ Rollback aveugle : si les deux déploiements utilisent :latest, `rollout undo`
#   ne sait pas quelle version exacte il restaure.
kubectl -n frontend rollout restart deploy/frontend-nextjs-graphql

# Alternative plus propre pour un hotfix ou un déploiement traçable :
# remplace l'image par un SHA précis -> rollback fiable car `rollout undo`
# restaure exactement le SHA précédent (visible dans `rollout history`).
kubectl -n frontend set image deploy/frontend-nextjs-graphql \
  frontend-nextjs-graphql=ghcr.io/swanronco/frontend-nextjs-graphql:<SHA_COMMIT>

kubectl -n frontend rollout status  deploy/frontend-nextjs-graphql
kubectl -n frontend rollout history deploy/frontend-nextjs-graphql   # voir les révisions
kubectl -n frontend rollout undo    deploy/frontend-nextjs-graphql   # revenir à la révision précédente
```

## Git (flux habituel)

```bash
git checkout -b <type>/<description-explicite>
git add -A && git commit -m "<message>"
git push -u origin <branche>
# PR -> merge sur main (gh ou UI GitHub), puis :
git checkout main && git pull origin main && git branch -d <branche>
```

> Déploiement local complet dans kind (cluster + ingress + Postgres + GHCR) : voir le dossier `kind-local/` du workspace.
