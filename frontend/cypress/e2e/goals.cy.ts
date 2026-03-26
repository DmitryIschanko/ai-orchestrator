describe("Goals Management", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "password123");
    cy.visit("/goals");
  });

  it("should display goals page", () => {
    cy.contains("Goals").should("be.visible");
  });

  it("should create a new goal", () => {
    cy.contains("New Goal").click();
    
    cy.get(input[name=title]).type("Test Goal from E2E");
    cy.get(select[name=type]).select("company");
    cy.get(textarea[name=description]).type("This is a test goal");
    
    cy.contains("Create").click();
    
    cy.contains("Test Goal from E2E").should("be.visible");
  });

  it("should show validation error for missing title", () => {
    cy.contains("New Goal").click();
    
    // Try to submit without title
    cy.contains("Create").click();
    
    cy.contains("required").should("be.visible");
  });

  it("should display goal hierarchy", () => {
    cy.contains("Hierarchy").click();
    cy.url().should("include", "/goals/hierarchy");
  });
});

export {};
