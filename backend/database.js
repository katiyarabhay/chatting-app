const { neon } = require('@neondatabase/serverless');

let sqlWrapper;
let initialized = false;

async function getDB() {
  if (!sqlWrapper) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL. Please link the Neon database in your Vercel Dashboard.");
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // Wrap the neon function so it returns { rows } to match our existing code
    sqlWrapper = async (strings, ...values) => {
      const result = await sql(strings, ...values);
      return { rows: result };
    };
  }

  if (!initialized) {
    try {
      // Create tables if they don't exist
      await sqlWrapper`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL
        );
      `;

      await sqlWrapper`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          contact_id INTEGER NOT NULL,
          UNIQUE(user_id, contact_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (contact_id) REFERENCES users(id)
        );
      `;

      await sqlWrapper`
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
      console.error('Database initialization error:', err);
      throw err;
    }
  }

  return sqlWrapper;
}

module.exports = { getDB };
