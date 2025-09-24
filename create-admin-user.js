#!/usr/bin/env node

/**
 * Script to create an admin user for the social media portal
 * Run with: node create-admin-user.js
 */

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Use the current DATABASE_URL (even though it might have connection issues)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function createAdminUser() {
  try {
    // Default admin credentials
    const email = 'admin@riphah.edu.pk';
    const password = 'admin123'; // Default password - CHANGE THIS AFTER FIRST LOGIN
    const firstName = 'Admin';
    const lastName = 'User';
    
    console.log('Creating admin user...');
    console.log('Email:', email);
    console.log('Default Password:', password);
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Try to create the admin user
    const query = `
      INSERT INTO users (email, password, "first_name", "last_name", role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        "first_name" = EXCLUDED."first_name",
        "last_name" = EXCLUDED."last_name",
        role = 'admin',
        updated_at = NOW()
      RETURNING id, email, role;
    `;
    
    const result = await pool.query(query, [email.toLowerCase(), hashedPassword, firstName, lastName]);
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('User details:', result.rows[0]);
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n⚠️  SECURITY REMINDER: Change the password after your first login!');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 Solution: Run "npm run db:push" first to create the database tables');
    } else if (error.message.includes('getaddrinfo EAI_AGAIN')) {
      console.log('\n💡 Solution: Database connection issue - check DATABASE_URL environment variable');
    }
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser().catch(console.error);