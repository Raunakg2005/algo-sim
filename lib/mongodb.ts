import { MongoClient } from "mongodb"

// Lazy, shared MongoDB connection. Nothing connects at import time (so `next build` needs no
// database), and a failed connection is retried on the next request instead of being cached,
// which matters when the app container starts before MongoDB is ready.

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function getMongoClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error("MONGODB_URI is not set (see .env.example)")
    global._mongoClientPromise = new MongoClient(uri).connect().catch((err) => {
      global._mongoClientPromise = undefined
      throw err
    })
  }
  return global._mongoClientPromise
}
