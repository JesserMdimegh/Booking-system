# API Endpoints Documentation

## Overview
This document describes all the available API endpoints in the booking system.

## Base URL
`http://localhost:3001`

## Authentication
Most endpoints require authentication via Keycloak JWT tokens. Some endpoints are marked as `@Public()` and don't require authentication.

## Response Format
All endpoints follow a consistent response format:
```json
{
  "message": "Success message",
  "data": { ... }
}
```

## Endpoints

### Clients Controller (`/clients`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/clients` | Create a new client | No |
| GET | `/clients` | Get all clients | No |
| GET | `/clients/:id` | Get client by ID | No |
| GET | `/clients/email/:email` | Get client by email | No |
| GET | `/clients/:id/appointments` | Get all appointments for a client | No |
| PUT | `/clients/:id` | Update client information | No |
| DELETE | `/clients/:id` | Delete a client | No |

**Request/Response Examples:**

Create Client:
```json
POST /clients
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "address": "123 Main St"
}
```

### Providers Controller (`/providers`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/providers` | Create a new provider | No |
| GET | `/providers` | Get all providers | No |
| GET | `/providers/:id` | Get provider by ID | No |
| GET | `/providers/service/:service` | Get providers by service type | No |
| GET | `/providers/email/:email` | Get provider by email | No |
| GET | `/providers/:id/appointments` | Get all appointments for a provider | No |
| GET | `/providers/:id/slots` | Get all slots for a provider | No |
| PUT | `/providers/:id` | Update provider information | No |
| DELETE | `/providers/:id` | Delete a provider | No |

**Request/Response Examples:**

Create Provider:
```json
POST /providers
{
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "services": ["consultation", "checkup"]
}
```

### Slots Controller (`/slots`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/slots` | Create a new slot | No |
| GET | `/slots/:id` | Get slot by ID | No |
| GET | `/slots/provider/:providerId` | Get all slots for a provider | No |
| GET | `/slots/provider/:providerId/date` | Get slots for provider on specific date | No |
| GET | `/slots/available/:providerId` | Get available slots for provider | No |
| GET | `/slots/available/:providerId?date=YYYY-MM-DD` | Get available slots for provider on specific date | No |
| PUT | `/slots/:id` | Update slot information | No |
| DELETE | `/slots/:id` | Delete a slot | No |

**Request/Response Examples:**

Create Slot:
```json
POST /slots
{
  "providerId": "provider-uuid",
  "date": "2024-01-15",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T10:00:00Z"
}
```

Update Slot:
```json
PUT /slots/:id
{
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}
```

### Appointments Controller (`/appointments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/appointments` | Create a new appointment | Yes |
| GET | `/appointments` | Get all appointments | Yes |
| GET | `/appointments/:id` | Get appointment by ID | Yes |
| GET | `/appointments/client/:clientId` | Get appointments for a client | Yes |
| GET | `/appointments/provider/:providerId` | Get appointments for a provider | Yes |
| GET | `/appointments/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Get appointments in date range | Yes |
| DELETE | `/appointments/:id` | Cancel an appointment | Yes |

**Request/Response Examples:**

Create Appointment:
```json
POST /appointments
{
  "clientId": "client-uuid",
  "slotId": "slot-uuid"
}
```

Cancel Appointment:
```json
DELETE /appointments/:id
{
  "clientId": "client-uuid"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```json
{
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 404
}
```

Common error codes:
- 400: Bad Request (validation errors)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (resource already exists)
- 500: Internal Server Error

## Use Cases Implementation

The following use cases have been implemented:

### Client Use Cases
- `CreateClientUseCase`: Creates new clients with validation
- `GetClientsUseCase`: Retrieves clients with various filters (ID, email, all)
- `UpdateClientUseCase`: Updates client information and deletes clients

### Provider Use Cases  
- `CreateProviderUseCase`: Creates new providers with conflict detection
- `GetProvidersUseCase`: Retrieves providers with various filters (ID, email, service, all)
- `UpdateProviderUseCase`: Updates provider information and deletes providers

### Slot Use Cases
- `CreateSlotUseCase`: Creates new slots with overlap validation
- `GetSlotsUseCase`: Retrieves slots with various filters and availability checks

### Appointment Use Cases
- `CreateAppointmentUseCase`: Creates appointments with slot availability validation
- `CancelAppointmentUseCase`: Cancels appointments
- `ListAppointmentsUseCase`: Lists appointments with various filters (client, provider, date range)

## DTOs (Data Transfer Objects)

The following DTOs are used for request validation:

- `CreateClientDto`, `UpdateClientDto`
- `CreateProviderDto`, `UpdateProviderDto`  
- `CreateSlotDto`, `UpdateSlotDto`
- `CreateAppointmentDto`

## Repository Pattern

All data access is handled through repository interfaces:
- `IClientRepository`
- `IProviderRepository`
- `ISlotRepository`
- `IAppointmentRepository`

Each repository is implemented using Prisma ORM for database operations.
