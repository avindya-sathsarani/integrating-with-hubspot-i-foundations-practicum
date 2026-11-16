require("dotenv").config({ quiet: true });

const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE = process.env.HUBSPOT_OBJECT_TYPE;

if (!HUBSPOT_ACCESS_TOKEN || !OBJECT_TYPE) {
  console.error("Missing HubSpot environment variables.");
  process.exit(1);
}

// App Configuration
app.set("view engine", "pug");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// HubSpot API Configuration
const hubspotAPI = axios.create({
  baseURL: "https://api.hubapi.com",
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Reusable Error Handler
function handleHubSpotError(error, res, action) {
  const status = error.response?.status;
  const message =
    error.response?.data?.message || error.message;

  console.error(`HubSpot ${action} error:`, {
    status,
    message,
  });

  if (status === 400) {
    return res.status(400).send("Invalid request data.");
  }

  if (status === 401 || status === 403) {
    return res.status(502).send(
      "HubSpot authentication or permissions error."
    );
  }

  if (status === 404) {
    return res.status(404).send(
      "The requested character was not found."
    );
  }

  if (status === 429) {
    return res.status(503).send(
      "HubSpot rate limit exceeded. Please try again later."
    );
  }

  return res.status(502).send(
    "Unable to complete the request with HubSpot."
  );
}

// Validate Character Form Data
function validateCharacter(body) {
  const { name, anime, power } = body;

  if (
    typeof name !== "string" ||
    typeof anime !== "string" ||
    typeof power !== "string" ||
    !name.trim() ||
    !anime.trim() ||
    !power.trim()
  ) {
    return null;
  }

  return {
    name: name.trim(),
    anime: anime.trim(),
    power: power.trim(),
  };
}

// Validate HubSpot Record ID
function validCharacterId(id) {
  return /^\d+$/.test(id);
}

// =====================================
// GET / - Display Characters
// With Pagination
// =====================================

app.get("/", async (req, res) => {
  try {
    const limit = 10;

    const after =
      typeof req.query.after === "string"
        ? req.query.after
        : "";

    const history =
      typeof req.query.history === "string"
        ? req.query.history
        : "";

    if (
      (after && !/^\d+$/.test(after)) ||
      (history && !/^(start|\d+)(,(start|\d+))*$/.test(history))
    ) {
      return res.status(400).send(
        "Invalid pagination parameters."
      );
    }

    const params = {
      properties: "name,anime,power",
      limit,
    };

    if (after) {
      params.after = after;
    }

    const response = await hubspotAPI.get(
      `/crm/v3/objects/${OBJECT_TYPE}`,
      { params }
    );

    const characters = response.data.results;

    const previousCursors = history
      ? history.split(",")
      : [];

    const nextCursor =
      response.data.paging?.next?.after || null;

    const nextHistory = [
      ...previousCursors,
      after || "start",
    ].join(",");

    const previousCursor = previousCursors.length
      ? previousCursors[previousCursors.length - 1]
      : null;

    const previousHistory = previousCursors
      .slice(0, -1)
      .join(",");

    res.render("homepage", {
      title: "Anime Characters | HubSpot CRM v2",
      characters,
      nextPage: nextCursor,
      nextHistory,
      previousCursor,
      previousHistory,
      hasPrevious: previousCursors.length > 0,
    });
  } catch (error) {
    return handleHubSpotError(
      error,
      res,
      "fetch characters"
    );
  }
});

// =====================================
// GET /update-cobj - Add Character Form
// =====================================

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Add Anime Character | HubSpot CRM v2",
  });
});

// =====================================
// POST /update-cobj - Create Character
// =====================================

app.post("/update-cobj", async (req, res) => {
  const properties = validateCharacter(req.body);

  if (!properties) {
    return res.status(400).send(
      "All character fields are required."
    );
  }

  try {
    const response = await hubspotAPI.post(
      `/crm/v3/objects/${OBJECT_TYPE}`,
      { properties }
    );

    console.log(
      "Character created:",
      response.data.id
    );

    return res.redirect("/");
  } catch (error) {
    return handleHubSpotError(
      error,
      res,
      "create character"
    );
  }
});

// =====================================
// GET /edit-character/:id - Edit Form
// =====================================

app.get("/edit-character/:id", async (req, res) => {
  const characterId = req.params.id;

  if (!validCharacterId(characterId)) {
    return res.status(400).send(
      "Invalid character ID."
    );
  }

  try {
    const response = await hubspotAPI.get(
      `/crm/v3/objects/${OBJECT_TYPE}/${characterId}`,
      {
        params: {
          properties: "name,anime,power",
        },
      }
    );

    return res.render("edit-character", {
      title: "Edit Anime Character | HubSpot CRM v2",
      character: response.data,
    });
  } catch (error) {
    return handleHubSpotError(
      error,
      res,
      "fetch character"
    );
  }
});

// =====================================
// POST /edit-character/:id - Update
// =====================================

app.post("/edit-character/:id", async (req, res) => {
  const characterId = req.params.id;
  const properties = validateCharacter(req.body);

  if (!validCharacterId(characterId)) {
    return res.status(400).send(
      "Invalid character ID."
    );
  }

  if (!properties) {
    return res.status(400).send(
      "All character fields are required."
    );
  }

  try {
    await hubspotAPI.patch(
      `/crm/v3/objects/${OBJECT_TYPE}/${characterId}`,
      { properties }
    );

    console.log(
      "Character updated:",
      characterId
    );

    return res.redirect("/");
  } catch (error) {
    return handleHubSpotError(
      error,
      res,
      "update character"
    );
  }
});

// =====================================
// POST /delete-character/:id - Delete
// =====================================

app.post("/delete-character/:id", async (req, res) => {
  const characterId = req.params.id;

  if (!validCharacterId(characterId)) {
    return res.status(400).send(
      "Invalid character ID."
    );
  }

  try {
    await hubspotAPI.delete(
      `/crm/v3/objects/${OBJECT_TYPE}/${characterId}`
    );

    console.log(
      "Character deleted:",
      characterId
    );

    return res.redirect("/");
  } catch (error) {
    return handleHubSpotError(
      error,
      res,
      "delete character"
    );
  }
});

// =====================================
// 404 - Unknown Routes
// =====================================

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

// =====================================
// Start Server
// =====================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;