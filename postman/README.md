# Law Funnel Server API - Postman Collection

This directory contains Postman collection and environment files for testing the Law Funnel Server API.

## Files

- `Law-Funnel-Server-API.postman_collection.json` - Main API collection
- `Law-Funnel-Development.postman_environment.json` - Development environment variables

## Setup Instructions

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `Law-Funnel-Server-API.postman_collection.json`
4. Click "Import"

### 2. Import Environment

1. In Postman, click the gear icon (⚙️) in the top right
2. Click "Import"
3. Select `Law-Funnel-Development.postman_environment.json`
4. Click "Import"

### 3. Set Environment

1. In the top right dropdown, select "Law Funnel Development"
2. Verify the `baseUrl` is set to `http://localhost:5000`

## Usage Guide

### Testing Authentication Flow

1. **Start your server** first:

   ```bash
   npm run dev
   ```

2. **Test Health Check** - Verify server is running
3. **Register a new user** - Use the "User Registration" request
4. **Login** - Use the "User Login" request
   - The JWT token will be automatically saved to the environment
5. **Access protected endpoints** - Use "Get User Profile" or "Update User Profile"

### API Endpoints

| Method | Endpoint             | Description         | Auth Required |
| ------ | -------------------- | ------------------- | ------------- |
| GET    | `/health`            | Health check        | No            |
| GET    | `/api`               | API information     | No            |
| POST   | `/api/auth/register` | Register new user   | No            |
| POST   | `/api/auth/login`    | User login          | No            |
| GET    | `/api/auth/profile`  | Get user profile    | Yes           |
| PUT    | `/api/auth/profile`  | Update user profile | Yes           |

### Sample Data

#### Registration

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Login

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Profile Update

```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Environment Variables

The collection uses these variables:

- `baseUrl` - Server base URL (default: http://localhost:5000)
- `authToken` - JWT token (automatically set after login)

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Make sure the server is running on port 5000
   - Check if MongoDB is running

2. **Authentication errors**
   - Ensure you've logged in first
   - Check that the token is saved in the environment

3. **Validation errors**
   - Verify the request body format matches the examples
   - Check password requirements are met

### Response Format

All responses follow this format:

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error:**

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing Workflow

1. **Health Check** → Verify server status
2. **User Registration** → Create test account
3. **User Login** → Get authentication token
4. **Get Profile** → Test protected endpoint
5. **Update Profile** → Test data modification

The login request automatically saves the JWT token, so you don't need to copy/paste it manually for subsequent requests.
