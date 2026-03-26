import { user } from "../fixtures/user.json";

describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display login page correctly", () => {
    cy.visit("/login");
    cy.contains("Sign in").should("be.visible");
    cy.get(input[type=email]).should("exist");
    cy.get(input[type=password]).should("exist");
    cy.get(button[type=submit]).should("contain", "Sign in");
  });

  it("should login with valid credentials", () => {
    cy.visit("/login");
    cy.get(input[type=email]).type("admin@test.com");
    cy.get(input[type=password]).type("password123");
    cy.get(button[type=submit]).click();
    
    // Should redirect to dashboard
    cy.url().should("not.include", "/login");
    cy.contains("Dashboard").should("be.visible");
  });

  it("should show error for invalid credentials", () => {
    cy.visit("/login");
    cy.get(input[type=email]).type("invalid@test.com");
    cy.get(input[type=password]).type("wrongpassword");
    cy.get(button[type=submit]).click();
    
    cy.contains("Invalid").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("should navigate to forgot password", () => {
    cy.visit("/login");
    cy.contains("Forgot password?").click();
    cy.url().should("include", "/forgot-password");
    cy.contains("Reset your password").should("be.visible");
  });

  it("should register a new user", () => {
    cy.visit("/register");
    cy.contains("Create account").should("be.visible");
    
    cy.get(input[name=companyName]).type("Test Company");
    cy.get(input[name=email]).type("testuser@example.com");
    cy.get(input[name=password]).type("password123");
    cy.get(button[type=submit]).click();
    
    // Should redirect or show success
    cy.url().should("not.include", "/register");
  });

  it("should logout successfully", () => {
    // Login first
    cy.visit("/login");
    cy.get(input[type=email]).type("admin@test.com");
    cy.get(input[type=password]).type("password123");
    cy.get(button[type=submit]).click();
    
    // Wait for dashboard
    cy.contains("Dashboard").should("be.visible");
    
    // Open user menu and logout
    cy.get([data-testid=user-menu]).click();
    cy.contains("Sign out").click();
    
    // Should redirect to login
    cy.url().should("include", "/login");
  });
});

export {};
