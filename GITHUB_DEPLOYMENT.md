# 🚀 GitHub Deployment Guide

Complete guide for deploying VoterNet to GitHub with GitHub Pages (frontend) + VPS (backend).

## 📋 Quick Checklist

Before pushing to GitHub, ensure:

- [ ] All unwanted deployment files removed ✅
- [ ] `.env.development` is in `.gitignore` ✅
- [ ] `public/config.js` created with API URL configuration ✅
- [ ] All HTML files updated to use `config.js` ✅
- [ ] `.nojekyll` file created for GitHub Pages ✅
- [ ] README.md updated with deployment instructions ✅

## 🔧 Step 1: Configure VPS URL

Before pushing, you need to update the VPS URL in `public/config.js`:

```javascript
const CONFIG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    API_URLS: {
        local: 'http://localhost:3000',
        production: 'https://YOUR-VPS-DOMAIN.com' // ← CHANGE THIS
    }
};
```

**Replace `YOUR-VPS-DOMAIN.com` with:**
- Your actual VPS domain (e.g., `voternet.example.com`)
- Or your VPS IP temporarily (e.g., `http://123.45.67.89:3000`)

## 📦 Step 2: Initialize Git (if not done)

```bash
cd D:\WEBTECH\VoterNet

# Check if git is initialized
git status

# If not initialized, run:
git init
```

## 🔍 Step 3: Review Files to Commit

```bash
# See what will be committed
git status

# Review .gitignore to ensure sensitive files are excluded
cat .gitignore
```

**Files that SHOULD be committed:**
- ✅ `public/` folder (all HTML, CSS, JS)
- ✅ `src/` folder (all TypeScript source code)
- ✅ `tests/` folder
- ✅ `package.json`, `tsconfig.json`, `jest.config.js`
- ✅ `.env.example` (template without secrets)
- ✅ `.gitignore`, `.eslintrc.json`
- ✅ `README.md` and other documentation
- ✅ `.nojekyll` (for GitHub Pages)

**Files that should NOT be committed (in .gitignore):**
- ❌ `node_modules/`
- ❌ `.env.development`, `.env.production`
- ❌ `dist/` (build output)
- ❌ `*.log` files
- ❌ Deployment scripts (`.ps1`, `.sh` files)

## ➕ Step 4: Add Files to Git

```bash
# Add all files (respects .gitignore)
git add .

# Verify what's staged
git status
```

## 💬 Step 5: Commit Changes

```bash
git commit -m "Initial commit: VoterNet secure voting platform

- Complete authentication system with JWT
- Election management and voting functionality
- Admin dashboard and user interface
- Configured for dual deployment (GitHub Pages + VPS)
- PostgreSQL database with TypeORM
- Redis session management
- Comprehensive API endpoints
"
```

## 🔗 Step 6: Connect to GitHub Repository

Your repository: `https://github.com/jkmuthu/voternet`

```bash
# Add remote (if not already added)
git remote add origin https://github.com/jkmuthu/voternet.git

# Verify remote
git remote -v
```

## 🚀 Step 7: Push to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If prompted for credentials:
- **Username**: Your GitHub username (`jkmuthu`)
- **Password**: Use a **Personal Access Token** (not your password)

### 🔑 Creating GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `VoterNet Deployment`
4. Select scopes:
   - ☑️ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

## 🌐 Step 8: Enable GitHub Pages

1. Go to: https://github.com/jkmuthu/voternet
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**:
   - Branch: `main`
   - Folder: `/ (root)` or `/public` (if available)
4. Click **Save**
5. Wait 2-3 minutes for deployment

**Your GitHub Pages URL**: https://jkmuthu.github.io/voternet/

### 📁 Accessing Pages

Since your HTML files are in the `public/` folder:
- Landing: https://jkmuthu.github.io/voternet/public/
- Or: https://jkmuthu.github.io/voternet/public/index.html

**Optional**: Move HTML files to root for cleaner URLs (see Step 9)

## 📂 Step 9: (Optional) Clean URLs for GitHub Pages

