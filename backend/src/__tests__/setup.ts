// Test setup file
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ENCRYPTION_KEY = "test-encryption-key-min-32-chars!";
