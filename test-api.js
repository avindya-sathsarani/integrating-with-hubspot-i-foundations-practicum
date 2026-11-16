require('dotenv').config();
const axios = require('axios');

const token = process.env.HUBSPOT_ACCESS_TOKEN;
const objectType = process.env.HUBSPOT_OBJECT_TYPE;

async function getAnimeCharacters() {
  if (!token || !objectType) {
    console.error('Missing HubSpot configuration in .env');
    return;
  }

  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/${objectType}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          properties: 'name,anime,power',
          limit: 100
        }
      }
    );

    console.log('Successfully connected to HubSpot!');
    console.table(
      response.data.results.map(record => ({
        Name: record.properties.name,
        Anime: record.properties.anime,
        Power: record.properties.power
      }))
    );

  } catch (error) {
    console.error(
      'HubSpot API Error:',
      error.response?.status,
      error.response?.data?.message || error.message
    );
  }
}

getAnimeCharacters();