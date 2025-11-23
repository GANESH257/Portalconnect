#!/bin/bash

# Local Development Database Setup Script
# This script sets up local MySQL database and updates .env for local development

echo "🚀 Setting up local development database..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify MySQL is running
echo "📊 Checking MySQL..."
if ! mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "⚠️  MySQL root access required. Please enter MySQL root password:"
    read -s MYSQL_PASSWORD
    MYSQL_CMD="mysql -u root -p${MYSQL_PASSWORD}"
else
    MYSQL_CMD="mysql -u root"
fi

# Step 2: Create database and user
echo "🗄️  Creating local database..."
$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS clinicprospect_dev;
CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON clinicprospect_dev.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database clinicprospect_dev created successfully' AS status;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Database might already exist or there was an issue${NC}"
fi

# Step 3: Update .env file
echo "📝 Updating .env file..."

if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "✅ Backed up existing .env to .env.backup"
    
    # Update DATABASE_URL for local development
    if grep -q "DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"|' .env
        else
            # Linux
            sed -i 's|^DATABASE_URL=.*|DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"|' .env
        fi
        echo "✅ Updated DATABASE_URL in .env to point to local database"
    else
        # Add DATABASE_URL if it doesn't exist
        echo 'DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"' >> .env
        echo "✅ Added DATABASE_URL to .env"
    fi
    
    # Ensure NODE_ENV is set to development
    if ! grep -q "^NODE_ENV=" .env; then
        echo 'NODE_ENV=development' >> .env
    fi
    
else
    # Create new .env file with local development settings
    cat > .env <<ENVFILE
# Local Development Database
DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/clinicprospect_dev"

# Environment
NODE_ENV=development
PORT=3001
DEV_API_PORT=3001

# JWT Secrets (use different values for local dev)
JWT_SECRET=local-dev-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-in-production

# DataForSEO API (ADD YOUR CREDENTIALS HERE)
DATAFORSEO_BASE_URL=https://api.dataforseo.com/v3
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password

# LLM API Keys (ADD YOUR KEYS HERE)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Frontend URLs
FRONTEND_URL=http://localhost:8080,http://localhost:8081

# Other
PING_MESSAGE=ping
ENVFILE
    echo "✅ Created new .env file with local development settings"
    echo -e "${YELLOW}⚠️  Please update DataForSEO and LLM API keys in .env${NC}"
fi

# Step 4: Generate Prisma client and push schema
echo "🔧 Generating Prisma client..."
pnpm prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma generate had issues. Run manually: pnpm prisma generate${NC}"
fi

echo ""
echo "📊 Pushing schema to local database..."
pnpm prisma db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema pushed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Schema push had issues. Run manually: pnpm prisma db push${NC}"
fi

echo ""
echo -e "${GREEN}✨ Local development database setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Update API keys in .env (DataForSEO, OpenAI, etc.)"
echo "  2. Start backend: pnpm tsx server/dev.ts"
echo "  3. Start frontend: pnpm dev"
echo ""
echo "💡 To restore production .env later, use: cp .env.backup .env"

