// Simple validation tests
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

describe("Validation Utils", () => {
  describe("Email Validation", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    it("should validate strong passwords", () => {
      expect(isValidPassword("StrongPass123!")).toBe(true);
      expect(isValidPassword("MyP@ssw0rd")).toBe(true);
    });

    it("should reject weak passwords", () => {
      expect(isValidPassword("123")).toBe(false);
      expect(isValidPassword("short")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });
  });
});
