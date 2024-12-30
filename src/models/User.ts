import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, require: true },
  password: { type: String, required: true },
  isValid: { type: Boolean, default: false },
  emailToken: { type: String },
  createdAt: { type: Date, default: Date.now() },
  expireAt: {
    type: Date,
    default: Date.now(),
    index: {
      expireAfterSeconds: 600,
      partialFilterExpression: { isValid: false },
    },
  },
});

const User = mongoose.model("User", userSchema);

export default User;
