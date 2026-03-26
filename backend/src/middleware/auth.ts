import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../index.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, companyId: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized - User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }
    next();
  };
};
