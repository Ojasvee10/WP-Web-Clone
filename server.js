import express from "express";
import cors from "cors";
import messagesRoute from "./routes/messages.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/messages", messagesRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
