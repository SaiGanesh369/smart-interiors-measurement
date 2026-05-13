exports.handler = async function(event, context) {
  // Allow all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
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

    // Forward to Google Apps Script using node-fetch
    const fetch = require('node-fetch');
    const encoded = encodeURIComponent(JSON.stringify({rows}));
    const response = await fetch(`${SHEETS_URL}?data=${encoded}`, {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await response.text();
    console.log('Sheets response:', text);

    return {
      statusCode: 200, headers,
      body: JSON.stringify({status: 'success'})
    };

  } catch(err) {
    console.error('Save error:', err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({status: 'error', message: err.toString()})
    };
  }
};
