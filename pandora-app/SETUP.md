# PANDORA Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd pandora-app/server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `pandora-app/server/` with the following:

```env
# App Configuration
APP_NAME=PANDORA
APP_VERSION=1.0.0
DEBUG=true
PORT=5000

# Database - UPDATE THIS!
MONGODB_URL=mongodb://localhost:27017/pandora
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/pandora
DB_NAME=pandora

# JWT - CHANGE THIS IN PRODUCTION!
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

**Important**: 
- Update `MONGODB_URL` with your MongoDB connection string
- Change `SECRET_KEY` to a strong random string (at least 32 characters)

### 3. Start Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd pandora-app/client
npm install
```

### 5. Configure Frontend

Create a `.env` file in `pandora-app/client/` (optional):

```env
VITE_API_BASE=http://localhost:5000/api
```

### 6. Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## MongoDB Setup

### Option 1: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/pandora`

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/pandora`
5. Update `MONGODB_URL` in `.env`

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "Admin User",
    "password": "SecurePass123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123"
  }'
```

Save the `accessToken` from the response.

### 3. Create Workspace (Admin Only)

```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Workspace"
  }'
```

### 4. Get Workspaces

```bash
curl -X GET http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## First User Setup

The first user you register will have the `member` role by default. To make them an admin:

1. Connect to MongoDB
2. Update the user document:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Troubleshooting

### Backend won't start
- Check MongoDB connection string is correct
- Ensure MongoDB is running (if using local)
- Check port 5000 is not in use

### CORS errors
- Verify `CORS_ORIGINS` in `.env` includes your frontend URL
- Check frontend is using correct API base URL

### Authentication errors
- Verify JWT `SECRET_KEY` is set
- Check token expiration (15 minutes default)
- Use refresh token to get new access token

### File upload errors
- Ensure `uploads/` directory exists in server folder
- Check file size limits (default 100MB)

## Production Deployment

### Backend
- Set `DEBUG=false`
- Use strong `SECRET_KEY` (generate with: `openssl rand -base64 32`)
- Configure production MongoDB connection
- Set up file storage (S3, etc.) instead of local filesystem
- Enable HTTPS

### Frontend
- Build: `npm run build`
- Deploy to Vercel/Netlify
- Update `VITE_API_BASE` to production API URL

## Security Notes

⚠️ **Important for Production**:
- Change all default secrets
- Use environment variables for sensitive data
- Enable HTTPS
- Configure proper CORS origins
- Set up rate limiting
- Use secure file storage (S3, etc.)
- Enable email OTP (currently prints to console)

## Support

For issues or questions, check the main README.md file.

