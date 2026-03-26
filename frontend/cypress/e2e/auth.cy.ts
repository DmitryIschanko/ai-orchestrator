describe("Authentication", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login page", () => {
    cy.contains("Sign in to your account").should("be.visible");
    cy.get(input[type=email]).should("exist");
    cy.get(input[type=password]).should("exist");
  });

  it("should show error for invalid credentials", () => {
    cy.get(input[type=email]).type("wrong@example.com");
    cy.get(input[type=password]).type("wrongpassword");
    cy.get(button[type=submit]).click();
    cy.contains("Invalid").should("be.visible");
  });

  it("should login with valid credentials", () => {
    cy.login("admin@test.com", "password123");
    cy.contains("Dashboard").should("be.visible");
  });

  it("should navigate to forgot password", () => {
    cy.contains("Forgot password?").click();
    cy.url().should("include", "/forgot-password");
    cy.contains("Reset your password").should("be.visible");
  });
});
