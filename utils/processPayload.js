import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Message from '../models/Message.js'; // adjust path if different
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.resolve();
const payloadDir = path.join(__dirname, 'whatsapp sample payloads'); // adjust if folder is elsewhere

// MongoDB connect
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('✅ Connected to MongoDB');

async function processChange(change) {
  const value = change.value || {};

  // Handle messages
  if (Array.isArray(value.messages)) {
    const contact = (value.contacts && value.contacts[0]) || {};
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
        to: m.to || (value.metadata && value.metadata.phone_number_id) || null,
        text: (m.text && m.text.body) || '',
        type: m.type || 'text',
        timestamp: m.timestamp
          ? new Date(Number(m.timestamp) * 1000)
          : new Date(),
        status: m.status || 'sent',
        raw: m,
      };

      await Message.findOneAndUpdate({ id: doc.id }, { $set: doc }, { upsert: true });
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
  const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(payloadDir, file), 'utf-8'));

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
  mongoose.connection.close();
}

main().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
