import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
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
    front: {
      type: String,
      required: true,
      trim: true,
    },
    back: {
      type: String,
      required: true,
      trim: true,
    },
    isDifficult: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
