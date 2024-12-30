import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
import { z } from "zod";
import ProfileData from "../models/Profile";
import mongoose, { Types } from "mongoose";
import nodemailer from "nodemailer";

import { CustomRequest } from "../middleware/auth";
import validate from "deep-email-validator";
const userValidate = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

async function checkEmailValid(email: string) {
  const result = await validate(email);

  return result;
}

async function sendVerifyMail(email: string, token: string) {
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.HOST_USER,
      pass: process.env.HOST_PASS,
    },
  });
  const mailOptions = {
    from: "Gurpreet Singh",
    to: email,
    subject: "Email Verification | Currency Converter",
    text: `Hi there, you have recently entered your 
		email on our website. 

		Please follow the given link to verify your email 
		http://localhost:3000/api/user/verify/${token}.

    Link is valid for 10 minutes

		Thanks`,
  };

  const info = await transport.sendMail(mailOptions);

  return info;
}
async function userSignUp(req: Request, res: Response) {
  const { email, password, username } = req.body;
  const session = await mongoose.startSession();

  session.startTransaction();
  try {
    const { success } = userValidate.safeParse(req.body);

    const ValidationResult = await checkEmailValid(email);

    if (!ValidationResult.valid) {
      return res.status(400).json({
        status: "error",
        message: "Email is not valid. Please try again!",
        reason: ValidationResult.reason,
      });
    }
    if (!success) {
      return res.status(401).json({ msg: "Validation Error" });
    }
    const isUser = await User.findOne({ email: email });

    if (isUser) {
      return res.status(403).json({ msg: "User already registered" });
    }
    const salt = await bcrypt.genSalt(10);

    const token = jwt.sign({ email }, process.env.JWT_SECRET as jwt.Secret, {
      expiresIn: "10m",
    });

    const user = new User();
    user.username = username;
    user.email = email;
    user.password = bcrypt.hashSync(password, salt);
    user.emailToken = token;
    await user.save();

    const sendData = await sendVerifyMail(email, token);

    if (sendData.rejected.length > 0) {
      await session.abortTransaction();
      return res.status(403).send("Error in sending mail");
    }
    await session.commitTransaction();
    return res.status(200).json({ sendData });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ msg: "Error in registering" });
  } finally {
    session.endSession();
  }
}

async function verifyUser(req: Request, res: Response) {
  const { token } = req.params;

  const user = await User.findOne({ emailToken: token });

  if (user) {
    user.isValid = true;
    await user.save();
    res.status(200).json({ message: "Email verified successfully" });
  }

  res.status(403).json({ message: "User not found" });
}
async function userLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const ValidationResult = await checkEmailValid(email);

  if (!ValidationResult.valid) {
    return res.status(400).json({
      status: "error",
      message: "Email is not valid. Please try again!",
      reason: ValidationResult.reason,
    });
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { _id: user._id?.toString() },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "15d",
      }
    );
    res.status(201).json({
      id: user._id,
      name: user.username,
      email: user.email,
      token,
    });
  } else {
    res.status(400).json({ msg: "Invalid user data" });
  }
}

async function createProfile(req: Request, res: Response) {
  const userId = (req as CustomRequest)._id;
  const { baseCurrency } = req.body;

  const userProfile = new ProfileData();
  userProfile.userId = userId as Types.ObjectId;
  userProfile.baseCurrency = baseCurrency;
  await userProfile.save();

  res.status(201).send("Profile created");
}
async function getProfile(req: Request, res: Response) {
  const userId = (req as CustomRequest)._id;

  const userProfile = await ProfileData.findOne({ userId });
  if (!userId) {
    return res.status(403).send("profile not exist");
  }

  res.status(201).json({ userProfile });
}
async function updateProfile(req: Request, res: Response): Promise<any> {
  const userId = (req as CustomRequest)._id;
  const { baseCurrency, username } = req.body;

  const userProfile = await ProfileData.findOne({ userId });
  if (!userProfile) {
    return res.sendStatus(403);
  }

  userProfile.baseCurrency = baseCurrency;
  await userProfile.save();

  if (username) {
    await User.updateOne({ _id: userId }, { $set: { username: username } });
  }

  res.status(200).json({
    msg: "User updated successfully",
  });
}

export default {
  userSignUp,
  userLogin,
  verifyUser,
  updateProfile,
  createProfile,
  getProfile,
};
