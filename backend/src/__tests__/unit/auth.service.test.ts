import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("Auth Utils", () => {
  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testpassword123";
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should fail with wrong password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT Token", () => {
    it("should generate and verify token", () => {
      const payload = { userId: "123", email: "test@test.com" };
      const token = jwt.sign(payload, process.env.JWT_SECRET!);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });
});
