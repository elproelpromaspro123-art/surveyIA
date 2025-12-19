# Deployment Guide for Render

## Prerequisites

1. Render account (https://render.com)
2. GitHub repository connected to Render
3. Google API credentials (for Gemini API)
4. (Optional) Google OAuth credentials

## Environment Variables Setup

The application requires these environment variables on Render:

### Required Variables

- **DATABASE_URL**: PostgreSQL connection string
  - Automatically configured when you link a Render PostgreSQL database
  - Format: `postgresql://user:password@host:port/database`

- **GEMINI_API_KEY**: Google Gemini API key
  - Get from: https://aistudio.google.com/app/apikey
  - Set as a secret in Render Dashboard

### Optional Variables

- **GOOGLE_CLIENT_ID**: For Google OAuth login
- **GOOGLE_CLIENT_SECRET**: For Google OAuth login

## Deployment Steps

1. **Connect GitHub Repository**
   - Go to Render Dashboard
   - Click "+ New > Web Service"
   - Connect your GitHub repository

2. **Configure Build & Start Commands**
   - Build Command: `npm install && npm run build`
   - Start Command: `node script/init-db.mjs && npm start`
   - These are pre-configured in `render.yaml`

3. **Add PostgreSQL Database**
   - In Render Dashboard, create a new PostgreSQL database
   - Link it to your web service
   - DATABASE_URL will be automatically set

4. **Set Environment Variables**
   - In Environment section, add:
     - `GEMINI_API_KEY` (mark as secret)
     - `GOOGLE_CLIENT_ID` (if using OAuth)
     - `GOOGLE_CLIENT_SECRET` (if using OAuth, mark as secret)

5. **Deploy**
   - Push to GitHub
   - Render will automatically deploy via the connected repo

## Database Initialization

The application automatically:

1. Waits for database to be ready (`script/init-db.mjs`)
2. Runs Drizzle ORM migrations (`drizzle-kit push`)
3. Seeds demo user data (if needed)
4. Starts the Express server

If database initialization takes time, the app will retry up to 15 times with 2-second delays.

## Troubleshooting

### "getaddrinfo ENOTFOUND host" Error

This error means the application cannot connect to the database. Common causes:

**1. Missing DATABASE_URL environment variable:**
- In Render Dashboard, go to your web service
- Click "Environment" tab
- Check if `DATABASE_URL` is set
- If you linked a PostgreSQL database, it should be auto-populated
- If not, you need to manually add it

**2. PostgreSQL database not provisioned:**
- In Render Dashboard, create a new PostgreSQL database
- Link it to your web service
- Wait 2-3 minutes for the database to initialize
- Render will automatically set `DATABASE_URL`

**3. Database not ready yet:**
- During initial deployment, the database may take time to start
- The app will retry automatically up to 15 times with 2-second delays
- Wait a few minutes and refresh your browser

**4. Google OAuth errors also show as "ENOTFOUND host":**
- Ensure `GOOGLE_CLIENT_ID` is configured
- Get it from [Google Cloud Console](https://console.cloud.google.com)
- If you don't use Google OAuth, users can register with email/password

### Migrations Failed

Check the deployment logs in Render Dashboard:
- Make sure DATABASE_URL is set correctly
- Ensure PostgreSQL database is in the same region
- Wait a few minutes for database to become available

### Seeding Errors

The app tries to seed demo data after startup. If it fails:
1. It will retry up to 3 times
2. It won't block the app startup
3. You can manually create users via the API

## Accessing the Application

After deployment:
- Your app will be available at: `https://surveyia.onrender.com`
- Check "Live" status in Render Dashboard
- View logs in real-time in the Logs section

## Local Development

```bash
# Install dependencies
npm install

# Set up local .env
cp .env.example .env
# Edit .env with your local database URL

# Run development server
npm run dev

# Run type checking
npm run check
```

## Production Notes

- The app runs on port 5000 (configurable via PORT env var)
- Database migrations run automatically on startup
- Seeding is non-blocking and won't prevent app startup
- All user data is stored in PostgreSQL (Neon serverless)
- The app is fully containerized for Render's free tier
