import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['pdf', 'pptx', 'docx', 'txt', 'youtube'],
    },
    size: {
      type: Number,
      required: true, // in bytes
    },
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true, // filename or Cloudinary public_id
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    numPages: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    error: {
      type: String,
    },
    summary: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model('File', fileSchema);
export default File;
