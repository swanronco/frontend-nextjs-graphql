# Étape 1 : Construction de l'application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Endpoint GraphQL appelé par le NAVIGATEUR : doit être présent AU BUILD, car Next.js
# fige les variables NEXT_PUBLIC_* pendant `next build` (pas au runtime du conteneur).
# Surchargé par --build-arg en CI selon l'environnement (dev/prod).
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://api.journalintime.eu/api/graphql
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=$NEXT_PUBLIC_GRAPHQL_ENDPOINT
RUN npm run build

# Étape 2 : Exécution de l'application
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]