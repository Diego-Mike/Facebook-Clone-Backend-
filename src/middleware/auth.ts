import { Request, Response, NextFunction } from "express";

export const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const checkHeader = req.headers.authorization!.split("Bearer ")[1];

    if (!checkHeader) {
      return res.json({ Message: "You havent logged in/ registered yet" });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Message: "Something went wrong" });
  }
};
