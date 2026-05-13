// netlify/functions/save.js
// Handles three actions:
//   saveRows    — forward measurement rows to Apps Script → Google Sheets
//   uploadPhotos — send base64 photos to Apps Script → Google Drive, get back links
//   getRecent   — fetch last N rows from Apps Script → return to client

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5338zmo3YatyvVVjs-Ozd4Sr8BvChpm7Xklc_mWjHzpVUMbVUUjdF69Z6hqCeQWyArA/exec';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const action = body.action || 'saveRows'; // default for backwards compatibility

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({ action, ...body })
    });

    const text = await response.text();

    // Try parse as JSON, fall back to raw text
    let result;
    try { result = JSON.parse(text); }
    catch { result = { raw: text }; }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('Netlify function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
