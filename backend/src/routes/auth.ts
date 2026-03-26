import { Router } from "express";
import { authService } from "../services/auth.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { prisma } from "../index.js";

const router = Router();

// POST /api/auth/register - Register new company and admin user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, companyName, companySlug } = req.body;

    if (!email || !password || !companyName || !companySlug) {
      return res.status(400).json({ 
        error: "Missing required fields",
        fields: ["email", "password", "companyName", "companySlug"] 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const result = await authService.register(
      email,
      password,
      name,
      companyName,
      companySlug,
    );

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

// POST /api/auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message || "Invalid credentials" });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    console.error("Refresh error:", error);
    res.status(401).json({ error: error.message || "Invalid refresh token" });
  }
});

// POST /api/auth/logout - Logout user (client should discard tokens)
router.post("/logout", authenticate, async (req: AuthRequest, res) => {
  // In a more complex system, we would blacklist the token
  // For now, client just discards the tokens
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me - Get current user
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

// POST /api/auth/change-password - Change password
router.post("/change-password", authenticate, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    await authService.changePassword(req.user!.id, oldPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(400).json({ error: error.message || "Failed to change password" });
  }
});



// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    await authService.generatePasswordResetToken(email);
    res.json({ message: "Reset instructions sent" });
  } catch (error) { res.status(500).json({ error: "Server error" }); }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const success = await authService.resetPassword(token, newPassword);
    if (success) res.json({ message: "Password reset successful" });
    else res.status(400).json({ error: "Invalid token" });
  } catch (error) { res.status(500).json({ error: "Server error" }); }
});

export default router;
