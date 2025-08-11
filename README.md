# WhatsApp Payload Processing API

## Overview
A Node.js + Express backend that:
- Reads JSON payloads from `payloads/` folder
- Processes messages & stores them in MongoDB
- Provides an API to fetch stored messages

---

## Setup
1. Install dependencies:
```bash
npm install
Create .env:


MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
PORT=5000
How to Run
Process Payloads

node scripts/processPayloads.js
Start Server


node server.js
Server runs at http://localhost:5000

API Endpoint
GET /api/messages → Fetch all stored messages

Sample Payload

{
  "messages": [
    { "id": "msg_001", "text": { "body": "Hello World" } 
    }
  ],
  "contacts": [
    { "wa_id": "1234567890", "profile": { "name": "User1" } 
    }
  ]
}
Flow Diagram

flowchart TD
    A(JSON Payloads in /payloads) --> B[processPayloads.js]
    B -->|Insert/Update| C(MongoDB Database)
    C --> D[Express API /api/messages]
    D --> E[Frontend / Postman / Client]
    