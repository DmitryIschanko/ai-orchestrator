import { Router } from "express";
import { authService } from "../services/auth.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new company and admin user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - email
 *               - password
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", async (req, res) => {
  try {
    const result = await authService.register(req.body.email, req.body.password, req.body.name, req.body.companyName, req.body.companySlug);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    logger.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens generated
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
  } catch (error: any) {
    logger.error("Token refresh error:", error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (if user exists)
 */
router.post("/forgot-password", async (req, res) => {
  try {
    await authService.generatePasswordResetToken(req.body.email);
    // Always return success to prevent email enumeration
    res.json({ message: "Password reset email sent if user exists" });
  } catch (error: any) {
    logger.error("Forgot password error:", error);
    res.json({ message: "Password reset email sent if user exists" });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const success = await authService.resetPassword(req.body.token, req.body.newPassword);
    if (success) {
      res.json({ message: "Password reset successful" });
    } else {
      res.status(400).json({ error: "Invalid or expired token" });
    }
  } catch (error: any) {
    logger.error("Reset password error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json(user);
  } catch (error: any) {
    logger.error("Get user error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
