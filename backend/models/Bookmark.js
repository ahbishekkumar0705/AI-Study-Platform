import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
    },
    text: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
