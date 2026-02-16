import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    scrapedAt: Date,
  },
  { timestamps: true },
);

documentSchema.index({ url: 1 }, { unique: true });

export const Document = mongoose.model("Document", documentSchema);
