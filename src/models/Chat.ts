// src/models/Chat.ts
import mongoose from 'mongoose';

const SourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  sources: [SourceSchema]
});

const ChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Chat' },
    messages: [MessageSchema],
    isShared: { type: Boolean, default: false } // <-- NEW FIELD
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
