describe("Navigation", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "password123");
  });

  it("should navigate to different pages", () => {
    // Dashboard
    cy.contains("Dashboard").click();
    cy.url().should("include", "/");

    // Tickets
    cy.contains("Tickets").click();
    cy.url().should("include", "/tickets");

    // Agents
    cy.contains("Agents").click();
    cy.url().should("include", "/agents");

    // Settings
    cy.contains("Settings").click();
    cy.url().should("include", "/settings");
  });

  it("should open user menu", () => {
    cy.get([data-testid=user-menu]).click();
    cy.contains("Sign out").should("be.visible");
  });
});
