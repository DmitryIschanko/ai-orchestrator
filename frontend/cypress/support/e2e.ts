// Cypress E2E support file

// Custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get(input[type=email]).type(email);
  cy.get(input[type=password]).type(password);
  cy.get(button[type=submit]).click();
  cy.url().should("not.include", "/login");
});

// Intercept API calls
Cypress.on("uncaught:exception", (err) => {
  // Returning false here prevents Cypress from failing the test
  if (err.message.includes("ResizeObserver")) {
    return false;
  }
});
