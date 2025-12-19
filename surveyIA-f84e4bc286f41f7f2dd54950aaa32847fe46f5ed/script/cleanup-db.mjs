#!/usr/bin/env node
/**
 * Database cleanup script
 * Removes old survey responses to manage storage
 * Run with: node script/cleanup-db.mjs
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const RETENTION_DAYS = 30; // Keep responses for 30 days
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function cleanupOldResponses() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log(`🧹 Cleaning up survey responses older than ${RETENTION_DAYS} days...`);

    const result = await pool.query(
      `DELETE FROM survey_responses 
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`
    );

    console.log(`✅ Deleted ${result.rowCount} old survey responses`);
    
    return true;
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function getDatabaseSize() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await pool.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    console.log('\n📊 Database Size:');
    console.log('─'.repeat(50));

    let totalBytes = 0;
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.size}`);
      totalBytes += row.size_bytes;
    });

    console.log('─'.repeat(50));
    console.log(`  TOTAL: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

    // Get record counts
    const countResult = await pool.query(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'survey_responses', COUNT(*) FROM survey_responses
    `);

    console.log('\n📈 Record Counts:');
    console.log('─'.repeat(50));
    countResult.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count.toString().padStart(10)} records`);
    });
    console.log('─'.repeat(50));

    return true;
  } catch (err) {
    console.error('❌ Failed to get database size:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🗄️  Database Maintenance Tool\n');

  const cleaned = await cleanupOldResponses();
  if (!cleaned) {
    process.exit(1);
  }

  await getDatabaseSize();

  console.log('\n✅ Cleanup completed');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
