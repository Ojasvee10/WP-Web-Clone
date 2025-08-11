import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const mongoUri = process.env.MONGO_URI;
const dbName = "whatsapp";
const collectionName = "processed_messages";

router.get("/", async (req, res) => {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const messages = await collection.find().toArray();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  } finally {
    await client.close();
  }
});

export default router;
