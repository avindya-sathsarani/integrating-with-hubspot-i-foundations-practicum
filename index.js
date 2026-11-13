
require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE = process.env.HUBSPOT_OBJECT_TYPE;

app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// GET / - Display Anime Characters
app.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`
        },
        params: {
          properties: 'name,anime,power',
          limit: 100
        }
      }
    );

    const characters = response.data.results;

    res.render('homepage', {
      title: 'Anime Characters | HubSpot Practicum',
      characters
    });

  } catch (error) {
    console.error(
      'Error fetching characters:',
      error.response?.data?.message || error.message
    );

    res.status(500).send('Failed to retrieve Anime Characters.');
  }
});


 // POST /update-cobj - Create a new Anime Character
app.post('/update-cobj', async (req, res) => {
  const { name, anime, power } = req.body;

  // Validate the form fields
  if (
    !name?.trim() ||
    !anime?.trim() ||
    !power?.trim()
  ) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const response = await axios.post(
      `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE}`,
      {
        properties: {
          name: name.trim(),
          anime: anime.trim(),
          power: power.trim()
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Character created:', response.data.id);

    // Return to the homepage after successful creation
    res.redirect('/');

  } catch (error) {
    console.error(
      'Error creating character:',
      error.response?.status,
      error.response?.data?.message || error.message
    );

    res.status(500).send('Failed to create Anime Character.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});
