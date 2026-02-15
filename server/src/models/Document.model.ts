import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
    },
    scrapedAt: Date,
  },
  { timestamps: true },
);

export const Document = mongoose.model("Document", documentSchema);
