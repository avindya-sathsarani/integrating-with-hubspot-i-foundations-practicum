const request = require("supertest");
const app = require("../index");

describe("Anime Characters CRM v2 - Automated Tests", () => {

  // Test 1: Check Add Character page
  test("GET /update-cobj should display Add Character form", async () => {
    const response = await request(app).get("/update-cobj");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Add Anime Character");
  });

  // Test 2: Reject empty character fields
  test("POST /update-cobj should reject empty fields", async () => {
    const response = await request(app)
      .post("/update-cobj")
      .type("form")
      .send({
        name: "",
        anime: "",
        power: ""
      });

    expect(response.status).toBe(400);
    expect(response.text).toContain(
      "All character fields are required."
    );
  });

  // Test 3: Reject missing fields
  test("POST /update-cobj should reject missing fields", async () => {
    const response = await request(app)
      .post("/update-cobj")
      .type("form")
      .send({
        name: "Gojo",
        anime: ""
      });

    expect(response.status).toBe(400);
  });

  // Test 4: Reject invalid character ID during editing
  test("GET /edit-character/:id should reject invalid IDs", async () => {
    const response = await request(app)
      .get("/edit-character/invalid-id");

    expect(response.status).toBe(400);
    expect(response.text).toContain("Invalid character ID.");
  });

  // Test 5: Reject invalid character ID during deletion
  test("POST /delete-character/:id should reject invalid IDs", async () => {
    const response = await request(app)
      .post("/delete-character/invalid-id");

    expect(response.status).toBe(400);
  });

  // Test 6: Reject invalid character ID during updating
  test("POST /edit-character/:id should reject invalid IDs", async () => {
    const response = await request(app)
      .post("/edit-character/invalid-id")
      .type("form")
      .send({
        name: "Gojo",
        anime: "Jujutsu Kaisen",
        power: "Limitless"
      });

    expect(response.status).toBe(400);
  });

  // Test 7: Check unknown routes
  test("Unknown routes should return 404", async () => {
    const response = await request(app)
      .get("/unknown-page");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Page not found.");
  });

});
