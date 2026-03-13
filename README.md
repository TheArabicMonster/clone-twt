# Clone TWT - README Technique

Application web full-stack de type micro-réseau social, construite avec Next.js côté interface et API, Prisma comme couche d'accès aux données MongoDB Atlas, Auth.js pour les sessions, Zod pour la validation stricte des entrées et Bcrypt pour la protection des mots de passe.

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

### Mise en service (moins de 5 minutes)

#### Prérequis

- Node.js 20+
- npm
- Base MongoDB Atlas disponible

#### 1) Cloner et installer

```bash
git clone https://github.com/TheArabicMonster/clone-twt.git
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

```

#### 2.1) Créer une base MongoDB Atlas et récupérer l'URL

1. Créer un compte sur MongoDB Atlas puis créer un projet.
2. Créer un cluster (option gratuite M0 suffit pour le développement).
3. Aller dans Database Access et créer un utilisateur base de données (username/password).
4. Aller dans Network Access et autoriser ton IP actuelle (ou `0.0.0.0/0` en dev uniquement).
5. Dans le cluster, cliquer sur Connect puis Drivers.
6. Copier la connection string fournie par Atlas.
7. Remplacer `<password>` par le mot de passe de l'utilisateur DB.
8. Remplacer `<db>` par le nom de ta base (exemple: `clone_twt`).
9. Coller la valeur finale dans `DATABASE_URL` de ton `.env`.

Exemple final:

```env
DATABASE_URL=mongodb+srv://myUser:myStrongPassword@cluster0.xxxxx.mongodb.net/clone_twt?retryWrites=true&w=majority&appName=Cluster0
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
