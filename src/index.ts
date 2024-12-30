import express from "express";
import userRoute from "./routes/userRoute";
import mongoose from "mongoose";
import "dotenv/config";
import currencyRoute from "./routes/currencyRoute";
import { JwtPayload } from "jsonwebtoken";

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string).then(() => {
  console.log("Connected to database");
});
const app = express();
app.use(express.json());

app.use("/api/user", userRoute);
app.use("/api/currency", currencyRoute);

app.listen(3000, () => {
  console.log("Server is running at port 3000");
});
