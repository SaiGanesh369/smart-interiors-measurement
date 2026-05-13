const https = require('https');
const url = require('url');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const rows = body.rows;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({status: 'error', message: 'No rows'})
      };
    }

    const SHEETS_URL = process.env.SHEETS_URL;
    const encoded = encodeURIComponent(JSON.stringify({rows}));
    const fullUrl = `${SHEETS_URL}?data=${encoded}`;

    // Use built-in https module — no external dependencies needed
    await new Promise((resolve) => {
      const parsedUrl = url.parse(fullUrl);

      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'GET',
        headers: { 'User-Agent': 'SmartInteriors/1.0' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          console.log('Sheets status:', res.statusCode);
          console.log('Sheets response:', data.substring(0, 200));
          resolve();
        });
      });

      req.on('error', (err) => {
        console.error('HTTPS error:', err.toString());
        resolve();
      });

      req.end();
    });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({status: 'success'})
    };

  } catch(err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({status: 'error', message: err.toString()})
    };
  }
};
