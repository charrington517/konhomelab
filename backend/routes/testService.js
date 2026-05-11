const express = require('express');
const axios = require('axios');
const https = require('https');
const router = express.Router();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function maskError(err) {
  return err?.response?.status
    ? `HTTP ${err.response.status}`
    : err.message;
}

router.post('/', async (req, res) => {
  const { type, config } = req.body;
  
  try {
    if (!type) {
      return res.status(400).json({ ok: false, message: 'Missing service type' });
    }

    if (type === 'proxmox') {
      const headers = {
        Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`
      };
      await axios.get(`${config.url}/api2/json/cluster/resources`, {
        headers,
        httpsAgent,
        timeout: 6000
      });
      return res.json({ ok: true, message: 'Connected to Proxmox API' });
    }

    if (type === 'unraid') {
      await axios.post(
        `${config.url}/graphql`,
        { query: 'query { online }' },
        {
          timeout: 6000,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey
          },
          httpsAgent
        }
      );
      return res.json({ ok: true, message: 'Connected to Unraid GraphQL API' });
    }

    if (type === 'sonarr' || type === 'radarr') {
      await axios.get(`${config.url}/api/v3/system/status`, {
        timeout: 6000,
        headers: { 'X-Api-Key': config.apiKey }
      });
      return res.json({ ok: true, message: `Connected to ${type}` });
    }

    if (type === 'prowlarr') {
      await axios.get(`${config.url}/api/v1/system/status`, {
        timeout: 6000,
        headers: { 'X-Api-Key': config.apiKey }
      });
      return res.json({ ok: true, message: 'Connected to Prowlarr' });
    }

    if (type === 'qbittorrent') {
      const login = await axios.post(
        `${config.url}/api/v2/auth/login`,
        new URLSearchParams({
          username: config.username,
          password: config.password
        }).toString(),
        {
          timeout: 6000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          validateStatus: () => true
        }
      );
      if (!login.headers['set-cookie']) {
        return res.json({ ok: false, message: 'qBittorrent login failed' });
      }
      return res.json({ ok: true, message: 'Connected to qBittorrent' });
    }

    if (type === 'tdarr') {
      await axios.get(`${config.url}/api/v2/stats`, {
        timeout: 6000
      });
      return res.json({ ok: true, message: 'Connected to Tdarr' });
    }

    return res.status(400).json({
      ok: false,
      message: `Unknown service type: ${type}`
    });

  } catch (err) {
    return res.json({
      ok: false,
      message: maskError(err)
    });
  }
});

module.exports = router;
