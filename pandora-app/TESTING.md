# PANDORA API Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. MongoDB connected and running
3. `.env` file configured in `server/` directory

## Test Scripts

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "test@example.com",
  "name": "Test User"
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "userId": "...",
  "email": "test@example.com",
  "name": "Test User",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "trustScore": 60
}
```

**Save the `accessToken` for subsequent requests!**

### 3. Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create Workspace (Admin Only)

**Note:** First user needs to be manually set as admin in MongoDB:
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "admin" } }
)
```

```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Test Workspace"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "name": "My Test Workspace",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Get Workspaces

```bash
curl -X GET http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Get Workspace Encryption Key

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/key \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "encryptionKey": "base64-encoded-key"
}
```

### 7. Generate Join Invite

```bash
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/invites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "joinUrl": "http://localhost:5173/join/TOKEN",
  "token": "TOKEN",
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

### 8. Send Message (E2EE)

**Note:** Message should be encrypted on client side before sending. For testing, you can send encrypted content directly.

```bash
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "content": "encrypted-ciphertext-base64",
    "nonce": "encrypted-nonce-base64"
  }'
```

### 9. Get Messages

```bash
curl -X GET "http://localhost:5000/api/workspaces/WORKSPACE_ID/messages?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 10. Upload File

```bash
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "sensitivityLevel=internal"
```

### 11. Get Files

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 12. Download File

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/files/FILE_ID/download \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o downloaded_file.pdf
```

### 13. Request MFA OTP

```bash
curl -X POST http://localhost:5000/api/mfa/challenge \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note:** OTP will be printed to server console (check backend logs)

### 14. Verify MFA OTP

```bash
curl -X POST http://localhost:5000/api/mfa/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "123456",
    "workspaceId": "WORKSPACE_ID"
  }'
```

### 15. Get Audit Logs

```bash
curl -X GET "http://localhost:5000/api/audit?workspaceId=WORKSPACE_ID&limit=100" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 16. Refresh Access Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Testing Workflow

1. **Register** → Get user ID
2. **Set user as admin** (in MongoDB)
3. **Login** → Get access token
4. **Create workspace** → Get workspace ID
5. **Get workspace key** → For client-side encryption
6. **Generate invite** → Share with other users
7. **Send messages** → Test E2EE messaging
8. **Upload files** → Test encrypted file storage
9. **Test MFA** → Request and verify OTP
10. **Check audit logs** → Verify all actions are logged

## Common Issues

### 401 Unauthorized
- Token expired (15 minutes) - use refresh token
- Invalid token format - check "Bearer " prefix
- Token not in Authorization header

### 403 Forbidden
- User doesn't have required role (admin)
- User not member of workspace
- Access level blocked (low trust score)

### 400 Bad Request
- Missing required fields
- Invalid data format
- File too large (max 100MB)

### 500 Internal Server Error
- Check server logs
- Verify MongoDB connection
- Check file permissions for uploads directory

## Postman Collection

You can import these endpoints into Postman for easier testing:

1. Create new collection: "PANDORA API"
2. Add environment variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `accessToken`: (set after login)
   - `workspaceId`: (set after creating workspace)
3. Set collection authorization: Bearer Token using `{{accessToken}}`

## Automated Testing

For automated testing, consider using:
- **Jest** + **Supertest** for backend tests
- **Cypress** or **Playwright** for E2E tests
- **Postman** Newman for API testing

