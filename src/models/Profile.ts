import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  baseCurrency: { type: String, required: true },
  frequentUsed: {
    from: { type: String },
    to: { type: String },
    amount: { type: Number },
  },
  savedConversations: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
    },
  ],
  alertPair: {
    from: { type: String },
    to: { type: String },
    target: { type: Number },
  },
});

const ProfileData = mongoose.model("ProfileData", profileSchema);

export default ProfileData;
