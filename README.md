# 🗳️ VoterNet - Secure Online Voting Platform

A comprehensive civic engagement platform with secure authentication, election management, and real-time voting capabilities.

## 🏗️ Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (vanilla, no frameworks)
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL 15+ with TypeORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Session Management**: Redis (with in-memory fallback)
- **Deployment**: Dual strategy (GitHub Pages + VPS)

## 🚀 Deployment Strategy

This project supports **dual deployment**:

### 1️⃣ GitHub Pages (Frontend Only)
- Static HTML files hosted on GitHub Pages
- Perfect for testing UI/UX
- Connects to VPS backend API
- **URL**: `https://yourusername.github.io/voternet/`

### 2️⃣ VPS (Full Stack)
- Complete backend API + database
- Handles authentication, elections, voting
- RESTful API endpoints
- **URL**: `https://your-vps-domain.com`

## 📋 Prerequisites

- **Node.js** 20 LTS or higher
- **PostgreSQL** 15+
- **Redis** 7+ (optional, falls back to in-memory)
- **Git** for version control

## 🔧 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/jkmuthu/voternet.git
cd voternet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.development

# Generate secure JWT secrets (run twice for different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Edit `.env.development`** with your values:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voternet_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Secrets (use generated values above)
JWT_ACCESS_SECRET=your_generated_access_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb voternet_dev

# Build TypeScript
npm run build

# Run migrations
npm run db:migrate

# Seed test users (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at: **http://localhost:3000**

Frontend pages:
- Landing: http://localhost:3000/
- Voting: http://localhost:3000/vote.html
- Results: http://localhost:3000/results.html
- Admin: http://localhost:3000/admin.html

## 🌐 GitHub Pages Deployment

### Step 1: Update VPS URL

Edit `public/config.js` and replace the production URL:

```javascript
API_URLS: {
    local: 'http://localhost:3000',
    production: 'https://your-vps-domain.com' // ← Update this
}
```

### Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: VoterNet voting platform"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/jkmuthu/voternet.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch
4. Select `/public` folder (if available) or root `/`
5. Click **Save**

GitHub Pages URL: `https://jkmuthu.github.io/voternet/`

**Note**: The frontend will connect to your VPS backend for API calls.

## 🖥️ VPS Deployment

### Prerequisites on VPS
- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name pointed to VPS IP (optional but recommended)

### Step 1: Connect to VPS

```bash
ssh your-user@your-vps-ip
```

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 3: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE voternet_prod;
CREATE USER voternet WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE voternet_prod TO voternet;
\q
```

### Step 4: Clone and Configure

```bash
# Navigate to web directory
cd /var/www

# Clone repository
sudo git clone https://github.com/jkmuthu/voternet.git
cd voternet

# Install dependencies
sudo npm install

# Create production environment file
sudo nano .env.production
```

**`.env.production` content**:
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voternet_prod
DB_USER=voternet
DB_PASSWORD=your_secure_password

# JWT Secrets (generate new ones for production!)
JWT_ACCESS_SECRET=your_production_access_secret
JWT_REFRESH_SECRET=your_production_refresh_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS (GitHub Pages URL)
CORS_ORIGIN=https://jkmuthu.github.io
```

### Step 5: Build and Migrate

```bash
# Build TypeScript
sudo npm run build

# Run migrations
sudo NODE_ENV=production npm run db:migrate

# Seed production users (if needed)
sudo NODE_ENV=production npm run db:seed
```

### Step 6: Start with PM2

```bash
# Start application
sudo pm2 start dist/main.js --name voternet --env production

# Save PM2 configuration
sudo pm2 save

# Setup PM2 to start on boot
sudo pm2 startup
```

### Step 7: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/voternet
```

**Nginx configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/voternet /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is setup automatically
```

## 📁 Project Structure

```
voternet/
├── public/               # Frontend files (GitHub Pages)
│   ├── index.html       # Landing page
│   ├── vote.html        # Voting interface
│   ├── results.html     # Election results
│   ├── admin.html       # Admin dashboard
│   └── config.js        # API configuration
├── src/
│   ├── apps/            # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── elections/   # Election management
│   │   ├── users/       # User management
│   │   └── voting/      # Voting system
│   ├── libraries/       # Shared libraries
│   │   ├── database/    # Database entities & config
│   │   ├── redis/       # Redis client
│   │   └── logger/      # Winston logger
│   └── main.ts          # Application entry point
├── tests/               # Test files
├── .env.example         # Environment template
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

```

## 🔐 Test Credentials

After running `npm run db:seed`, use these credentials:

| Role  | Email | Password |
|-------|-------|----------|
| **Admin** | admin@voternet.com | Admin123! |
| **Voter** | voter@voternet.com | Voter123! |

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update user profile | Yes |

### Elections

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/elections` | List all elections | No |
| GET | `/api/elections/active` | Get active elections | No |
| GET | `/api/elections/:id` | Get election by ID | No |
| POST | `/api/elections` | Create election | Yes (Admin) |
| PUT | `/api/elections/:id` | Update election | Yes (Admin) |
| DELETE | `/api/elections/:id` | Delete election | Yes (Admin) |

### Candidates

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/candidates` | List all candidates | No |
| GET | `/api/elections/:id/candidates` | Get candidates for election | No |
| POST | `/api/candidates` | Add candidate | Yes (Admin) |
| PUT | `/api/candidates/:id` | Update candidate | Yes (Admin) |
| DELETE | `/api/candidates/:id` | Remove candidate | Yes (Admin) |

### Voting

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/vote` | Cast a vote | Yes |
| GET | `/api/vote/receipt/:id` | Get vote receipt | Yes |
| GET | `/api/elections/:id/results` | Get election results | No |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | API health check | No |

## 🔒 Security Features

- ✅ **JWT Authentication**: Access tokens (15 min) + Refresh tokens (7 days)
- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **Content Security Policy**: Helmet.js protection
- ✅ **Rate Limiting**: 100 requests per 15 minutes
- ✅ **CORS Configuration**: Whitelist-based origin control
- ✅ **SQL Injection Protection**: TypeORM parameterized queries
- ✅ **XSS Prevention**: Input sanitization and CSP headers
- ✅ **Audit Logging**: All critical actions logged

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed test users |
| `npm test` | Run test suite |
| `npm run lint` | Lint codebase |

## 📊 Database Schema

### Core Tables

- **users**: User accounts (voters, admins, staff)
- **voter_registration**: Voter eligibility tracking
- **sessions**: Active refresh tokens
- **elections**: Election definitions
- **candidates**: Candidate profiles
- **votes**: Encrypted vote records
- **audit_logs**: System action history

## 🔧 Troubleshooting

### Port 3000 Already in Use

```bash
# Windows
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### PostgreSQL Connection Error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis Connection Failed

The application will fall back to in-memory session storage if Redis is unavailable. To fix:

```bash
# Start Redis
sudo systemctl start redis

# Enable on boot
sudo systemctl enable redis
```

## 🚦 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ...your data... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Roadmap

- [x] User authentication & authorization
- [x] Election management
- [x] Voting system
- [x] Real-time results
- [x] Admin dashboard
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Blockchain vote verification
- [ ] Multi-language support
- [ ] Mobile app

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

Built with ❤️ for secure democratic participation


