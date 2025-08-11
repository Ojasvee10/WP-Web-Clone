// scripts/processPayloads.js
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI; // put in .env
const dbName = "whatsapp";
const collectionName = "processed_messages";
const payloadsDir = path.join(process.cwd(), "payloads");

async function main() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const files = fs.readdirSync(payloadsDir);

    for (const file of files) {
      const filePath = path.join(payloadsDir, file);
      const rawData = fs.readFileSync(filePath, "utf8");
      const payload = JSON.parse(rawData);

      if (payload.messages) {
        // Insert new message payload
        for (const msg of payload.messages) {
          const existing = await collection.findOne({ id: msg.id });
          if (!existing) {
            await collection.insertOne({
              ...msg,
              wa_id: payload.contacts?.[0]?.wa_id || null,
              contact_name: payload.contacts?.[0]?.profile?.name || null,
              status: "sent",
              created_at: new Date()
            });
            console.log(`Inserted message: ${msg.id}`);
          }
        }
      } else if (payload.statuses) {
        // Update status payload
        for (const statusObj of payload.statuses) {
          const filter = {
            $or: [
              { id: statusObj.id },
              { meta_msg_id: statusObj.id }
            ]
          };
          const update = { $set: { status: statusObj.status } };
          const result = await collection.updateOne(filter, update);
          if (result.modifiedCount > 0) {
            console.log(`Updated status for: ${statusObj.id} -> ${statusObj.status}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error processing payloads:", err);
  } finally {
    await client.close();
  }
}

main();
