import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../index.js";
import { logger } from "../utils/logger.js";
import { auditService } from "./audit.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-change-in-production";
const SALT_ROUNDS = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // Register new user
  async register(
    email: string,
    password: string,
    name: string,
    companyName: string,
    companySlug: string
  ): Promise<{ user: any; tokens: AuthTokens }> {
    // Check if company slug is unique
    const existingCompany = await prisma.company.findUnique({
      where: { slug: companySlug },
    });

    if (existingCompany) {
      throw new Error("Company slug already exists");
    }

    // Check if email is unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create company and user in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: companySlug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "admin",
          companyId: company.id,
        },
      });

      return { user, company };
    });

    // Generate tokens
    const tokens = this.generateTokens(result.user.id, result.user.companyId, result.user.role);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.user.companyId,
      },
      tokens,
    };
  }

  // Login user
  async login(email: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.companyId, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      tokens,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return this.generateTokens(user.id, user.companyId, user.role);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  // Get current user
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    return user;
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return true;
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) return null;
    
    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    return resetToken;
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== "password_reset") {
        throw new Error("Invalid token type");
      }
      
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash },
      });
      
      return true;
    } catch (error) {
      console.error("Password reset failed:", error);
      return false;
    }
  }

  // Create user by admin
  async createUser(
    email: string,
    password: string,
    role: string,
    companyId: string
  ): Promise<any> {
    // Check if email is unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        companyId,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }

  // Generate JWT tokens
  private generateTokens(userId: string, companyId: string, role: string): AuthTokens {
    const accessToken = jwt.sign({ userId, companyId, role }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
