# 🔐 Authentication System Documentation

## 📋 **Overview**

The Ensemble Digital Labs authentication system is a complete, production-ready solution built with modern web technologies. It provides secure user registration, login, profile management, and session handling with a beautiful blue-yellow character-themed interface.

## 🚀 **Quick Start**

### **Login Credentials (Test Account)**
```
Email: test@ensemble.com
Password: password123
Company: Ensemble Digital Labs
Position: CEO
```

### **Access URLs**
- **Main Site**: http://localhost:8080
- **Login**: http://localhost:8080/login
- **Signup**: http://localhost:8080/signup
- **Dashboard**: http://localhost:8080/welcome (after login)
- **Settings**: http://localhost:8080/settings (after login)

## 🏗️ **Architecture**

### **Frontend Stack**
- **React 18** with TypeScript
- **React Router 6** for SPA routing
- **TailwindCSS 3** for styling
- **Radix UI** for components
- **React Query** for state management
- **Vite** for development and building

### **Backend Stack**
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Prisma ORM** for database operations
- **JWT** for authentication tokens
- **bcryptjs** for password hashing
- **Zod** for validation

### **Security Features**
- Password hashing with bcrypt (12 salt rounds)
- JWT tokens with 15-minute expiration
- Refresh token rotation (7 days)
- HttpOnly cookies for token storage
- CSRF protection
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)

## 📊 **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  profile_picture_url TEXT,
  bio TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### **Sessions Table**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

## 🔌 **API Endpoints**

### **Authentication Routes**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh token | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

### **Request/Response Examples**

#### **Signup Request**
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "companyName": "Company Name",
  "position": "Position",
  "phoneNumber": "+1-555-0123",
  "bio": "Optional bio"
}
```

#### **Login Request**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

#### **Success Response**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "companyName": "Company Name",
    "position": "Position",
    "phoneNumber": "+1-555-0123",
    "profilePictureUrl": null,
    "bio": "Optional bio",
    "emailVerified": false,
    "createdAt": "2025-10-20T15:51:46.754Z",
    "updatedAt": "2025-10-20T15:51:46.754Z",
    "lastLogin": "2025-10-20T15:51:47.041Z"
  },
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

## 🎨 **UI Components**

### **Login Page**
- **Location**: `/login`
- **Features**:
  - Email/password form with validation
  - Password visibility toggle
  - "Remember me" checkbox
  - Error handling with user-friendly messages
  - Character-themed design with Customer Support Agent
  - Responsive design for all devices

### **Signup Page**
- **Location**: `/signup`
- **Features**:
  - Multi-step form (2 steps)
  - Step 1: Basic Information (email, password)
  - Step 2: Professional Details (company, position, phone, bio)
  - Progress indicator
  - Real-time validation
  - Character-themed design with Marketing Genius Agent
  - Smooth transitions between steps

### **Welcome Dashboard**
- **Location**: `/welcome`
- **Features**:
  - Personalized greeting with company name
  - Statistics dashboard (7 agents, 24/7 availability, ∞ possibilities)
  - AI Agent Ecosystem grid
  - Getting started guide (3 steps)
  - Settings access
  - Character animations and theme consistency

### **Settings Page**
- **Location**: `/settings`
- **Features**:
  - Tabbed interface (Profile & Security)
  - Profile editing with current values
  - Password change functionality
  - Account management options
  - Mobile-responsive design
  - Character-themed styling

### **Navigation Header**
- **Features**:
  - Smart login/logout buttons
  - User menu with company name (when logged in)
  - Dashboard and settings access
  - Sign out functionality
  - Theme-consistent styling
  - Responsive design

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ensemble_auth?schema=public"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Token Expiry
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Environment
NODE_ENV="development"
PORT=3001
```

### **CORS Configuration**
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
```

## 🚀 **Development Setup**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 13+
- pnpm (preferred) or npm

### **Installation**
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Start development servers
pnpm dev
```

### **Available Scripts**
```bash
pnpm dev          # Start development server (client + server)
pnpm build        # Production build
pnpm start        # Start production server
pnpm typecheck    # TypeScript validation
pnpm test         # Run Vitest tests
```

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] User can sign up with valid information
- [ ] User can login with correct credentials
- [ ] User is redirected to welcome page after login
- [ ] User can access settings page
- [ ] User can update profile information
- [ ] User can change password
- [ ] User can logout successfully
- [ ] Protected routes redirect to login when not authenticated
- [ ] Form validation works correctly
- [ ] Error messages are user-friendly
- [ ] Responsive design works on all devices

### **API Testing**
```bash
# Test signup
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","companyName":"Test Company","position":"Developer","phoneNumber":"1234567890"}'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🎯 **User Journey**

### **New User Flow**
1. **Visit Site** → See login/signup buttons in header
2. **Click Sign Up** → Multi-step signup form
3. **Fill Details** → Email, password, company, position, phone
4. **Account Created** → Redirected to welcome page
5. **Explore Dashboard** → Access all AI agents
6. **Manage Profile** → Update settings as needed

### **Returning User Flow**
1. **Visit Site** → See user menu with company name
2. **Click Login** → Simple email/password form
3. **Authenticated** → Redirected to welcome page
4. **Access Features** → Full access to all functionality
5. **Manage Account** → Update profile or change password

## 🔒 **Security Best Practices**

### **Password Security**
- Minimum 8 characters required
- bcrypt hashing with 12 salt rounds
- No plain text storage
- Secure password change flow

### **Session Security**
- JWT tokens with short expiration (15 minutes)
- Refresh token rotation (7 days)
- HttpOnly cookies for token storage
- Secure headers and CORS configuration

### **API Security**
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS protection
- Rate limiting ready
- CSRF protection

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### **Mobile Features**
- Single column layout
- Touch-friendly form elements
- Optimized character images
- Swipe gestures for multi-step forms

### **Desktop Features**
- Full split-screen design
- Large character images
- Advanced animations
- Hover effects and interactions

## 🎨 **Theme Integration**

### **Color Palette**
- **Primary Blue**: #3498DB
- **Secondary Yellow**: #F1C40F
- **Dark Blue**: #2980B9
- **Light Blue**: #85C1E9
- **Success Green**: #27AE60
- **Error Red**: #E74C3C

### **Character Integration**
- **Login Page**: Customer Support Agent
- **Signup Page**: Marketing Genius Agent
- **Welcome Page**: All 7 AI agents
- **Settings Page**: Professional character theme

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] JWT secrets changed from defaults
- [ ] CORS origins updated for production domain
- [ ] Error handling tested
- [ ] Security headers configured
- [ ] SSL certificates installed
- [ ] Database backups configured

### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

## 🔮 **Future Enhancements**

### **Planned Features**
- Email verification system
- Password reset functionality
- Social login (Google, GitHub)
- Two-factor authentication
- User roles and permissions
- Advanced profile customization
- Team collaboration features
- API key management

### **Scalability Considerations**
- Database connection pooling
- Redis for session storage
- CDN for static assets
- Load balancing
- Microservices architecture

## 📞 **Support**

### **Common Issues**
1. **White Screen**: Clear browser cache and hard refresh
2. **Login Not Working**: Check database connection
3. **Session Expired**: Tokens expire after 15 minutes, refresh automatically
4. **Validation Errors**: Check form input requirements

### **Debug Mode**
Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 📄 **License**

This authentication system is part of the Ensemble Digital Labs platform and follows the project's licensing terms.

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
