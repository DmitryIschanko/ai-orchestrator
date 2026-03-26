describe("Dashboard", () => {
  beforeEach(() => {
    // Login before each test
    cy.visit("/login");
    cy.get(input[type=email]).type("admin@test.com");
    cy.get(input[type=password]).type("password123");
    cy.get(button[type=submit]).click();
    cy.contains("Dashboard").should("be.visible");
  });

  it("should display dashboard with stats", () => {
    cy.contains("Dashboard").should("be.visible");
    cy.contains("Goals").should("be.visible");
    cy.contains("Tickets").should("be.visible");
    cy.contains("Budget").should("be.visible");
  });

  it("should display sidebar navigation", () => {
    cy.contains("Goals").should("be.visible");
    cy.contains("Tickets").should("be.visible");
    cy.contains("Agents").should("be.visible");
    cy.contains("Budget").should("be.visible");
    cy.contains("Settings").should("be.visible");
  });

  it("should navigate to different pages from sidebar", () => {
    // Goals
    cy.contains("Goals").click();
    cy.url().should("include", "/goals");
    
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
});

export {};
