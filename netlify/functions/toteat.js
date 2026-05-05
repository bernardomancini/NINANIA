// Proxy para API de Toteat — resuelve el problema de CORS
// Netlify Functions actúa de intermediario entre el browser y Toteat

const https = require('https');

exports.handler = async function(event) {
  const { endpoint, ...params } = event.queryStringParameters || {};

  if (!endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: 'endpoint requerido' }) };
  }

  // Solo permitir endpoints conocidos de Toteat
  const allowed = ['sales', 'salesbywaiter'];
  if (!allowed.includes(endpoint)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'endpoint no permitido' }) };
  }

  // Reconstruir query string
  const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const url = `https://toteatglobal.appspot.com/mw/or/1.0/${endpoint}?${qs}`;

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Respuesta inválida de Toteat')); }
        });
      }).on('error', reject);
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
