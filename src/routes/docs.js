const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const SPEC_PATH = path.join(__dirname, '..', '..', 'docs', 'openapi.yaml');

/**
 * Serves the OpenAPI 3.1 spec at GET {prefix}/docs (raw YAML).
 * The absolute spec URL is derived from the request so the Swagger UI
 * page below always points at the right host.
 */
router.get('/', (req, res) => {
  res.type('application/yaml').send(fs.readFileSync(SPEC_PATH, 'utf8'));
});

/**
 * Interactive Swagger UI at GET {prefix}/docs/ui (client-side, CDN-hosted).
 */
router.get('/ui', (req, res) => {
  const specUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/`;
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aaryajanani API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: ${JSON.stringify(specUrl)},
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
        });
      };
    </script>
  </body>
</html>`);
});

module.exports = router;
