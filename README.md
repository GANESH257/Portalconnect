# Ensemble Digital Labs - AI Marketing Platform

A modern, full-stack React application showcasing AI agents for healthcare marketing, built with TypeScript, TailwindCSS, and Express.js.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🧑‍💻 Local Development

Run backend API and frontend locally with hot reload.

1) Install dependencies
```bash
pnpm install
```

2) Start the API (Express) on port 3001
```bash
pnpm tsx server/dev.ts
```

3) Start the frontend (Vite) on port 8080
```bash
pnpm dev
```

4) Open the app
```text
http://localhost:8080
```

Verify API works directly and via proxy:
```bash
# Direct API
curl http://127.0.0.1:3001/api/ping

# Proxied through Vite (see vite.config.ts)
curl http://localhost:8080/api/ping
```

Notes
- Vite dev proxy forwards requests from `/api/*` to `http://127.0.0.1:3001`.
- You can change the API dev port by setting `DEV_API_PORT` before starting the server (default: 3001). If you change it, also update `vite.config.ts` proxy target.
- Node v22 + tsx: use `pnpm tsx server/dev.ts` (do not use `node --loader tsx`).

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── agents/            # AI agent pages
│   ├── components/        # Reusable UI components
│   ├── pages/            # Main pages
│   └── global.css        # Global styles
├── server/               # Express backend
│   ├── routes/          # API endpoints
│   └── knowledge/       # Knowledge base
├── shared/              # Shared types
└── dist/               # Built files
```

## 🎨 Features

- **7 AI Agent Pages**: Customer Support, Copywriter, Email Marketing, Image Artist, Marketing Genius, Coding Helper, SEO Specialist
- **Image Generation**: Nanobanana API integration for AI-powered image creation
- **Modern UI**: Blue-yellow theme with glassmorphism effects
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **TypeScript**: Full type safety throughout the application

## 🚀 Deployment

### GoDaddy cPanel
Use the included deployment package:
- `ensemble-godaddy-deployment-FINAL.zip` - Ready for GoDaddy cPanel upload

### Other Hosting
1. Run `pnpm build`
2. Upload `dist/spa/` contents to your hosting provider
3. Ensure `.htaccess` is included for React Router

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, React Router
- **Backend**: Express.js, Node.js
- **Build Tool**: Vite
- **UI Components**: Radix UI, Lucide React
- **Styling**: TailwindCSS with custom theme

## 📝 License

Private project - All rights reserved.
