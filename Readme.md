## Jour 1

# 1. Architecture Mise en Place (La Stack Technique)

Composant, outils, version, rôle et justification Technique  
Backend,NestJS (v11+), "Framework Node.js pour construire une API modulaire, type-safe et testable (TDD)."  
Base de Données,PostgreSQL (Railway), Base de données cloud relationnelle. Son exposition via un port temporaire nécessite une configuration réseau et d'authentification précise.  
ORM / Client, Prisma (v6+), ORM moderne choisi pour son outil d'Introspection rapide (db pull) et sa capacité à générer un client TypeScript type-safe.  
Tests, Jest, "Framework de tests standard de NestJS, validé pour l'approche TDD."  
Fix Environnement, dotenv-cli,Outil crucial pour forcer le chargement des variables d'environnement sur certains environnements CLI (résolution de l'erreur Missing DATABASE_URL).  


# 2. Résolution des Blocages Techniques Majeurs

Problème / message d'erreur, cause, solution et résultat  
Error: P1001 (Connexion réseau/hôte), l'instance Railway n'était pas accessible par le port par défaut (5432).,Correction du Port Externe : Identification de l'adresse et du port publics Railway (ex: maglev.proxy.rlwy.net:52787) pour la DATABASE_URL.  
Error: P1000 (Échec d'authentification), erreur dans le copier-coller des identifiants ou problème d'URL-encodage des caractères spéciaux., "Correction DATABASE_URL Définitive : Utilisation directe de la variable DATABASE_PUBLIC_URL de Railway, garantie d'être complète et correctement encodée."  
Error: PrismaConfigEnvError: Missing DATABASE_URL, l'outil npx prisma ne charge pas le fichier .env sur l'environnement d'exécution., Fix dotenv-cli : Modification des scripts npm dans package.json pour charger le .env avant chaque exécution de Prisma.  
WARNING sur CHECK CONSTRAINTS,Le script SQL importé utilise des contraintes CHECK non supportées par l'introspection Prisma.,Statut : Non bloquant. Les règles sont maintenues par PostgreSQL. La validation sera gérée au niveau du Service NestJS.


# 3. Commandes Exécutées & Validation du Jour 1

Étape, commande exécutée, résultat  
3. Introspection DB, npm run prisma:pull, succès. Connexion et lecture du schéma DB Railway (9 modèles générés).  
4. Génération Client, npm run prisma:generate, succès. Génération du client TypeScript (@prisma/client) après correction du script dans package.json.  
5. Validation TDD, npm run test, succès (Attendu). L'environnement Jest est validé.


# Modifications Clés dans package.json

Le format des scripts a été standardisé pour assurer la stabilité :  
```json
    "scripts": {
    // ... autres scripts ...
    "prisma:pull": "dotenv -e .env -- npx prisma db pull", 
    "prisma:generate": "dotenv -e .env -- npx prisma generate" 
  },
```

# Fichier .env Final

La DATABASE_URL a été mise à jour en utilisant la source la plus fiable :  
```
# Chaîne de connexion fiable (copiée depuis DATABASE_PUBLIC_URL de Railway)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@maglev.proxy.rlwy.net:52787/railway"
```