# Backend TechSpace Solutions

Backend de l'application de gestion des réservations de salle de réunion TechSpace Solutions.

## Stack Technique

- **Framework**: Express.js
- **Base de données**: MySQL (mysql2)
- **Authentification**: JWT + bcrypt
- **Variables d'environnement**: dotenv

## Installation

### Prérequis

- Node.js (v16 ou supérieur)
- MySQL/MariaDB
- npm ou yarn

### Étapes

1. **Installer les dépendances**

```bash
npm install
```

2. **Configurer les variables d'environnement**

Copier le fichier `.env.example` vers `.env` et renseigner les valeurs :

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres :

```env
# Configuration Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=techspace_db

# Configuration JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=24h

# Configuration Serveur
PORT=5000
NODE_ENV=development
```

⚠️ **IMPORTANT**: Changez `JWT_SECRET` en production avec une clé sécurisée !

3. **Créer la base de données**

Exécuter les requêtes SQL suivantes dans MySQL :

```sql
CREATE DATABASE IF NOT EXISTS techspace_db;
USE techspace_db;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    object VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

4. **Démarrer le serveur**

```bash
# Mode production
npm start

# Mode développement (avec nodemon)
npm run dev
```

Le serveur démarre sur `http://localhost:5000` (ou le PORT défini dans `.env`)

## Endpoints API

### Authentification

| Méthode | Endpoint             | Description              | Auth | Codes         |
| ------- | -------------------- | ------------------------ | ---- | ------------- |
| POST    | `/api/auth/register` | Création de compte       | -    | 201, 400, 409 |
| POST    | `/api/auth/login`    | Connexion (retourne JWT) | -    | 200, 401      |
| GET     | `/api/auth/logout`   | Déconnexion              | JWT  | 200           |

### Utilisateur

| Méthode | Endpoint             | Description         | Auth | Codes         |
| ------- | -------------------- | ------------------- | ---- | ------------- |
| GET     | `/api/users/profile` | Consultation profil | JWT  | 200, 401, 404 |

### Planning et Réservations

| Méthode | Endpoint                             | Description             | Auth | Codes              |
| ------- | ------------------------------------ | ----------------------- | ---- | ------------------ |
| GET     | `/api/planning/week?date=YYYY-MM-DD` | Planning hebdomadaire   | -    | 200, 400           |
| GET     | `/api/planning`                      | Toutes les réservations | -    | 200                |
| POST    | `/api/reservations`                  | Créer réservation       | JWT  | 201, 400, 409      |
| PUT     | `/api/reservations/:id`              | Modifier réservation    | JWT  | 200, 400, 403, 404 |
| DELETE  | `/api/reservations/:id`              | Annuler réservation     | JWT  | 200, 403, 404      |

## Authentification JWT

Les routes protégées nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token_jwt>
```

Le token est obtenu lors de la connexion (`POST /api/auth/login`) et expire après 24h par défaut.

## Exemples de requêtes

### Création de compte

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Doe",
    "prenom": "John",
    "email": "john.doe@example.com",
    "password": "Password123"
  }'
```

### Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123"
  }'
```

Réponse :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nom": "Doe",
    "prenom": "John",
    "email": "john.doe@example.com"
  }
}
```

### Créer une réservation

```bash
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_token>" \
  -d '{
    "date": "2026-02-20",
    "hour": "10:00:00",
    "object": "Réunion planning"
  }'
```

## Sécurité

### Protection contre SQL Injection

✅ Utilisation de prepared statements avec `mysql2`

### Protection contre XSS

✅ Validation et sanitisation des inputs
✅ Content-Type JSON uniquement

### Hachage des mots de passe

✅ Bcrypt avec salt rounds = 10

### JWT Sécurisé

✅ Secret stocké dans les variables d'environnement
✅ Expiration automatique après 24h

### HTTPS

⚠️ À activer en production (recommandé: reverse proxy nginx)

### Logs

✅ Pas de logs de données sensibles (mots de passe, tokens)

## Structure du projet

```
backend/
├── .env                    # Variables d'environnement (non versionné)
├── .env.example           # Exemple de configuration
├── server.js              # Point d'entrée principal
├── package.json           # Dépendances npm
└── README.md              # Documentation
```

## Contribution

Pour contribuer au projet :

1. Créer une branche depuis `main`
2. Faire vos modifications
3. Tester localement
4. Créer une Pull Request

## Licence

Propriétaire - TechSpace Solutions © 2026
