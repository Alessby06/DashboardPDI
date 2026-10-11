const http = require('http');
const fs = require('fs');

const logPath = 'C:\\Users\\USER\\Downloads\\AREA-PDI-JOJANNES G\\pdi-astro\\.agents\\debug.log';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      fs.appendFileSync(logPath, body + '\n');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } catch (e) {
      res.writeHead(500);
      res.end(e.message);
    }
  });
});

server.listen(4322, '127.0.0.1', () => {
  console.log('Debug logger listening on http://127.0.0.1:4322');
});
