import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
}

export async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Admin access only",
    });
  }
}
