import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js'; 

dotenv.config();

const __dirname = path.resolve();
const payloadDir = path.join(__dirname, 'whatsapp sample payloads');

// MongoDB connection
try {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
} catch (err) {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
}

async function processChange(change) {
  const value = change?.value || {};

  // Handle messages
  if (Array.isArray(value.messages)) {
    const contact = value.contacts?.[0] || {};
    const name = contact.profile?.name || null;

    for (const m of value.messages) {
      const messageId =
        m.id ||
        m.meta_msg_id ||
        `local_${m.from}_${m.timestamp}_${Math.random().toString(36).slice(2, 6)}`;

      const doc = {
        id: messageId,
        wa_id: m.from || null,
        name,
        from: m.from || null,
        to: m.to || value.metadata?.phone_number_id || null,
        text: m.text?.body || '',
        type: m.type || 'text',
        timestamp: m.timestamp
          ? new Date(Number(m.timestamp) * 1000)
          : new Date(),
        status: m.status || 'sent',
        raw: m,
      };

      await Message.findOneAndUpdate(
        { id: doc.id },
        { $set: doc },
        { upsert: true }
      );
      console.log(`💾 Saved message: ${doc.id}`);
    }
  }

  // Handle statuses
  if (Array.isArray(value.statuses)) {
    for (const s of value.statuses) {
      const id = s.id || s.message_id || s.meta_msg_id;
      if (!id) continue;

      await Message.findOneAndUpdate(
        { id },
        {
          $set: {
            status: s.status,
            raw_status: s,
            status_timestamp: s.timestamp
              ? new Date(Number(s.timestamp) * 1000)
              : new Date(),
          },
        }
      );
      console.log(`📌 Updated status for message: ${id}`);
    }
  }
}

async function main() {
  try {
    const files = (await fs.readdir(payloadDir)).filter(f =>
      f.endsWith('.json')
    );

    for (const file of files) {
      const filePath = path.join(payloadDir, file);
      const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      // WhatsApp webhook style: entry[0].changes[]
      if (content.entry) {
        for (const entry of content.entry) {
          for (const change of entry.changes || []) {
            await processChange(change);
          }
        }
      }
    }

    console.log('✅ All payloads processed.');
  } catch (err) {
    console.error('❌ Error processing payloads:', err);
  } finally {
    mongoose.connection.close();
  }
}

main();


// make the code more readable and understandable for the developers