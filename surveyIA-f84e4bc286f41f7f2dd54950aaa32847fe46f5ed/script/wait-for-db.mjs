import { Pool } from '@neondatabase/serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const MAX_RETRIES = 10;
const DELAY_MS = 3000;

async function waitForDB() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Waiting for database to be ready...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      console.log('✓ Database is ready!');
      process.exit(0);
    } catch (err) {
      console.log(`Attempt ${attempt}/${MAX_RETRIES}: Database not ready - ${err.message}`);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      } else {
        console.error('✗ Failed to connect to database after retries');
        process.exit(1);
      }
    }
  }
}

waitForDB();
