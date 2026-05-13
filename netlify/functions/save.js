// netlify/functions/save.js
// Apps Script deployed web apps redirect POST requests to a unique execution URL.
// We resolve that URL once via GET, then POST directly — no redirect issues.

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5338zmo3YatyvVVjs-Ozd4Sr8BvChpm7Xklc_mWjHzpVUMbVUUjdF69Z6hqCeQWyArA/exec';

let _resolvedUrl = null; // cache resolved URL for the lifetime of this function instance

async function getResolvedUrl() {
  if (_resolvedUrl) return _resolvedUrl;
  // GET request follows redirect and lands on the actual execution URL
  const res = await fetch(APPS_SCRIPT_URL, { method: 'GET', redirect: 'follow' });
  _resolvedUrl = res.url; // final URL after redirect
  return _resolvedUrl;
}

async function callAppsScript(payload) {
  const url = await getResolvedUrl();
  const body = JSON.stringify(payload);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { raw: text }; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const action = body.action || 'saveRows';

  try {
    let result;

    if (action === 'uploadPhotos') {
      // Upload one photo at a time to stay well within payload limits
      const { entryId, folderId, photos } = body;
      const links = [];
      for (const photo of (photos || [])) {
        try {
          const res = await callAppsScript({
            action: 'uploadPhotos',
            entryId,
            folderId,
            photos: [photo]
          });
          console.log('Photo upload response:', JSON.stringify(res));
          if (res.links && res.links[0]) links.push(res.links[0]);
        } catch(e) {
          console.error('Single photo upload failed:', e.message);
        }
      }
      result = { status: 'ok', links };
    } else {
      result = await callAppsScript({ action, ...body });
    }

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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
