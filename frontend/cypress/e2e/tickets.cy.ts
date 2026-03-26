describe("Tickets & Kanban", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "password123");
    cy.visit("/tickets");
  });

  it("should display tickets kanban board", () => {
    cy.contains("Tickets").should("be.visible");
    cy.contains("Todo").should("be.visible");
    cy.contains("In Progress").should("be.visible");
    cy.contains("Done").should("be.visible");
  });

  it("should create a new ticket", () => {
    cy.contains("New Ticket").click();
    
    cy.get(input[name=title]).type("Test Ticket");
    cy.get(textarea[name=description]).type("Test description");
    cy.get(select[name=priority]).select("high");
    
    cy.contains("Create").click();
    
    cy.contains("Test Ticket").should("be.visible");
  });

  it("should filter tickets by status", () => {
    cy.contains("Filter").click();
    cy.get([data-testid=filter-todo]).click();
    
    // Should only show todo tickets
    cy.get([data-testid=ticket-card]).each(($card) => {
      cy.wrap($card).should("have.attr", "data-status", "todo");
    });
  });

  it("should search tickets", () => {
    cy.get(input[placeholder*=Search]).type("Test");
    cy.contains("Test").should("be.visible");
  });
});

export {};
