import jwt from "jsonwebtoken";

export function generateToken(userId, role = "user") {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
