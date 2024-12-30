import express from "express";
import userController from "../controller/userController";
import authCheck from "../middleware/auth";

const userRoute = express.Router();

userRoute.post("/signup", userController.userSignUp as any);
userRoute.post("/login", userController.userLogin as any);
userRoute.get("/verify/:token", userController.verifyUser as any);
userRoute.put("/profile", authCheck, userController.updateProfile);
userRoute.post("/profile", authCheck, userController.createProfile);
userRoute.get("/profile", authCheck, userController.getProfile as any);

export default userRoute;
