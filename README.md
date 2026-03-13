# Clone TWT - README Technique

Application web full-stack de type micro-réseau social, construite avec Next.js côté interface et API, Prisma comme couche d'accès aux données MongoDB Atlas, Auth.js pour les sessions, Zod pour la validation stricte des entrées et Bcrypt pour la protection des mots de passe. L'application est pensée pour supporter des interactions en temps réel via Pusher et la gestion de médias utilisateurs via Cloudinary.

### Stack technique

Le frontend repose sur Next.js (App Router), HeroUI pour les composants et TailwindCSS pour le styling. Le backend est porté par les routes API Next.js avec une logique REST, protégée par Auth.js (authentification/session) et validée avec Zod. La persistance se fait sur MongoDB Atlas à travers Prisma, qui fournit un mapping typé TypeScript vers le modèle NoSQL.

### Architecture et flux de données

Le flux nominal d'une requête est le suivant: l'utilisateur agit depuis l'interface, le client appelle une route API, la route vérifie la session, valide les données reçues, exécute la mutation ou la lecture via Prisma, puis retourne une réponse JSON consommée par le frontend.

```text
Client (Next.js + HeroUI)
	-> API Route (Auth.js + Zod)
	-> Prisma Client
	-> MongoDB Atlas
	-> Réponse JSON
```

Pour les événements temps réel, le backend publie un événement après mutation valide, et les clients abonnés reçoivent la mise à jour par WebSocket.

```text
Mutation API réussie
	-> Trigger Pusher (channel + event)
	-> Broadcast WebSocket
	-> Rafraîchissement ciblé de l'UI côté clients abonnés
```

Pour les médias, le backend envoie le fichier vers Cloudinary, récupère l'URL publique et persiste cette URL dans MongoDB via Prisma. La base conserve donc une référence d'asset, pas le fichier brut.

```text
Upload utilisateur
	-> API Route
	-> Cloudinary (stockage/CDN)
	-> URL publique
	-> Prisma update/create (User.image, User.coverImage, etc.)
```

### Sécurité et intégrité

Auth.js isole les routes publiques des routes protégées et maintient une session serveur fiable. Les mots de passe ne sont jamais stockés en clair: Bcrypt calcule un hash avant écriture en base. Zod sert de pare-feu applicatif contre les entrées invalides et réduit les risques d'injections logiques en imposant un schéma strict sur chaque payload entrant (types, tailles, regex, contraintes inter-champs).

Prisma renforce la cohérence en centralisant les contraintes métier au niveau du modèle (unicité d'email/username, unicité composite des follows/likes) et en empêchant une grande partie des erreurs de typage ou de mapping.

### Mise en service (moins de 5 minutes)

#### Prérequis

- Node.js 20+
- npm
- Base MongoDB Atlas disponible

#### 1) Cloner et installer

```bash
git clone <url-du-repo>
cd clone-twt
npm install
```

#### 2) Configurer l'environnement

Créer un fichier `.env` à la racine en reprenant la base suivante.

```env
# App
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=replace_with_a_long_random_secret

# Database
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# Pusher (temps réel)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Cloudinary (médias)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
```

#### 3) Générer Prisma Client

```bash
npx prisma generate
```

#### 4) Lancer le projet

```bash
npm run dev
```

Accès local: http://localhost:3000

### Section .env.example (référence de configuration)

Le projet doit disposer d'une référence de variables pour éviter toute ambiguïté de setup. Le bloc ci-dessous peut être copié tel quel comme base de `.env.example`.

```env
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=
DATABASE_URL=

PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
```

### Arborescence simplifiée

```text
.
|- prisma/
|  |- schema.prisma
|- src/
|  |- app/
|  |  |- (protected)/
|  |  |- api/
|  |  |  |- auth/
|  |  |  |- tweets/
|  |  |- login/
|  |  |- signup/
|  |- components/
|  |- lib/
|  |  |- auth.ts
|  |  |- prisma.ts
|  |- types/
|- middleware.ts
|- package.json
```

### Pourquoi ces choix techniques

Zod réduit le coût des erreurs en validant à la frontière de l'API avant l'accès aux données. Prisma apporte un contrat typé unique entre le code et la base MongoDB, ce qui fiabilise les requêtes et accélère l'évolution du modèle. Pusher évite le polling continu en diffusant les événements utiles uniquement quand ils existent. Cloudinary externalise le stockage média et la distribution CDN, ce qui réduit la charge backend et stabilise les performances de rendu d'images.
