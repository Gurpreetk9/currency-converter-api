import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

export interface CustomRequest extends Request {
  _id: string | JwtPayload;
}
async function authCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    console.log(authorization);
    return res.status(401).send("Token error");
  }

  const token = authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET as string
    );
    (req as CustomRequest)._id = decoded;
    const user = await User.findOne({ _id: decoded });
    if (user?.isValid == false) {
      return res.status(401).json({ message: "Please Verify your email" });
    }
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid password" });
  }
}

export default authCheck;
