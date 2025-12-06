# GitHub Deployment Guide for PANDORA

This guide will help you deploy PANDORA to GitHub and set up automated deployments.

## 📦 Repository Setup

### 1. Initialize Git Repository

```bash
cd pandora-app
git init
git add .
git commit -m "Initial commit: PANDORA secure collaboration platform"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `pandora` or `pandora-webapp`
3. **Don't** initialize with README (we already have one)
4. Copy the repository URL

### 3. Connect and Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/pandora.git
git branch -M main
git push -u origin main
```

## 🔐 GitHub Secrets Setup

For automated deployments, you'll need to set up secrets in your GitHub repository:

### Go to: Repository → Settings → Secrets and variables → Actions

### Backend Secrets (for Railway/Render deployment):

1. **RAILWAY_TOKEN** (if using Railway)
   - Get from: Railway Dashboard → Settings → Tokens
   
2. **RENDER_API_KEY** (if using Render)
   - Get from: Render Dashboard → Account Settings → API Keys

3. **MONGODB_URL** (for production)
   - Your MongoDB Atlas connection string

### Frontend Secrets (for Vercel/Netlify):

1. **VITE_API_BASE**
   - Your production backend API URL (e.g., `https://pandora-api.railway.app/api`)

2. **VERCEL_TOKEN** (if using Vercel)
   - Get from: Vercel Dashboard → Settings → Tokens

3. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**
   - Get from: Vercel project settings

4. **NETLIFY_AUTH_TOKEN** and **NETLIFY_SITE_ID** (if using Netlify)
   - Get from: Netlify Dashboard

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Backend on Railway:

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Select your repository
4. Add environment variables:
   ```
   MONGODB_URL=your-mongodb-atlas-url
   SECRET_KEY=your-production-secret-key
   PORT=5000
   NODE_ENV=production
   ```
5. Railway will auto-deploy on push to main

#### Frontend on Vercel:

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `client`
4. Add environment variable:
   ```
   VITE_API_BASE=https://your-railway-backend.railway.app/api
   ```
5. Deploy!

### Option 2: Netlify (Frontend) + Render (Backend)

#### Backend on Render:

1. Go to [Render](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables (same as Railway)

#### Frontend on Netlify:

1. Go to [Netlify](https://netlify.com)
2. Add new site → Import from Git
3. Select repository
4. Settings:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
5. Add environment variable:
   ```
   VITE_API_BASE=https://your-render-backend.onrender.com/api
   ```

### Option 3: GitHub Pages (Frontend Only)

**Note:** GitHub Pages only hosts static sites. You'll still need a backend elsewhere.

1. Update `.github/workflows/deploy-frontend.yml`:
   ```yaml
   - name: Deploy to GitHub Pages
     uses: peaceiris/actions-gh-pages@v3
     with:
       github_token: ${{ secrets.GITHUB_TOKEN }}
       publish_dir: ./client/dist
   ```

2. Enable GitHub Pages:
   - Repository → Settings → Pages
   - Source: GitHub Actions

## 🔄 Automated Deployment

Once set up, deployments happen automatically:

- **Push to `main` branch** → Triggers deployment
- **CI runs** → Tests and builds
- **Deploy workflows** → Deploy to production

## 📝 Manual Deployment Steps

If you prefer manual deployment:

### Backend:

```bash
cd server
npm install
npm run build
# Deploy dist/ folder to your hosting service
```

### Frontend:

```bash
cd client
npm install
npm run build
# Deploy dist/ folder to your hosting service
```

## 🌐 Domain Setup

### Custom Domain (Optional):

1. **Backend:**
   - Railway/Render: Add custom domain in dashboard
   - Update DNS: Point to provided CNAME

2. **Frontend:**
   - Vercel/Netlify: Add custom domain in dashboard
   - Update DNS: Point to provided CNAME
   - Update `VITE_API_BASE` to use custom domain

## 🔍 Monitoring

### Check Deployment Status:

1. GitHub Actions tab → View workflow runs
2. Check deployment service dashboards
3. Monitor logs for errors

### Health Checks:

- Backend: `https://your-backend.com/health`
- Frontend: Should load without errors

## 🐛 Troubleshooting

### Build Failures:

- Check GitHub Actions logs
- Verify all environment variables are set
- Ensure dependencies are in `package.json`

### Deployment Failures:

- Verify secrets are correctly set
- Check service-specific logs
- Ensure build outputs are correct

### CORS Errors:

- Update `CORS_ORIGINS` in backend `.env`
- Include your frontend domain

### API Connection Issues:

- Verify `VITE_API_BASE` matches backend URL
- Check backend is running
- Verify CORS settings

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## ✅ Deployment Checklist

- [ ] Repository created and pushed to GitHub
- [ ] GitHub Secrets configured
- [ ] Backend deployed (Railway/Render)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Environment variables set
- [ ] CORS origins updated
- [ ] MongoDB Atlas configured
- [ ] Custom domain (optional)
- [ ] Health checks passing
- [ ] Test login/registration
- [ ] Test workspace creation
- [ ] Monitor logs for errors

## 🎉 Success!

Once deployed, your PANDORA app will be live at:
- Frontend: `https://your-app.vercel.app` (or your domain)
- Backend: `https://your-api.railway.app` (or your domain)

Share the frontend URL with users to start collaborating securely!

