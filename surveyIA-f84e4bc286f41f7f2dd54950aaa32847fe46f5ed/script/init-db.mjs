#!/usr/bin/env node
/**
 * Initialize database connection and run migrations
 * This script waits for the database to be ready and runs drizzle-kit push
 */

import { execSync } from 'child_process';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const MAX_RETRIES = 15;
const DELAY_MS = 2000;

async function checkDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Please configure your database in Render Dashboard:');
    console.error('   1. Create a PostgreSQL database in Render');
    console.error('   2. Link it to your web service');
    console.error('   3. Render will automatically set DATABASE_URL');
    return false;
  }

  // Log masked URL for debugging
  const maskedUrl = databaseUrl.replace(/:[^@]*@/, ':***@');
  console.log(`📡 DATABASE_URL is configured: ${maskedUrl}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      console.log('✅ Database connection successful');
      return true;
    } catch (err) {
      const errorMsg = err.message || String(err);
      console.log(`⏳ Database attempt ${attempt}/${MAX_RETRIES}: ${errorMsg}`);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }
  
  console.error('❌ Could not connect to database after retries');
  console.error('   Possible causes:');
  console.error('   1. Database is still initializing (wait 2-3 minutes)');
  console.error('   2. Database URL is invalid');
  console.error('   3. Network connectivity issues');
  return false;
}

async function runMigrations() {
  try {
    console.log('🚀 Running migrations with drizzle-kit...');
    execSync('drizzle-kit push --config drizzle.config.ts', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Migrations completed successfully');
    return true;
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    return false;
  }
}

async function main() {
  console.log('📦 Initializing database...\n');
  
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.warn('⚠️  Database connection failed, but continuing with startup');
    process.exit(0); // Don't fail the build
  }

  const migrated = await runMigrations();
  if (!migrated) {
    console.warn('⚠️  Migrations failed, but continuing with startup');
    process.exit(0); // Don't fail the build
  }

  console.log('\n✅ Database initialization complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
