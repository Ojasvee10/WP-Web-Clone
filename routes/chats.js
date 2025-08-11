const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Get all chats
router.get("/", async (req, res) => {
  const chats = await Message.find();
  res.json(chats);
});

// Send message to a chat
router.post("/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const newMsg = { text: message, sent: true };
  const chat = await Message.findById(id);

  chat.messages.push(newMsg);
  await chat.save();

  res.json(newMsg);
});

module.exports = router;
