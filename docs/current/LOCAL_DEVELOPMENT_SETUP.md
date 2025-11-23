# Local Development Setup Guide

## 🎯 Database Configuration for Local Development

### **Recommendation: Use Local MySQL**

**Why?**
- Matches production environment (MySQL)
- Fast (no network latency)
- Safe (doesn't affect production data)
- Works offline
- Easy to reset/rebuild

---

## 📋 Setup Steps

### Option 1: Local MySQL (RECOMMENDED)

#### Step 1: Install MySQL Locally
```bash
# macOS (using Homebrew)
brew install mysql
brew services start mysql

# Or use Docker
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=clinicprospect_dev -p 3306:3306 -d mysql:8.0
```

#### Step 2: Create Local Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE clinicprospect_dev;
CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON clinicprospect_dev.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Step 3: Configure Local .env
Create/update `.env` in project root:
```env
# Local Development Database
DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"

# Other required variables
NODE_ENV=development
PORT=3001
DEV_API_PORT=3001

# JWT Secrets (use different values for local)
JWT_SECRET=local-dev-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret

# DataForSEO (use your real credentials)
DATAFORSEO_BASE_URL=https://api.dataforseo.com/v3
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# LLM APIs (use your real credentials)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key

# Frontend URL (local dev)
FRONTEND_URL=http://localhost:8080,http://localhost:8081

# Other
PING_MESSAGE=ping
```

#### Step 4: Run Prisma Migrations
```bash
# Generate Prisma client for MySQL
pnpm prisma generate

# Run migrations to create tables
pnpm prisma migrate dev

# Or push schema (if no migrations yet)
pnpm prisma db push
```

#### Step 5: Start Development
```bash
# Terminal 1: Backend
pnpm tsx server/dev.ts

# Terminal 2: Frontend  
pnpm dev
```

---

### Option 2: Use Remote MySQL (NOT RECOMMENDED for regular dev)

**Only use this if:**
- You need production data for testing
- You're debugging production issues
- You don't want to set up local MySQL

**Configuration:**
```env
# Point to GoDaddy MySQL
DATABASE_URL="mysql://portal_db_user:Techsodream2021%21@p3plzcpnl504611.prod.phx3.secureserver.net:3306/clinicprospect"
```

**⚠️ WARNING:**
- Slower (network latency)
- Risk of modifying production data
- Requires internet connection
- Shared with production environment

---

## 🔄 How It Works

### Environment-Specific Configuration

**Local Development** (`.env`):
```
DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"
NODE_ENV=development
```

**Production** (Railway Environment Variables):
```
DATABASE_URL="mysql://portal_db_user:Techsodream2021%21@p3plzcpnl504611.prod.phx3.secureserver.net:3306/clinicprospect"
NODE_ENV=production
```

### Prisma Behavior

**Same Schema, Different Databases:**
- Both use `prisma/schema.prisma` (same schema)
- Prisma reads `DATABASE_URL` from environment
- Local `.env` → local database
- Railway env vars → production database

**Prisma Commands:**
```bash
# Works with current DATABASE_URL
pnpm prisma generate    # Generate client
pnpm prisma migrate dev # Run migrations
pnpm prisma studio      # Open Prisma Studio (local DB browser)
pnpm prisma db push     # Push schema changes (no migration)
```

---

## 🛠️ Development Workflow

### Daily Development
1. **Start Local MySQL** (if not running)
   ```bash
   brew services start mysql  # macOS
   # or
   docker start mysql-dev     # Docker
   ```

2. **Check .env** - Ensure it points to local database
   ```env
   DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"
   ```

3. **Start Backend**
   ```bash
   pnpm tsx server/dev.ts
   ```

4. **Start Frontend**
   ```bash
   pnpm dev
   ```

5. **Access**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001/api
   - Prisma Studio: `pnpm prisma studio` (optional)

### Database Reset (If Needed)
```bash
# Reset local database
pnpm prisma migrate reset

# Or manually
mysql -u root -p
DROP DATABASE clinicprospect_dev;
CREATE DATABASE clinicprospect_dev;
# Then run migrations again
pnpm prisma migrate dev
```

---

## 📊 Database Comparison

| Feature | Local MySQL | Remote MySQL (GoDaddy) |
|---------|------------|------------------------|
| **Speed** | ⚡ Very Fast | 🐌 Network Latency |
| **Offline** | ✅ Yes | ❌ No |
| **Safety** | ✅ Isolated | ⚠️ Production Risk |
| **Setup** | 📝 One-time | ✅ Already exists |
| **Data Sync** | ❌ Separate | ✅ Production Data |
| **Cost** | ✅ Free | ✅ Free |
| **Reset** | ✅ Easy | ❌ Dangerous |

---

## ✅ Recommendation Summary

**For Local Development:**
1. ✅ **Set up local MySQL** (one-time setup)
2. ✅ **Use local `.env`** with local database URL
3. ✅ **Same schema.prisma** works for both
4. ✅ **Fast, safe, isolated development**

**For Production:**
- Keep using GoDaddy MySQL (already configured)
- Railway reads from its environment variables
- Never point local development to production DB

---

## 🔧 Troubleshooting

### Issue: "Authentication failed"
- Check MySQL user credentials in `.env`
- Verify user has privileges: `GRANT ALL PRIVILEGES ON clinicprospect_dev.* TO 'dev_user'@'localhost';`

### Issue: "Database doesn't exist"
- Create it: `CREATE DATABASE clinicprospect_dev;`
- Run: `pnpm prisma db push`

### Issue: "Table doesn't exist"
- Run migrations: `pnpm prisma migrate dev`
- Or push schema: `pnpm prisma db push`

### Issue: "Prisma client out of date"
- Regenerate: `pnpm prisma generate`

---

## 🎯 Quick Start Command

```bash
# One-time setup
brew install mysql
brew services start mysql
mysql -u root -p -e "CREATE DATABASE clinicprospect_dev; CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password'; GRANT ALL PRIVILEGES ON clinicprospect_dev.* TO 'dev_user'@'localhost';"

# Update .env with local DATABASE_URL
# Then:
pnpm prisma generate
pnpm prisma db push

# Start development
pnpm tsx server/dev.ts  # Terminal 1
pnpm dev                 # Terminal 2
```

---

**Bottom Line**: Use **local MySQL** for development. Same Prisma schema, different database URLs. Production stays untouched.

