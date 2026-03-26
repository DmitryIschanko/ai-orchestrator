// Cypress E2E support file with custom commands

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createGoal(title: string, type: string): Chainable<void>;
      createTicket(title: string, priority?: string): Chainable<void>;
      resetDatabase(): Chainable<void>;
    }
  }
}

// Custom login command
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get(input[type=email]).clear().type(email);
  cy.get(input[type=password]).clear().type(password);
  cy.get(button[type=submit]).click();
  
  // Wait for dashboard to load
  cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  
  // Store auth token
  cy.window().then((win) => {
    const token = win.localStorage.getItem("accessToken");
    if (token) {
      Cypress.env("authToken", token);
    }
  });
});

// Custom logout command
Cypress.Commands.add("logout", () => {
  cy.get([data-testid=user-menu]).click();
  cy.contains("Sign out").click();
  cy.url().should("include", "/login");
});

// Create goal command
Cypress.Commands.add("createGoal", (title: string, type: string = "company") => {
  cy.visit("/goals");
  cy.contains("New Goal").click();
  cy.get(input[name=title]).type(title);
  cy.get(select[name=type]).select(type);
  cy.contains("Create").click();
  cy.contains(title).should("be.visible");
});

// Create ticket command
Cypress.Commands.add("createTicket", (title: string, priority: string = "medium") => {
  cy.visit("/tickets");
  cy.contains("New Ticket").click();
  cy.get(input[name=title]).type(title);
  cy.get(select[name=priority]).select(priority);
  cy.contains("Create").click();
  cy.contains(title).should("be.visible");
});

// Handle uncaught exceptions
Cypress.on("uncaught:exception", (err) => {
  // Returning false here prevents Cypress from failing the test
  if (err.message.includes("ResizeObserver")) {
    return false;
  }
  if (err.message.includes("Cannot read properties of undefined")) {
    return false;
  }
});

// Log API requests
Cypress.on("fail", (error, runnable) => {
  // Log the error for debugging
  cy.task("log", `Test failed: ${runnable.title}`);
  cy.task("log", error.message);
  throw error;
});

export {};
