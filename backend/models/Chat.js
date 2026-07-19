import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Chat',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
