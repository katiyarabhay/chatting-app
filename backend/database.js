const { sql } = require('@vercel/postgres');

let initialized = false;

async function getDB() {
  if (!initialized) {
    try {
      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          contact_id INTEGER NOT NULL,
          UNIQUE(user_id, contact_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (contact_id) REFERENCES users(id)
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id),
          FOREIGN KEY (receiver_id) REFERENCES users(id)
        );
      `;
      initialized = true;
    } catch (err) {
      console.error('Database initialization error (Did you create the Vercel Postgres database?):', err);
      throw err;
    }
  }

  return sql;
}

module.exports = { getDB };
