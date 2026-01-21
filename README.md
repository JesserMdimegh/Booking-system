# Système de Réservation de Rendez-vous

## Description du projet

Ce projet est une API backend pour un système de réservation de rendez-vous développé avec **NestJS**, **TypeScript**, **Prisma** et **PostgreSQL**. Le système permet aux clients de réserver des rendez-vous avec des prestataires de services via une interface d'authentification Keycloak.

### Fonctionnalités principales
- **Gestion des utilisateurs** (Clients, Prestataires, Administrateurs)
- **Authentification et autorisation** via Keycloak avec JWT
- **Création et gestion des créneaux horaires** par les prestataires
- **Réservation de rendez-vous** par les clients
- **Architecture hexagonale** avec séparation des responsabilités

## Stack technique

- **Backend**: NestJS avec TypeScript
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: Keycloak (OAuth2/OIDC)
- **Architecture**: Clean Architecture / Hexagonal
- **Validation**: class-validator et class-transformer

## Setup et configuration

### Prérequis
- Node.js (v18+)
- PostgreSQL
- Keycloak server
- npm ou yarn

### Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd "Booking System/backend"
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créer un fichier `.env` à la racine du projet:
   ```env
   # Base de données
   DATABASE_URL="postgresql://username:password@localhost:5432/booking_db"
   
   # Keycloak
   KEYCLOAK_URL="http://localhost:8080"
   KEYCLOAK_REALM="your-realm"
   KEYCLOAK_ADMIN_CLIENT_ID="admin-cli"
   KEYCLOAK_ADMIN_CLIENT_SECRET="your-secret"
   ```

4. **Configurer la base de données**
   ```bash
   # Générer le client Prisma
   npx prisma generate
   
   # Lancer les migrations
   npx prisma migrate dev --name init
   ```

5. **Démarrer l'application**
   ```bash
   # Mode développement
   npm run start:dev
   
   # Mode production
   npm run build
   npm run start:prod
   ```

## Les endpoints

### Authentification
Tous les endpoints protégés nécessitent un token JWT valide dans l'en-tête `Authorization: Bearer <token>`.

### Clients
- `POST /clients` - Créer un client (publique)
- `GET /clients` - Lister tous les clients
- `GET /clients/:id` - Obtenir un client par ID
- `PUT /clients/:id` - Mettre à jour un client

### Prestataires (Providers)
- `POST /providers` - Créer un prestataire (publique)
- `GET /providers` - Lister tous les prestataires (publique)
- `GET /providers/:id` - Obtenir un prestataire par ID
- `PUT /providers/:id` - Mettre à jour un prestataire

### Créneaux horaires (Slots)
- `POST /slots` - Créer un créneau horaire
- `GET /slots/provider/:providerId` - Lister les créneaux d'un prestataire
- `GET /slots/:id` - Obtenir un créneau par ID
- `DELETE /slots/:id` - Supprimer un créneau

### Rendez-vous (Appointments)
- `POST /appointments` - Créer un rendez-vous
- `GET /appointments` - Lister tous les rendez-vous
- `GET /appointments/client/:clientId` - Lister les rendez-vous d'un client
- `DELETE /appointments/:id` - Annuler un rendez-vous

### Exemples de requêtes

#### Créer un client
```bash
POST /clients
Content-Type: application/json

{
  "email": "client@example.com",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "address": "123 Main St"
}
```

#### Créer un prestataire
```bash
POST /providers
Content-Type: application/json

{
  "email": "provider@example.com",
  "name": "Jane Smith",
  "services": ["Haircut", "Massage", "Consultation"]
}
```

#### Créer un créneau horaire
```bash
POST /slots
Content-Type: application/json
Authorization: Bearer <provider-token>

{
  "providerId": "provider-uuid",
  "date": "2024-01-15T10:00:00Z",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}
```

#### Réserver un rendez-vous
```bash
POST /appointments
Content-Type: application/json
Authorization: Bearer <client-token>

{
  "clientId": "client-uuid",
  "slotId": "slot-uuid"
}
```

## Architecture du projet

```
src/
├── application/           # Cas d'usage et DTOs
│   ├── uses-cases/       # Logique métier
│   └── dto/              # Objets de transfert
├── domain/               # Entités et interfaces
│   ├── entities/         # Entités du domaine
│   └── repositories/     # Interfaces des repositories
├── infrastructure/       # Implémentations techniques
│   ├── auth/             # Authentification Keycloak
│   ├── database/         # Services Prisma
│   └── repositories/     # Implémentations Prisma
├── presentation/         # Controllers et endpoints
│   └── controller/       # API REST
├── modules/              # Modules NestJS
└── shared/               # Infrastructure partagée
```

## Les tests

### Structure des tests
Le projet utilise **Jest** pour les tests unitaires et d'intégration.

### Commandes de test
```bash
# Lancer tous les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch

# Générer un rapport de couverture
npm run test:cov

# Lancer les tests e2e
npm run test:e2e
```

### Types de tests
- **Tests unitaires**: Cas d'usage et logique métier
- **Tests d'intégration**: Controllers et repositories
- **Tests e2e**: Flux complets de l'application

### Écrire des tests
Les fichiers de test doivent suivre la convention `*.spec.ts` et être placés à côté des fichiers qu'ils testent.

Exemple de test unitaire :
```typescript
// create-client.use-case.spec.ts
import { Test } from '@nestjs/testing';
import { CreateClientUseCase } from './create-client.use-case';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CreateClientUseCase],
    }).compile();

    useCase = module.get<CreateClientUseCase>(CreateClientUseCase);
  });

  it('should create a client', async () => {
    // Test implementation
  });
});
```

## Déploiement

### Variables d'environnement de production
- `DATABASE_URL`: Chaîne de connexion PostgreSQL
- `KEYCLOAK_URL`: URL du serveur Keycloak
- `KEYCLOAK_REALM`: Realm Keycloak
- `KEYCLOAK_ADMIN_CLIENT_ID`: Client ID admin
- `KEYCLOAK_ADMIN_CLIENT_SECRET`: Secret client admin

### Build de production
```bash
npm run build
npm run start:prod
```

### Docker (optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/main"]
```

## Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence UNLICENSED.

