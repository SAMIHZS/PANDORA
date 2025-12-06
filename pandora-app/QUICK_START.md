# Quick Start - GitHub Setup

## 🚀 Get Your Code on GitHub in 3 Steps

### Step 1: Initialize Git (if not already done)

```bash
cd pandora-app
git init
git add .
git commit -m "Initial commit: PANDORA secure collaboration platform"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `pandora` (or your preferred name)
3. Description: "Secure team collaboration platform with E2EE"
4. Choose Public or Private
5. **Don't** check "Initialize with README" (we already have one)
6. Click "Create repository"

### Step 3: Connect and Push

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/pandora.git
git branch -M main
git push -u origin main
```

**Done!** Your code is now on GitHub! 🎉

## 📋 Next Steps

### For Local Development:
1. Follow `SETUP.md` to configure `.env` files
2. Start backend: `cd server && npm run dev`
3. Start frontend: `cd client && npm run dev`

### For Deployment:
1. Follow `GITHUB_DEPLOYMENT.md` for full deployment guide
2. Set up GitHub Secrets for automated deployments
3. Choose hosting platform (Vercel + Railway recommended)

## 🔐 Important: Don't Commit Secrets!

The `.gitignore` file is already configured to exclude:
- `.env` files
- `node_modules/`
- `uploads/` directory
- Build outputs

**Never commit:**
- MongoDB connection strings
- JWT secret keys
- API keys
- Passwords

## 📚 Documentation

- `README.md` - Project overview
- `SETUP.md` - Local development setup
- `TESTING.md` - API testing guide
- `GITHUB_DEPLOYMENT.md` - Deployment instructions

## 🆘 Need Help?

Check the documentation files or open an issue on GitHub!

