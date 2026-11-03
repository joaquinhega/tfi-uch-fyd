import { MongoClient } from "mongodb";
import { config } from "./config.js";

export async function conectar() {
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db(config.mongoDb);
  await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
  return db;
}