import express from 'express';
import cors from 'cors';
import net from 'net';
import tls from 'tls';
import dns from 'dns';
import http from 'http';
import https from 'https';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get public IP info using ipapi.co
app.get('/api/ip-info', async (_req, res) => {
  try {
    const data = await new Promise<string>((resolve, reject) => {
      const request = https.get('https://ipapi.co/json/', { timeout: 8000 }, (response) => {
        let body = '';
        response.on('data', (chunk) => (body += chunk));
        response.on('end', () => resolve(body));
      });
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch IP info',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Check host availability and headers (real data)
app.post('/api/check-host', async (req, res) => {
  const { host, port = 80, protocol = 'http' } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Host is required' });
  }

  const startTime = Date.now();

  try {
    // Resolve DNS
    const lookupStart = Date.now();
    const lookupResult = await dnsLookup(host);
    const dnsTime = Date.now() - lookupStart;

    // Make HTTP request
    const targetUrl = `${protocol}://${host}:${port}/`;
    const response = await new Promise<{
      statusCode: number;
      statusMessage: string;
      headers: http.IncomingHttpHeaders;
      responseTime: number;
    }>((resolve, reject) => {
      const client = protocol === 'https' ? https : http;
      const request = client.get(
        targetUrl,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Android; Mobile) SonicTunnel/4.2',
            Accept: '*/*',
          },
        },
        (response) => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: response.statusCode || 0,
            statusMessage: response.statusMessage || '',
            headers: response.headers,
            responseTime,
          });
        }
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timed out'));
      });
    });

    // Determine vulnerability heuristic
    const isVulnerable =
      response.statusCode === 302 ||
      response.statusCode === 301 ||
      (response.headers['location'] &&
        (response.headers['location'].includes('balance') ||
          response.headers['location'].includes('zero') ||
          response.headers['location'].includes('portal'))) ||
      host.toLowerCase().includes('free') ||
      host.toLowerCase().includes('portal') ||
      host.toLowerCase().includes('orange') ||
      host.toLowerCase().includes('africell') ||
      host.toLowerCase().includes('qcell');

    res.json({
      host,
      ip: lookupResult.address,
      family: lookupResult.family,
      dnsTime,
      ...response,
      isVulnerable,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Host check failed',
      message: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
    });
  }
});

// Real TCP port scanner
app.post('/api/scan-ports', async (req, res) => {
  const { host, ports = [22, 80, 443, 1080, 3128, 8080, 8888] } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Host is required' });
  }

  try {
    // Resolve IP if hostname provided
    const lookupResult = await dnsLookup(host).catch(() => ({ address: host, family: 4 }));
    const targetIp = lookupResult.address;

    const scanPort = (port: number, timeout = 2500): Promise<{
      port: number;
      status: 'open' | 'closed' | 'filtered';
      banner?: string;
    }> => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        let banner = '';
        let resolved = false;

        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
          }
        };

        socket.setTimeout(timeout);

        socket.on('connect', () => {
          // Try to grab a small banner if service sends one
          socket.once('data', (data) => {
            banner = data.toString('utf-8').slice(0, 80).replace(/[\r\n]/g, ' ');
          });

          // Give banner a tiny window then resolve open
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              socket.destroy();
              resolve({ port, status: 'open', banner });
            }
          }, 350);
        });

        socket.on('timeout', () => {
          cleanup();
          resolve({ port, status: 'filtered' });
        });

        socket.on('error', () => {
          cleanup();
          resolve({ port, status: 'closed' });
        });

        socket.connect(port, targetIp);
      });
    };

    const results = await Promise.all(ports.map((p: number) => scanPort(p)));

    res.json({
      host,
      resolvedIp: targetIp,
      results,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Port scan failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Real SNI mismatch test using Node.js TLS
app.post('/api/sni-test', async (req, res) => {
  const { targetIp, targetPort = 443, spoofedSni, timeout = 10000 } = req.body;

  if (!targetIp || !spoofedSni) {
    return res.status(400).json({ error: 'targetIp and spoofedSni are required' });
  }

  const startTime = Date.now();

  try {
    const result = await new Promise<{
      success: boolean;
      cipher?: string;
      protocol?: string;
      subject?: string;
      issuer?: string;
      error?: string;
    }>((resolve, reject) => {
      const socket = tls.connect(
        {
          host: targetIp,
          port: Number(targetPort),
          servername: spoofedSni,
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
          timeout,
        },
        () => {
          const cipher = socket.getCipher();
          const cert = socket.getPeerCertificate();
          resolve({
            success: true,
            cipher: cipher?.name,
            protocol: cipher?.version,
            subject: cert?.subject?.CN,
            issuer: cert?.issuer?.CN,
          });
          socket.end();
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'Connection timed out (firewall may have blackholed packets)' });
      });

      socket.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });

    res.json({
      targetIp,
      targetPort,
      spoofedSni,
      responseTime: Date.now() - startTime,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'SNI test failed',
      message: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
    });
  }
});

// DNS resolution endpoint
app.post('/api/dns-resolve', async (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'Host is required' });

  try {
    const addresses = await dnsResolve4(host);
    res.json({ host, addresses });
  } catch (error) {
    res.status(500).json({
      error: 'DNS resolution failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`[SonicTunnel Backend] Real-time network diagnostic API running on port ${PORT}`);
  console.log(`[SonicTunnel Backend] CORS enabled for all origins`);
});
