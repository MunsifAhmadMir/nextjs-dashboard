import bcrypt from 'bcrypt';  // Import bcrypt for password hashing
import { db } from '@vercel/postgres';  // Import db from Vercel's Postgres package
import { invoices, customers, revenue, users } from '../lib/placeholder-data';  // Import placeholder data

let client: any;  // Declare client variable; use 'any' for flexibility

// Function to connect to the database
async function connectDatabase() {
  const connectionString = process.env.DATABASE_URL;  // Get the database connection string from environment variables
  if (connectionString) {
    client = await db.connect();  // Connect to the database
    return true;  // Return true if connection is successful
  } else {
    console.log('Database connection string is missing. Skipping database setup.');  // Log if connection string is missing
    return false;  // Return false if connection string is missing
  }
}

// Function to create required database extensions
async function seedExtensions() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;  // Create UUID extension for unique identifiers
}

// Function to seed user data into the database
async function seedUsers() {
  await client.sql`CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );`;  // Create users table if it doesn't exist

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);  // Hash the user's password
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;  // Insert user, ignore if there's a conflict
      `;
    })
  );

  return insertedUsers;  // Return the inserted users
}

// Function to seed invoice data into the database
async function seedInvoices() {
  await client.sql`CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    date DATE NOT NULL
  );`;  // Create invoices table if it doesn't exist

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => client.sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;  // Insert invoice, ignore if there's a conflict
      `
    )
  );

  return insertedInvoices;  // Return the inserted invoices
}

// Function to seed customer data into the database
async function seedCustomers() {
  await client.sql`CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL
  );`;  // Create customers table if it doesn't exist

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => client.sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;  // Insert customer, ignore if there's a conflict
      `
    )
  );

  return insertedCustomers;  // Return the inserted customers
}

// Function to seed revenue data into the database
async function seedRevenue() {
  await client.sql`CREATE TABLE IF NOT EXISTS revenue (
    month VARCHAR(4) NOT NULL UNIQUE,
    revenue INT NOT NULL
  );`;  // Create revenue table if it doesn't exist

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => client.sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;  // Insert revenue, ignore if there's a conflict
      `
    )
  );

  return insertedRevenue;  // Return the inserted revenue
}

// Main function that handles the HTTP GET request
export async function GET() {
  const isConnected = await connectDatabase();  // Attempt to connect to the database

  if (!isConnected) {
    return new Response(JSON.stringify({ message: 'Skipping database seed due to missing connection string' }), { status: 200 });  // Return a message if not connected
  }

  try {
    await client.sql`BEGIN`;  // Start a database transaction
    await seedExtensions();  // Create necessary extensions
    await seedUsers();  // Seed user data
    await seedCustomers();  // Seed customer data
    await seedInvoices();  // Seed invoice data
    await seedRevenue();  // Seed revenue data
    await client.sql`COMMIT`;  // Commit the transaction

    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), { status: 200 });  // Return success message
  } catch (error: any) {  // Catch any errors
    await client.sql`ROLLBACK`;  // Rollback the transaction if an error occurs
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });  // Return error message
  }
}
