import { MongoClient } from 'mongodb';

// Add debugging to see what environment variables are available
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
  hasMongoUri: !!process.env.MONGODB_URI
});

if (!process.env.MONGODB_URI) {
  console.error('❌ MongoDB URI is missing! Please check your .env.local file');
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    
    // Add connection logging
    globalWithMongo._mongoClientPromise
      .then(() => {
        console.log('✅ MongoDB connected successfully!');
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  
  // Add connection logging for production
  clientPromise
    .then(() => {
      console.log('✅ MongoDB connected successfully!');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection failed:', error);
    });
}

export default clientPromise;