To get URLs like `https://jkmuthu.github.io/voternet/` instead of `/public/`:

### Option A: Move public files to root

```bash
# Move all files from public/ to root
mv public/*.html .
mv public/*.js .
mv public/*.css . 2>$null  # If you have CSS files

# Update src paths in HTML files if needed

# Commit changes
git add .
git commit -m "Restructure for GitHub Pages clean URLs"
git push
```

### Option B: Use docs/ folder (GitHub Pages supports this)

```bash
# Rename public to docs
mv public docs

# Update config paths if needed

# Commit and push
git add .
git commit -m "Move frontend to docs/ for GitHub Pages"
git push

# Then in GitHub Settings → Pages:
# Change folder from / to /docs
```

**Recommended**: Keep files in `public/` folder and update HTML paths if needed.

## 🔧 Step 10: Test GitHub Pages

After deployment (wait 2-3 minutes):

1. Visit: https://jkmuthu.github.io/voternet/public/
2. Open browser DevTools (F12) → Console
3. Check for messages:
   ```
   VoterNet Environment: Production
   API URL: https://your-vps-domain.com
   ```
4. Try clicking around (it won't work yet without VPS backend)

## 🖥️ Step 11: VPS Backend Deployment

Now that frontend is on GitHub Pages, deploy the backend to VPS.

See main **README.md** for complete VPS setup instructions.

### Quick VPS Setup Summary

```bash
# On your VPS
cd /var/www
git clone https://github.com/jkmuthu/voternet.git
cd voternet

# Install and configure
npm install
cp .env.example .env.production
# Edit .env.production with database credentials

# Build and run
npm run build
NODE_ENV=production npm run db:migrate
pm2 start dist/main.js --name voternet
```

## 🔄 Step 12: Update Production API URL

After VPS deployment, update `public/config.js` with your actual VPS URL:

```javascript
API_URLS: {
    local: 'http://localhost:3000',
    production: 'https://voternet.yourdomain.com' // ← Real VPS URL
}
```

```bash
# Commit and push the change
git add public/config.js
git commit -m "Update production API URL"
git push
```

GitHub Pages will auto-update in 1-2 minutes.

## 🎯 Step 13: Test Complete System

1. **GitHub Pages Frontend**: https://jkmuthu.github.io/voternet/public/
2. **VPS Backend API**: https://your-vps-domain.com/health

Try:
- Register new account
- Login
- View elections
- Admin dashboard (with admin credentials)

## 🔒 Step 14: Enable CORS on VPS

Update VPS `.env.production` to allow GitHub Pages:

```env
CORS_ORIGIN=https://jkmuthu.github.io
```

Restart VPS application:
```bash
pm2 restart voternet
```

## 📱 Future Updates

To push changes:

```bash
# Make your code changes
git add .
git commit -m "Description of changes"
git push

# GitHub Pages auto-updates in 1-2 minutes
# VPS needs manual pull and restart:
ssh your-vps
cd /var/www/voternet
git pull
npm run build
pm2 restart voternet
```

## ⚠️ Troubleshooting

### Push Rejected (Authentication Failed)
- Use Personal Access Token, not password
- Token needs `repo` scope

### GitHub Pages Not Working
- Check Settings → Pages is enabled
- Wait 2-3 minutes after push
- Check repository is public (or GitHub Pro for private + Pages)

### API Calls Failing from GitHub Pages
- Check CORS configuration on VPS
- Verify API URL in `config.js` is correct
- Check browser console for CORS errors

### VPS Connection Refused
- Ensure backend is running (`pm2 status`)
- Check firewall allows port 80/443
- Verify Nginx is configured properly

---

## ✅ Deployment Complete!

You now have:
- ✅ Frontend hosted on GitHub Pages (free)
- ✅ Backend on VPS (full control)
- ✅ Version control with Git
- ✅ Easy updates via git push
- ✅ Professional deployment setup

Next steps:
- Add custom domain to GitHub Pages
- Setup SSL on VPS with Let's Encrypt
- Configure email notifications
- Add monitoring and analytics
