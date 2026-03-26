import request from "supertest";
import express from "express";

describe("Health Check", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  });

  it("should return health status", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeDefined();
  });
});
