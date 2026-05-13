const https = require('https');
const http = require('http');
const url = require('url');

// Follow redirects manually — Google Apps Script always redirects
function fetchWithRedirects(requestUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentUrl, redirectsLeft) => {
      const parsed = url.parse(currentUrl);
      const lib = parsed.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsed.hostname,
        path: parsed.path,
        method: 'GET',
        headers: {
          'User-Agent': 'SmartInteriors/1.0',
          'Accept': '*/*'
        }
      };

      const req = lib.request(options, (res) => {
        console.log(`Status: ${res.statusCode} for ${currentUrl.substring(0, 80)}`);

        // Follow redirect
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectsLeft === 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
          console.log('Redirecting to:', nextUrl.substring(0, 80));
          // Consume response body
          res.resume();
          makeRequest(nextUrl, redirectsLeft - 1);
          return;
        }

        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          console.log('Final response:', data.substring(0, 200));
          resolve({statusCode: res.statusCode, body: data});
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err.toString());
        reject(err);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    };

    makeRequest(requestUrl, maxRedirects);
  });
}

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
    if (!SHEETS_URL) {
      return {
        statusCode: 500, headers,
        body: JSON.stringify({status: 'error', message: 'SHEETS_URL env variable not set'})
      };
    }

    const encoded = encodeURIComponent(JSON.stringify({rows}));
    const fullUrl = `${SHEETS_URL}?data=${encoded}`;
    console.log('Calling:', fullUrl.substring(0, 100));

    const result = await fetchWithRedirects(fullUrl);
    console.log('Result status:', result.statusCode);
    console.log('Result body:', result.body.substring(0, 200));

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        status: 'success',
        sheetsStatus: result.statusCode,
        sheetsResponse: result.body.substring(0, 100)
      })
    };

  } catch(err) {
    console.error('Handler error:', err.toString());
    return {
      statusCode: 500, headers,
      body: JSON.stringify({status: 'error', message: err.toString()})
    };
  }
};
