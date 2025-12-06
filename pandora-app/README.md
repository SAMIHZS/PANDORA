# PANDORA: Secure Team Collaboration Platform

A secure team collaboration web application with end-to-end encrypted messaging, secure file sharing, granular access controls, and an adaptive security system (DTSS - Dynamic Trust Score System).

## 🚀 Features

- **End-to-End Encryption**: All messages and files are encrypted using TweetNaCl and AES-256-GCM
- **Dynamic Trust Score System (DTSS)**: Adaptive security that adjusts user access based on behavior
- **Short-Lived Access Tokens**: 15-minute JWT tokens with refresh token support
- **Adaptive MFA**: Email OTP-based multi-factor authentication triggered by trust score
- **Workspace Management**: Admin-created workspaces with one-time join links
- **Role-Based Access Control**: Owner, Editor, Viewer roles with view-only mode
- **Comprehensive Audit Logs**: Immutable audit trail of all user actions
- **File Versioning**: Track and manage file versions with encrypted storage

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- TypeScript 5+

## 🛠️ Installation

### Backend Setup

1. Navigate to the server directory:
```bash
cd pandora-app/server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
# App Configuration
APP_NAME=PANDORA
APP_VERSION=1.0.0
DEBUG=true
PORT=5000

# Database
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/pandora
DB_NAME=pandora

# JWT
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Email/MFA
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@pandora.app

# DTSS Configuration
DTSS_INIT_SCORE=60
DTSS_THRESHOLD_FULL=70
DTSS_THRESHOLD_MEDIUM=40
DTSS_THRESHOLD_LOW=0
DTSS_NEW_COUNTRY_LOSS=15
DTSS_FAILED_LOGIN_LOSS=5
DTSS_MFA_SUCCESS_GAIN=10
DTSS_ADMIN_APPROVAL_GAIN=20
DTSS_CLEAN_WEEK_GAIN=5

# MFA
MFA_OTP_EXPIRE_MINUTES=10
MFA_OTP_LENGTH=6

# Join Invites
JOIN_INVITE_EXPIRE_HOURS=24

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=100

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

4. Build the TypeScript code:
```bash
npm run build
```

5. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd pandora-app/client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📁 Project Structure

```
pandora-app/
├── server/                 # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config.ts      # Configuration settings
│   │   ├── database.ts     # MongoDB connection
│   │   ├── main.ts        # Express app entry point
│   │   ├── crypto/        # Security utilities
│   │   │   ├── encryption.ts
│   │   │   ├── hashing.ts
│   │   │   └── jwt.ts
│   │   ├── services/       # Business logic
│   │   │   ├── AuthService.ts
│   │   │   ├── WorkspaceService.ts
│   │   │   ├── DTSSService.ts
│   │   │   ├── MFAService.ts
│   │   │   ├── MessageService.ts
│   │   │   ├── FileService.ts
│   │   │   └── AuditService.ts
│   │   ├── routes/         # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── messages.ts
│   │   │   ├── files.ts
│   │   │   ├── mfa.ts
│   │   │   └── audit.ts
│   │   └── middleware/     # Express middleware
│   │       ├── auth.ts
│   │       └── errorHandler.ts
│   └── uploads/            # Encrypted file storage
│
└── client/                 # Frontend (React + TypeScript + Vite)
    ├── src/
    │   ├── pages/          # Page components
    │   ├── components/     # Reusable components
    │   ├── services/       # API clients
    │   └── context/        # React Context
```

## 🔐 Security Features

### Encryption
- **Messages**: Encrypted using TweetNaCl (XSalsa20-Poly1305) with workspace-specific keys
- **Files**: Encrypted using AES-256-GCM before storage
- **Passwords**: Hashed using Argon2id

### Dynamic Trust Score System (DTSS)
- Initial trust score: 60
- Full access: ≥70
- View-only + MFA: 40-69
- Blocked: <40

Trust score changes based on:
- ✅ Successful MFA (+10)
- ✅ Admin approval (+20)
- ❌ Failed login (-5)
- ❌ New device/country (-15)

### Access Control
- **Short-lived tokens**: 15-minute access tokens
- **Refresh tokens**: 7-day refresh tokens
- **Adaptive MFA**: Triggered based on trust score
- **Role-based access**: Owner, Editor, Viewer
- **View-only mode**: Automatic downgrade for low trust scores

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/me` - Get current user info

### Workspaces
- `POST /api/workspaces` - Create workspace (admin only)
- `GET /api/workspaces` - Get user's workspaces
- `GET /api/workspaces/:id` - Get workspace details
- `GET /api/workspaces/:id/key` - Get workspace encryption key
- `POST /api/workspaces/:id/invites` - Generate join invite
- `POST /api/workspaces/join/:token` - Join workspace via invite
- `GET /api/workspaces/:id/pending` - Get pending members
- `POST /api/workspaces/:id/members/:userId/approve` - Approve member

### Messages
- `POST /api/workspaces/:workspaceId/messages` - Send encrypted message
- `GET /api/workspaces/:workspaceId/messages` - Get workspace messages
- `DELETE /api/workspaces/:workspaceId/messages/:messageId` - Delete message

### Files
- `POST /api/workspaces/:workspaceId/files` - Upload file
- `GET /api/workspaces/:workspaceId/files` - Get workspace files
- `GET /api/workspaces/:workspaceId/files/:fileId/download` - Download file
- `GET /api/workspaces/:workspaceId/files/:fileId/versions` - Get file versions
- `DELETE /api/workspaces/:workspaceId/files/:fileId` - Delete file

### MFA
- `POST /api/mfa/challenge` - Request OTP
- `POST /api/mfa/verify` - Verify OTP

### Audit
- `GET /api/audit` - Get audit logs (admin only)
- `GET /api/audit/workspace/:workspaceId` - Get workspace audit logs

## 🧪 Testing

### Manual Testing

1. **Register a user**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"SecurePass123"}'
```

2. **Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

3. **Create workspace** (use access token from login):
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"My Workspace"}'
```

## 🚢 Deployment

### GitHub Setup

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/pandora.git
   git push -u origin main
   ```

2. **See `GITHUB_DEPLOYMENT.md` for complete deployment guide**

### Recommended: Vercel (Frontend) + Railway (Backend)

- **Backend**: Deploy to Railway or Render
- **Frontend**: Deploy to Vercel or Netlify
- **Database**: Use MongoDB Atlas (free tier available)
- **File Storage**: Use S3 or similar for production

### Quick Deploy

1. **Backend on Railway:**
   - Connect GitHub repo
   - Set environment variables
   - Auto-deploys on push

2. **Frontend on Vercel:**
   - Import GitHub repo
   - Set root directory to `client`
   - Add `VITE_API_BASE` environment variable
   - Deploy!

See `GITHUB_DEPLOYMENT.md` for detailed instructions.

## 📝 Notes

- **Demo-level E2EE**: The encryption implementation is for demonstration purposes and has not been security audited
- **MFA OTP**: For hackathon/demo, OTPs are printed to console. Uncomment email sending in `MFAService.ts` for production
- **File Storage**: Uses local filesystem for demo. Switch to S3 or similar for production

## 🤝 Contributing

This is a hackathon project. For production use, consider:
- Security audit of encryption implementation
- Rate limiting
- Input validation and sanitization
- Comprehensive error handling
- Unit and integration tests
- CI/CD pipeline

## 📄 License

MIT

## 🙏 Acknowledgments

Built for hackathon demonstration. Inspired by secure collaboration platforms like Signal, Keybase, and Matrix.

