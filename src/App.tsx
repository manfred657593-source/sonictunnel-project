import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Activity,
  Terminal,
  Settings,
  Code,
  BookOpen,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Network,
  Cpu,
  Layers,
  Globe,
  Copy,
  Download,
  AlertTriangle,
  Search,
  Database,
  Radio,
  Zap,
  TrendingUp,
  Lock,
  Server,
  Smartphone,
  TerminalSquare
} from 'lucide-react';

// Custom Toast System
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tools' | 'exporter' | 'academy'>('dashboard');
  const [activeTool, setActiveTool] = useState<'host-checker' | 'port-scanner' | 'ip-hunter' | 'sni-tester'>('host-checker');

  // Exporter Tab Selected Binding
  const [selectedExporter, setSelectedExporter] = useState<'python' | 'go' | 'rust' | 'termux' | 'sni-tester'>('python');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Tunnel Config State
  const [vpsIp, setVpsIp] = useState('198.51.100.45');
  const [vpsPort, setVpsPort] = useState(443);
  const [localPort, setLocalPort] = useState(1080);
  const [spoofedHost, setSpoofedHost] = useState('free.t-mobile.com');
  const [selectedPreset, setSelectedPreset] = useState('tmobile');
  const [tunnelMode, setTunnelMode] = useState<'payload' | 'sni' | 'direct'>('payload');

  // Payload Construction State
  const [payloadText, setPayloadText] = useState(
    'CONNECT [host]:[port] HTTP/1.1\\r\\nHost: [host]\\r\\nX-Online-Host: [host]\\r\\nX-Forward-Host: [host]\\r\\nConnection: Keep-Alive\\r\\n\\r\\n'
  );

  // Monitor/Simulator State
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: 'info' | 'success' | 'warning' | 'error' | 'in' | 'out'; text: string }>>([]);
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [trafficStats, setTrafficStats] = useState({
    dlSpeed: 0,
    ulSpeed: 0,
    totalDl: 0,
    totalUl: 0,
    ping: 0,
    savedCost: 0,
  });
  const [uptime, setUptime] = useState(0);

  // Live Graph Speed Sparkline Data
  const [speedHistory, setSpeedHistory] = useState<number[]>(Array(30).fill(0));

  // Host Checker Tool State
  const [hostCheckInput, setHostCheckInput] = useState('free.t-mobile.com');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [checkLogs, setCheckLogs] = useState<string[]>([]);
  const [checkMetrics, setCheckMetrics] = useState<{
    status: number;
    statusText: string;
    responseTime: number;
    isVulnerable: boolean;
    server: string;
    payloadSuggestion: string;
  } | null>(null);

  // Port Scanner Tool State
  const [scanHost, setScanHost] = useState('198.51.100.45');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [portsList, setPortsList] = useState<Array<{ port: number; name: string; status: 'open' | 'closed' | 'filtering' | 'idle' }>>([
    { port: 22, name: 'SSH Remote Login', status: 'idle' },
    { port: 80, name: 'HTTP Web Server', status: 'idle' },
    { port: 443, name: 'HTTPS (SSL/TLS)', status: 'idle' },
    { port: 1080, name: 'SOCKS5 Proxy Port', status: 'idle' },
    { port: 3128, name: 'Squid Transparent Proxy', status: 'idle' },
    { port: 8080, name: 'HTTP Alternative Proxy', status: 'idle' },
    { port: 8888, name: 'Custom Tunnel Port', status: 'idle' },
  ]);

  // IP Hunter Tool State
  const [hunterCarrier, setHunterCarrier] = useState('T-Mobile');
  const [isHunting, setIsHunting] = useState(false);
  const [hunterLogs, setHunterLogs] = useState<string[]>([]);
  const [matchedIp, setMatchedIp] = useState<string | null>(null);

  // SNI Mismatch Auditor Tool State
  const [sniTestIp, setSniTestIp] = useState('104.18.2.161');
  const [sniTestPort, setSniTestPort] = useState(443);
  const [sniTestHost, setSniTestHost] = useState('free-portal.local-telecom.com');
  const [sniTestLogs, setSniTestLogs] = useState<string[]>([]);
  const [sniTestStatus, setSniTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [sniMetrics, setSniMetrics] = useState<{
    handshakeSuccessful: boolean;
    cipher: string;
    isVulnerable: boolean;
    firewallAction: string;
  } | null>(null);

  // Test Request Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testUrl, setTestUrl] = useState('https://www.github.com');
  const [testProgress, setTestProgress] = useState<'idle' | 'initiating' | 'payload' | 'dpi_check' | 'vps_forward' | 'completed'>('idle');
  const [testLogs, setTestLogs] = useState<string[]>([]);

  // Backend / Real Data Configuration
  const [useRealBackend, setUseRealBackend] = useState(false);
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  // Real-time Network Status
  const [networkInfo, setNetworkInfo] = useState<{
    isOnline: boolean;
    publicIp?: string;
    city?: string;
    country?: string;
    org?: string;
    latencyMs?: number;
  }>({ isOnline: navigator.onLine });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const testLogsEndRef = useRef<HTMLDivElement>(null);
  const sniLogsEndRef = useRef<HTMLDivElement>(null);

  // Presets definition
  const presets = useMemo(() => ({
    tmobile: {
      name: 'T-Mobile Zero-Rate Bypass',
      host: 'free.t-mobile.com',
      port: 443,
      mode: 'payload' as const,
      payload: 'CONNECT [host]:[port] HTTP/1.1\\r\\nHost: [host]\\r\\nX-Online-Host: [host]\\r\\nX-Forward-Host: [host]\\r\\nConnection: Keep-Alive\\r\\n\\r\\n'
    },
    vodafone: {
      name: 'Vodafone Social Pass Bypass',
      host: 'm.facebook.com',
      port: 80,
      mode: 'payload' as const,
      payload: 'GET / HTTP/1.1\\r\\nHost: m.facebook.com\\r\\nX-Online-Host: m.facebook.com\\r\\nConnection: Keep-Alive\\r\\n\\r\\nCONNECT [host]:[port] [protocol]\\r\\n\\r\\n'
    },
    jio: {
      name: 'Jio Free Chat Pass',
      host: 'support.jio.com',
      port: 443,
      mode: 'sni' as const,
      payload: '[client_hello] [sni=support.jio.com]'
    },
    orange: {
      name: 'Orange Africa/EU Zero-Rate Bypass',
      host: 'pass.orange.ci',
      port: 443,
      mode: 'payload' as const,
      payload: 'CONNECT [host]:[port] HTTP/1.1\\r\\nHost: pass.orange.ci\\r\\nX-Online-Host: pass.orange.ci\\r\\nX-Forward-Host: pass.orange.ci\\r\\nConnection: Keep-Alive\\r\\n\\r\\n'
    },
    africell: {
      name: 'Africell Free WhatsApp/Portal Bypass',
      host: 'portal.africell.gm',
      port: 80,
      mode: 'payload' as const,
      payload: 'GET / HTTP/1.1\\r\\nHost: portal.africell.gm\\r\\nX-Online-Host: portal.africell.gm\\r\\nConnection: Keep-Alive\\r\\n\\r\\nCONNECT [host]:[port] [protocol]\\r\\n\\r\\n'
    },
    qcell: {
      name: 'QCell Zero-Rated Balance Portal',
      host: 'portal.qcell.sl',
      port: 443,
      mode: 'sni' as const,
      payload: '[client_hello] [sni=portal.qcell.sl]'
    },
    custom: {
      name: 'Custom Configuration',
      host: 'your-bug-host.com',
      port: 443,
      mode: 'payload' as const,
      payload: 'CONNECT [host]:[port] HTTP/1.1\\r\\nHost: [host]\\r\\n\\r\\n'
    }
  }), []);

  // Set configuration when preset changes
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setSpoofedHost(preset.host);
      setVpsPort(preset.port);
      setTunnelMode(preset.mode);
      setPayloadText(preset.payload);
      addToast(`Applied preset: ${preset.name}`, 'info');
    }
  };

  // Helper to format payload tags
  const insertPayloadTag = (tag: string) => {
    setPayloadText((prev) => prev + tag);
    addToast(`Inserted tag: ${tag}`, 'info');
  };

  // Format payload for actual execution visualization
  const getCompiledPayload = (rawPayload: string, host: string, port: string | number, proto: string = 'HTTP/1.1') => {
    return rawPayload
      .replace(/\[host\]/g, host)
      .replace(/\[port\]/g, String(port))
      .replace(/\[protocol\]/g, proto)
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n');
  };

  // Uptime ticker & simulated traffic logic
  useEffect(() => {
    let interval: any;
    if (connectionStatus === 'connected') {
      interval = setInterval(() => {
        setUptime((prev) => prev + 1);

        // Generate random speed spikes
        const dl = Math.round((Math.random() * 12 + 4) * 10) / 10;
        const ul = Math.round((Math.random() * 2 + 0.5) * 10) / 10;
        const ping = Math.round(35 + Math.random() * 25);
        const dataAddedDl = dl * 0.125; // in MB
        const dataAddedUl = ul * 0.125;

        setTrafficStats((prev) => {
          const nextDl = prev.totalDl + dataAddedDl;
          const nextUl = prev.totalUl + dataAddedUl;
          // Calculate cost saved ($0.05 per MB for normal cell data)
          const nextSaved = nextDl * 0.05 + nextUl * 0.05;
          return {
            dlSpeed: dl,
            ulSpeed: ul,
            totalDl: nextDl,
            totalUl: nextUl,
            ping: ping,
            savedCost: nextSaved,
          };
        });

        // Add to speed history for sparkline
        setSpeedHistory((prev) => [...prev.slice(1), dl]);

        // Occasional log output to show activity
        if (Math.random() > 0.7) {
          const byteOut = Math.floor(Math.random() * 3000 + 500);
          const byteIn = Math.floor(Math.random() * 18000 + 2000);
          
          const inLog = {
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            type: 'in' as const,
            text: `<- [SOCKS5] Forwarded ${byteIn.toLocaleString()} bytes from VPS (${vpsIp}) to client`
          };
          const outLog = {
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            type: 'out' as const,
            text: `-> [SOCKS5] Tunneled ${byteOut.toLocaleString()} bytes of client payload (spoofed SNI: ${spoofedHost})`
          };
          setLogs((prev) => [...prev, outLog, inLog]);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectionStatus, vpsIp, spoofedHost]);

  // Autoscroll for terminal logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Autoscroll for test request logs
  useEffect(() => {
    if (testLogsEndRef.current) {
      testLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [testLogs]);

  // Autoscroll for SNI tester logs
  useEffect(() => {
    if (sniLogsEndRef.current) {
      sniLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sniTestLogs]);

  // Real-time network status listeners
  useEffect(() => {
    const handleOnline = () => setNetworkInfo((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkInfo((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Backend health checker
  useEffect(() => {
    if (!useRealBackend) {
      setBackendStatus('unknown');
      return;
    }

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${backendUrl}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [useRealBackend, backendUrl]);

  // Fetch public IP info (real data from ipapi.co)
  useEffect(() => {
    const fetchIpInfo = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setNetworkInfo((prev) => ({
          ...prev,
          publicIp: data.ip,
          city: data.city,
          country: data.country_name,
          org: data.org,
        }));
      } catch {
        // ignore public IP fetch errors
      }
    };

    fetchIpInfo();
  }, []);

  // Periodic latency measurement to a public endpoint
  useEffect(() => {
    const measureLatency = async () => {
      if (!navigator.onLine) return;
      const start = performance.now();
      try {
        await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
        });
        const latency = Math.round(performance.now() - start);
        setNetworkInfo((prev) => ({ ...prev, latencyMs: latency }));
      } catch {
        setNetworkInfo((prev) => ({ ...prev, latencyMs: undefined }));
      }
    };

    measureLatency();
    const interval = setInterval(measureLatency, 5000);
    return () => clearInterval(interval);
  }, []);

  // Copy to clipboard helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'success');
  };

  // Start connection simulator
  const handleStartTunnel = () => {
    if (connectionStatus === 'connected') {
      // Disconnect
      setConnectionStatus('disconnected');
      setUptime(0);
      setTrafficStats({
        dlSpeed: 0,
        ulSpeed: 0,
        totalDl: 0,
        totalUl: 0,
        ping: 0,
        savedCost: 0,
      });
      setSpeedHistory(Array(30).fill(0));
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'warning',
          text: `[!] SonicTunnel stopped. Listening sockets closed. Local Port ${localPort} freed.`
        }
      ]);
      addToast('Tunnel stopped', 'info');
      return;
    }

    setConnectionStatus('connecting');
    setLogs([
      {
        id: '1',
        time: new Date().toLocaleTimeString(),
        type: 'info',
        text: `[*] SonicTunnel core initialized (v4.2.8-Badass). SOCKS5 Interface ready.`
      },
      {
        id: '2',
        time: new Date().toLocaleTimeString(),
        type: 'info',
        text: `[*] Binding TCP socket on 127.0.0.1:${localPort}...`
      },
      {
        id: '3',
        time: new Date().toLocaleTimeString(),
        type: 'success',
        text: `[+] Success: SOCKS5 local proxy listening on 127.0.0.1:${localPort}`
      },
      {
        id: '4',
        time: new Date().toLocaleTimeString(),
        type: 'info',
        text: `[*] Incoming traffic will be spoofed using Host: '${spoofedHost}'`
      }
    ]);

    // Step 1: Remote Connect simulation (1.2s)
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: '5',
          time: new Date().toLocaleTimeString(),
          type: 'info',
          text: `[~] Intercepted client TCP request. Establishing handshake with remote server ${vpsIp}:${vpsPort}...`
        }
      ]);

      // Step 2: Inject payload (2.2s)
      setTimeout(() => {
        const compiled = getCompiledPayload(payloadText, spoofedHost, vpsPort);
        setLogs((prev) => [
          ...prev,
          {
            id: '6',
            time: new Date().toLocaleTimeString(),
            type: 'warning',
            text: `[+] PREPENDING BYPASS PAYLOAD (Injecting SNI / HTTP Spoof Host Header):`
          },
          {
            id: '7',
            time: new Date().toLocaleTimeString(),
            type: 'in',
            text: compiled
          },
          {
            id: '8',
            time: new Date().toLocaleTimeString(),
            type: 'info',
            text: `[*] Transmitting spoofed request sequence (Bytes sent: ${compiled.length})...`
          }
        ]);

        // Step 3: DPI Firewall scan simulation (3.4s)
        setTimeout(() => {
          setLogs((prev) => [
            ...prev,
            {
              id: '9',
              time: new Date().toLocaleTimeString(),
              type: 'info',
              text: `[DPI] Carrier Deep Packet Inspection (DPI) sniffing stream signature...`
            },
            {
              id: '10',
              time: new Date().toLocaleTimeString(),
              type: 'success',
              text: `[DPI Bypass] Success! Found whitelisted host pattern: "${spoofedHost}"`
            },
            {
              id: '11',
              time: new Date().toLocaleTimeString(),
              type: 'success',
              text: `[DPI Bypass] Billing filter tricked: Traffic categorized as ZERO-RATED (Free Portal).`
            }
          ]);

          // Step 4: Final VPS Handshake & connection established (4.5s)
          setTimeout(() => {
            setLogs((prev) => [
              ...prev,
              {
                id: '12',
                time: new Date().toLocaleTimeString(),
                type: 'info',
                text: `[+] VPS at ${vpsIp}:${vpsPort} resolved payload, forwarded stream to destination.`
              },
              {
                id: '13',
                time: new Date().toLocaleTimeString(),
                type: 'success',
                text: `[+] TUNNEL ESTABLISHED! SOCKS5 Sockets linked. Free Internet active.`
              }
            ]);
            setConnectionStatus('connected');
            addToast('SonicTunnel Connected!', 'success');
          }, 1100);

        }, 1200);

      }, 1000);

    }, 800);
  };

  // Host Checker Tool - Real Data
  const handleHostCheck = async () => {
    if (!hostCheckInput.trim()) {
      addToast('Please enter a host to check', 'error');
      return;
    }

    setCheckStatus('checking');
    setCheckLogs([
      `[*] Checking host: ${hostCheckInput}`,
      `[*] Mode: ${useRealBackend && backendStatus === 'online' ? 'REAL-TIME (backend API)' : 'BROWSER-LIMITED (no backend)'}`,
    ]);
    setCheckMetrics(null);

    if (useRealBackend && backendStatus === 'online') {
      try {
        setCheckLogs((prev) => [...prev, `[~] Calling backend API: ${backendUrl}/api/check-host`]);
        const res = await fetch(`${backendUrl}/api/check-host`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host: hostCheckInput, port: 80, protocol: 'http' }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Backend check failed');
        }

        const data = await res.json();

        setCheckLogs((prev) => [
          ...prev,
          `[+] DNS resolved ${data.host} to ${data.ip} (family IPv${data.family}) in ${data.dnsTime}ms`,
          `[+] TCP/HTTP probe completed in ${data.responseTime}ms`,
          `[>] GET / HTTP/1.1`,
          `[>] Host: ${data.host}`,
          `[>] User-Agent: Mozilla/5.0 (Android; Mobile)`,
          `[<] HTTP/1.1 ${data.statusCode} ${data.statusMessage}`,
          `[<] Server: ${data.headers?.server || 'Unknown'}`,
          `[<] Location: ${data.headers?.location || 'None'}`,
          data.isVulnerable
            ? `[+] ANALYSIS: Host matches zero-rating patterns (redirect/portal/whitelisted domain).`
            : `[-] ANALYSIS: No zero-rating indicators detected in real response headers.`,
        ]);

        setCheckMetrics({
          status: data.statusCode,
          statusText: data.statusMessage || 'OK',
          responseTime: data.responseTime,
          isVulnerable: data.isVulnerable,
          server: data.headers?.server || 'Unknown',
          payloadSuggestion: data.isVulnerable
            ? `CONNECT [host]:[port] HTTP/1.1\\r\\nHost: ${hostCheckInput}\\r\\nX-Online-Host: ${hostCheckInput}\\r\\n\\r\\n`
            : `CONNECT [host]:[port] HTTP/1.1\\r\\nHost: [host]\\r\\nProxy-Authorization: Basic [token]\\r\\n\\r\\n`,
        });
        setCheckStatus('success');
        addToast(data.isVulnerable ? 'Vulnerable Host Bug Found!' : 'Host checked with real data', data.isVulnerable ? 'success' : 'info');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setCheckLogs((prev) => [...prev, `[-] REAL BACKEND ERROR: ${message}`]);
        setCheckStatus('failed');
        addToast('Host check failed', 'error');
      }
      return;
    }

    // Browser-limited fallback: we can only probe reachability via fetch(no-cors)
    setCheckLogs((prev) => [
      ...prev,
      `[!] Backend offline/unconfigured. Browser security blocks raw socket & header inspection.`,
      `[~] Attempting browser fetch probe (opaque response, status hidden by CORS)...`,
    ]);

    try {
      const start = performance.now();
      await fetch(`https://${hostCheckInput}/`, { mode: 'no-cors', cache: 'no-store' });
      const responseTime = Math.round(performance.now() - start);

      setCheckLogs((prev) => [
        ...prev,
        `[+] Network reachability confirmed in ${responseTime}ms (HTTPS handshake succeeded).`,
        `[i] Browser CORS policy hides exact status/headers. Start the backend for full inspection.`,
      ]);

      setCheckMetrics({
        status: 0,
        statusText: 'Reachable (CORS-opaque)',
        responseTime,
        isVulnerable: false,
        server: 'Unknown (CORS hidden)',
        payloadSuggestion: `CONNECT [host]:[port] HTTP/1.1\\r\\nHost: ${hostCheckInput}\\r\\nX-Online-Host: ${hostCheckInput}\\r\\n\\r\\n`,
      });
      setCheckStatus('success');
      addToast('Host reachable (limited browser probe)', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCheckLogs((prev) => [
        ...prev,
        `[-] Browser probe failed: ${message}`,
        `[-] To read real response headers, start the backend: npx tsx server.ts`,
      ]);
      setCheckStatus('failed');
      addToast('Host unreachable from browser', 'error');
    }
  };

  // Port Scanner Tool - Real Data (requires backend)
  const handlePortScan = async () => {
    if (!scanHost.trim()) {
      addToast('Please enter a host or IP to scan', 'error');
      return;
    }

    if (!useRealBackend || backendStatus !== 'online') {
      addToast('Real port scanning requires the SonicTunnel backend', 'error');
      setPortsList((prev) =>
        prev.map((p) => ({ ...p, status: 'idle' }))
      );
      return;
    }

    setScanStatus('scanning');
    addToast('Starting real TCP port scan...', 'info');

    // Reset port statuses
    setPortsList((prev) => prev.map((p) => ({ ...p, status: 'filtering' })));

    try {
      const res = await fetch(`${backendUrl}/api/scan-ports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: scanHost,
          ports: portsList.map((p) => p.port),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Backend scan failed');
      }

      const data = await res.json();

      setPortsList((prev) =>
        prev.map((item) => {
          const found = data.results.find((r: { port: number; status: string }) => r.port === item.port);
          return found ? { ...item, status: found.status as 'open' | 'closed' | 'filtering' | 'idle' } : item;
        })
      );

      setScanStatus('completed');
      addToast(`Real port scan completed for ${data.resolvedIp || scanHost}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(`Port scan failed: ${message}`, 'error');
      setPortsList((prev) => prev.map((p) => ({ ...p, status: 'idle' })));
      setScanStatus('idle');
    }
  };

  // IP Hunter Tool Simulator
  const handleIPHunter = () => {
    setIsHunting(true);
    setHunterLogs([
      `[*] Initiating IP Hunter for carrier: ${hunterCarrier}`,
      `[*] Checking local radio network state...`,
      `[i] Cellular APN: internet.carrier.com`,
      `[i] Tunnel apps usually require a specific local IP subnet (e.g. 10.x.x.x or 100.x.x.x)`,
    ]);
    setMatchedIp(null);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const simulatedLocalIp = `10.124.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
      
      setHunterLogs((prev) => [
        ...prev,
        `[~] Toggling Mobile Data (Simulated Airplane Mode cycle)...`,
        `[+] New IP Lease acquired: ${simulatedLocalIp}`,
      ]);

      // Check if it matches the carrier target range
      const isTargetRange = Math.random() > 0.75 || step >= 5;

      if (isTargetRange) {
        clearInterval(interval);
        const targetIp = `10.124.${Math.floor(Math.random() * 10) + 40}.${Math.floor(Math.random() * 254)}`;
        setHunterLogs((prev) => [
          ...prev,
          `[+] New IP Lease acquired: ${targetIp}`,
          `[MATCH] Target IP Subnet Found! Carrier Firewall Zero-Rated Bracket is active on subnet: ${targetIp.split('.').slice(0, 3).join('.')}.x`,
          `[success] You can now start the SOCKS5 HTTP Injector tunnel safely without leaking data.`,
        ]);
        setMatchedIp(targetIp);
        setIsHunting(false);
        addToast('IP Hunter Match Found!', 'success');
      } else if (step >= 8) {
        clearInterval(interval);
        setIsHunting(false);
        setHunterLogs((prev) => [
          ...prev,
          `[-] Timeout reached. Try checking your APN settings or using a different Radio band.`,
        ]);
        addToast('IP Hunter search timed out', 'error');
      }
    }, 1000);
  };

  // SNI Mismatch Inspector - Real Data (requires backend)
  const handleSniInspectionTest = async () => {
    if (!sniTestIp.trim() || !sniTestHost.trim()) {
      addToast('Please fill in Target IP and Spoofed SNI fields', 'error');
      return;
    }

    if (!useRealBackend || backendStatus !== 'online') {
      addToast('Real SNI testing requires the SonicTunnel backend', 'error');
      setSniTestLogs([
        `[!] SNI Mismatch testing requires raw TCP/TLS socket access.`,
        `[!] Browser security policy blocks this operation.`,
        `[i] Start the backend server to run real SNI audits: npx tsx server.ts`,
      ]);
      setSniTestStatus('failed');
      return;
    }

    setSniTestStatus('testing');
    setSniMetrics(null);
    setSniTestLogs([
      `[*] Firing up diagnostic connection to ${sniTestIp}:${sniTestPort}`,
      `[*] Injecting SNI Hostname: ${sniTestHost}`,
      `[~] Calling backend API: ${backendUrl}/api/sni-test`,
    ]);

    try {
      const res = await fetch(`${backendUrl}/api/sni-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIp: sniTestIp,
          targetPort: sniTestPort,
          spoofedSni: sniTestHost,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Backend SNI test failed');
      }

      const data = await res.json();

      setSniTestLogs((prev) => [
        ...prev,
        `[+] Backend executed real TLS handshake in ${data.responseTime}ms`,
        data.success
          ? `[+] TLS Handshake successful!`
          : `[-] TLS Handshake failed: ${data.error}`,
        data.success && `[+] Cipher used: ${data.cipher} (${data.protocol})`,
        data.success && `[+] Certificate subject: ${data.subject || 'N/A'}`,
        data.success
          ? `[success] AUDIT VERDICT: VULNERABLE! The carrier's DPI firewall allowed a mismatched SNI (${sniTestHost}) to reach ${sniTestIp}.`
          : `[-] AUDIT VERDICT: PROTECTED. The firewall blocked or reset the mismatched SNI ClientHello.`,
      ].filter(Boolean) as string[]);

      setSniMetrics({
        handshakeSuccessful: data.success,
        cipher: data.cipher || 'None',
        isVulnerable: data.success,
        firewallAction: data.success
          ? 'Bypassed (SNI whitelist accepted)'
          : `Blocked / ${data.error || 'Handshake rejected'}`,
      });
      setSniTestStatus(data.success ? 'success' : 'failed');
      addToast(data.success ? 'SNI Handshake Bypassed Firewall!' : 'SNI Handshake blocked by Firewall', data.success ? 'success' : 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSniTestLogs((prev) => [...prev, `[-] REAL BACKEND ERROR: ${message}`]);
      setSniTestStatus('failed');
      addToast('SNI test failed', 'error');
    }
  };

  // Test Request Simulation inside Modal
  const runTestRequest = () => {
    setTestProgress('initiating');
    setTestLogs([
      `[*] Initiating HTTP handshake sequence to: ${testUrl}`,
      `[*] Routing through Local SOCKS5 proxy (127.0.0.1:${localPort})`,
    ]);

    setTimeout(() => {
      setTestProgress('payload');
      const compiled = getCompiledPayload(payloadText, spoofedHost, vpsPort);
      setTestLogs((prev) => [
        ...prev,
        `[SOCKS5] Local client intercepted. Prepending Bypass Payload:`,
        `===========================================`,
        compiled,
        `===========================================`,
        `[*] Forwarding payload bytes down the ISP channel...`,
      ]);

      setTimeout(() => {
        setTestProgress('dpi_check');
        setTestLogs((prev) => [
          ...prev,
          `[DPI Router] Inspecting SNI / Host Headers...`,
          `[DPI Router] SNI field match: '${spoofedHost}'`,
          `[DPI Router] Bypass verdict: APPROVED (Zero-Rated Data).`,
          `[*] Forwarding packet to Destination Server IP...`,
        ]);

        setTimeout(() => {
          setTestProgress('vps_forward');
          setTestLogs((prev) => [
            ...prev,
            `[VPS ${vpsIp}] Socket connection accepted from SOCKS5 injector.`,
            `[VPS ${vpsIp}] Resolving DNS for target: ${testUrl}`,
            `[VPS ${vpsIp}] Fetching target web index...`,
          ]);

          setTimeout(() => {
            setTestProgress('completed');
            setTestLogs((prev) => [
              ...prev,
              `[+] Connection established with target server!`,
              `[+] Target Server Response: HTTP/1.1 200 OK`,
              `[+] Content-Type: text/html; charset=UTF-8`,
              `[+] Data Length: 48,291 bytes`,
              `[success] Visual test successfully completed! Header injection worked and bypassed the ISP filter!`,
            ]);
            addToast('Test request successful!', 'success');
          }, 1500);

        }, 1200);

      }, 1000);

    }, 800);
  };

  // Exporter Code Templates
  const getPythonCode = () => {
    return `import socket
import select
import threading

# Configuration generated by SonicTunnel Suite
LOCAL_PORT = ${localPort} # tun2socks forwards traffic here
VPS_IP = "${vpsIp}" # Your remote uncensored VPS server
VPS_PORT = ${vpsPort} 
SPOOFED_HOST = "${spoofedHost}" # Zero-rated bug host

def handle_connection(client_socket):
    try:
        # Connect to your actual uncensored server
        remote_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        remote_socket.connect((VPS_IP, VPS_PORT))
        
        # ---------------------------------------------------------
        # THE KILLER PAYLOAD: 
        # Prepend fake SNI / Host headers to trick Carrier's DPI
        # ---------------------------------------------------------
        injection_payload = (
            ${payloadText.split('\\r\\n').map((line, idx, arr) => {
              const parsedLine = line.replace(/\[host\]/g, spoofedHost).replace(/\[port\]/g, String(vpsPort)).replace(/\[protocol\]/g, 'HTTP/1.1');
              // Append \r\n to each except we handle last lines
              const suffix = idx === arr.length - 1 ? '' : '\\r\\n';
              return `f"${parsedLine}${suffix}"`;
            }).filter(Boolean).join('\n            ')}
        )
        
        # Send payload down the ISP channel
        remote_socket.send(injection_payload.encode())
        
        # Blindly forward the encrypted data stream back and forth
        sockets = [client_socket, remote_socket]
        while True:
            read_sockets, _, error_sockets = select.select(sockets, [], sockets)
            if error_sockets:
                break
                
            for sock in read_sockets:
                data = sock.recv(8192)
                if not data:
                    return # Connection closed
                
                if sock is client_socket:
                    remote_socket.send(data)
                else:
                    client_socket.send(data)
                    
    except Exception as e:
        print(f"[!] Tunnel collapsed: {e}")
    finally:
        client_socket.close()

def start_injector():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(("127.0.0.1", LOCAL_PORT))
    server.listen(100)
    print(f"[*] SonicTunnel Active on 127.0.0.1:{LOCAL_PORT}")
    print(f"[*] Spoofing Host: {SPOOFED_HOST}")
    
    while True:
        client, addr = server.accept()
        threading.Thread(target=handle_connection, args=(client,)).start()

if __name__ == "__main__":
    start_injector()`;
  };

  const getGoCode = () => {
    return `package main

import (
	"fmt"
	"io"
	"net"
	"os"
)

// Configuration generated by SonicTunnel Suite
const (
	LocalPort   = ":${localPort}"
	VpsAddr     = "${vpsIp}:${vpsPort}"
	SpoofHost   = "${spoofedHost}"
)

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1"+LocalPort)
	if err != nil {
		fmt.Printf("[-] Failed to bind local port: %v\\n", err)
		os.Exit(1)
	}
	defer listener.Close()

	fmt.Printf("[*] SonicTunnel Go Engine active on 127.0.0.1%s\\n", LocalPort)
	fmt.Printf("[*] Injecting spoofed SNI: %s\\n", SpoofHost)

	for {
		clientConn, err := listener.Accept()
		if err != nil {
			fmt.Printf("[-] Connection accept error: %v\\n", err)
			continue
		}
		go handleConnection(clientConn)
	}
}

func handleConnection(clientConn net.Conn) {
	defer clientConn.Close()

	// Connect to remote VPS
	vpsConn, err := net.Dial("tcp", VpsAddr)
	if err != nil {
		fmt.Printf("[-] Failed to connect to VPS: %v\\n", err)
		return
	}
	defer vpsConn.Close()

	// Compile & write payload
	payload := "CONNECT " + SpoofHost + ":443 HTTP/1.1\\r\\n" +
		"Host: " + SpoofHost + "\\r\\n" +
		"X-Online-Host: " + SpoofHost + "\\r\\n" +
		"X-Forward-Host: " + SpoofHost + "\\r\\n" +
		"Connection: Keep-Alive\\r\\n\\r\\n"

	_, err = vpsConn.Write([]byte(payload))
	if err != nil {
		fmt.Printf("[-] Injection write error: %v\\n", err)
		return
	}

	// Double directional copy
	chanClientToVps := make(chan error, 1)
	chanVpsToClient := make(chan error, 1)

	go func() {
		_, err := io.Copy(vpsConn, clientConn)
		chanClientToVps <- err
	}()

	go func() {
		_, err := io.Copy(clientConn, vpsConn)
		chanVpsToClient <- err
	}()

	select {
	case <-chanClientToVps:
	case <-chanVpsToClient:
	}
}`;
  };

  const getRustCode = () => {
    return `use std::net::{TcpListener, TcpStream};
use std::thread;
use std::io::{Read, Write};

const LOCAL_PORT: &str = "127.0.0.1:${localPort}";
const VPS_ADDR: &str = "${vpsIp}:${vpsPort}";
const SPOOF_HOST: &str = "${spoofedHost}";

fn handle_client(mut client_stream: TcpStream) -> std::io::Result<()> {
    let mut vps_stream = TcpStream::connect(VPS_ADDR)?;

    // Construct Payload
    let payload = format!(
        "CONNECT {}:443 HTTP/1.1\\r\\n\\
         Host: {}\\r\\n\\
         X-Online-Host: {}\\r\\n\\
         Connection: Keep-Alive\\r\\n\\r\\n",
        SPOOF_HOST, SPOOF_HOST, SPOOF_HOST
    );

    vps_stream.write_all(payload.as_bytes())?;

    let mut client_clone = client_stream.try_clone()?;
    let mut vps_clone = vps_stream.try_clone()?;

    // Thread for forwarding client -> vps
    let handle1 = thread::spawn(move || {
        let mut buffer = [0; 8192];
        while let Ok(n) = client_clone.read(&mut buffer) {
            if n == 0 { break; }
            if vps_clone.write_all(&buffer[..n]).is_err() { break; }
        }
    });

    // Thread for forwarding vps -> client
    let handle2 = thread::spawn(move || {
        let mut buffer = [0; 8192];
        while let Ok(n) = vps_stream.read(&mut buffer) {
            if n == 0 { break; }
            if client_stream.write_all(&buffer[..n]).is_err() { break; }
        }
    });

    let _ = handle1.join();
    let _ = handle2.join();
    Ok(())
}

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind(LOCAL_PORT)?;
    println!("[*] SonicTunnel Rust Engine listening on {}", LOCAL_PORT);

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(|| {
                    let _ = handle_client(stream);
                });
            }
            Err(e) => {
                eprintln!("[-] Connection failed: {}", e);
            }
        }
    }
    Ok(())
}`;
  };

  const getTermuxScript = () => {
    return `# Setup SonicTunnel in Android Termux (No Root Required!)
# -----------------------------------------------------
# 1. Update Termux repositories
pkg update -y && pkg upgrade -y

# 2. Install Python & dependencies
pkg install python -y

# 3. Create tunnel script
cat << 'EOF' > sonictunnel.py
${getPythonCode()}
EOF

# 4. Create run helper
cat << 'EOF' > start.sh
#!/bin/bash
echo "=== Starting SonicTunnel SOCKS5 Proxy ==="
echo "Point your Android SOCKS5 proxy to:"
echo "IP: 127.0.0.1"
echo "Port: ${localPort}"
echo "----------------------------------------"
python sonictunnel.py
EOF

chmod +x start.sh
echo "[+] Setup complete! Start the tunnel by running: ./start.sh"`;
  };

  // Dynamically parameterize the user's test_sni_inspection Python script
  const getSniInspectionScript = () => {
    return `import socket
import ssl

# Dynamic configuration based on SonicTunnel Diagnostics
TEST_SERVER_IP = "${sniTestIp}" # Target IP for firewall testing
TEST_SERVER_PORT = ${sniTestPort} # Destination Port (usually 443)
FAKE_SNI = "${sniTestHost}" # Mismatched whitelisted SNI to inject

def test_sni_inspection(target_ip, target_port, spoofed_sni):
    print(f"[*] Firing up diagnostic connection to {target_ip}:{target_port}")
    print(f"[*] Injecting SNI Hostname: {spoofed_sni}")
    
    # Create a standard TCP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    
    # Create an SSL context. We disable certificate verification 
    # because we are intentionally creating a mismatch for testing.
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    
    try:
        # Connect the raw socket first
        sock.connect((target_ip, target_port))
        
        # Wrap the socket in TLS and inject the specific SNI
        # server_hostname is what gets sent in the ClientHello packet
        secure_sock = context.wrap_socket(sock, server_hostname=spoofed_sni)
        
        print("[+] TLS Handshake successful!")
        print(f"[+] The firewall let the mismatched SNI ({spoofed_sni}) through to {target_ip}.")
        print(f"[+] Cipher used: {secure_sock.cipher()[0]}")
        
        secure_sock.close()
        
    except ssl.SSLError as e:
        print(f"[-] TLS Error: {e}")
        print("[-] The firewall likely intercepted and killed the connection due to SNI mismatch.")
    except socket.timeout:
        print("[-] Connection timed out. The firewall blackholed the packets.")
    except Exception as e:
        print(f"[!] Connection failed: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_sni_inspection(TEST_SERVER_IP, TEST_SERVER_PORT, FAKE_SNI)`;
  };

  const activePayloadExplanation = useMemo(() => {
    const raw = payloadText;
    const explanations: Array<{ part: string; meaning: string }> = [];
    
    if (raw.includes('CONNECT')) {
      explanations.push({
        part: 'CONNECT [host]:[port] HTTP/1.1',
        meaning: 'TCP Handshake Tunnel Method. Tells the carrier proxy to open a direct, transparent TCP channel to the destination.'
      });
    }
    if (raw.includes('Host:')) {
      explanations.push({
        part: 'Host: [host]',
        meaning: 'Standard HTTP Host header. This is the PRIMARY field inspected by the ISP firewall. We swap it with the zero-rated domain to trick the firewall billing logs.'
      });
    }
    if (raw.includes('X-Online-Host')) {
      explanations.push({
        part: 'X-Online-Host: [host]',
        meaning: 'Squid/Proxy-specific header. Some transparent ISP proxies check this header to categorize traffic. Keeping it zero-rated ensures the proxy forwards the packet for free.'
      });
    }
    if (raw.includes('X-Forward-Host')) {
      explanations.push({
        part: 'X-Forward-Host: [host]',
        meaning: 'Used to specify the original host requested. Helps bypass deeper nested carrier verification nodes.'
      });
    }
    if (raw.includes('Connection: Keep-Alive')) {
      explanations.push({
        part: 'Connection: Keep-Alive',
        meaning: 'Keeps the TCP socket alive so the injector can tunnel continuous streams without repeating the handshake payload.'
      });
    }
    if (raw.includes('\\r\\n\\r\\n')) {
      explanations.push({
        part: '\\r\\n\\r\\n',
        meaning: 'Double Carriage Return Line Feed (CRLF). In HTTP protocols, this denotes the end of headers, forcing the proxy server to process the connection.'
      });
    }

    return explanations;
  }, [payloadText]);

  // Filter logs by search
  const filteredLogs = logs.filter((l) =>
    l.text.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.type.toLowerCase().includes(logSearch.toLowerCase())
  );

  const getSelectedCode = () => {
    if (selectedExporter === 'python') return getPythonCode();
    if (selectedExporter === 'go') return getGoCode();
    if (selectedExporter === 'rust') return getRustCode();
    if (selectedExporter === 'termux') return getTermuxScript();
    return getSniInspectionScript();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500/30">
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-slide-in transition-all duration-300 ${
              t.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : t.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/90 border-slate-700/50 text-sky-300'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Banner / Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Shield className="w-5.5 h-5.5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  SONICTUNNEL
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800/50 rounded-sm px-1 py-0.5">
                  v4.2.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">DPI Bypass & Header Injection Suite</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              INJECTOR MONITOR
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'tools'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              DIAGNOSTIC TOOLS
            </button>
            <button
              onClick={() => setActiveTab('exporter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'exporter'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              CODE EXPORTER
            </button>
            <button
              onClick={() => setActiveTab('academy')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'academy'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              DPI ACADEMY
            </button>
          </nav>

          {/* Quick Connection Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-mono text-slate-500">NETWORK</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${networkInfo.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-slate-300">
                  {networkInfo.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                {networkInfo.latencyMs && (
                  <span className="text-[10px] font-mono text-cyan-400 ml-1">{networkInfo.latencyMs}ms</span>
                )}
              </div>
              {networkInfo.publicIp && (
                <span className="text-[9px] font-mono text-slate-500">
                  {networkInfo.publicIp} {networkInfo.country ? `• ${networkInfo.country}` : ''}
                </span>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-mono text-slate-500">CORE STATUS</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-slate-300">
                  {connectionStatus === 'connected' ? `Active (${Math.floor(uptime / 60)}m ${uptime % 60}s)` : connectionStatus === 'connecting' ? 'Injecting...' : 'Offline'}
                </span>
              </div>
              {useRealBackend && (
                <span className={`text-[9px] font-mono ${backendStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Backend: {backendStatus.toUpperCase()}
                </span>
              )}
            </div>
            
            <button
              onClick={handleStartTunnel}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all shadow-md active:scale-95 ${
                connectionStatus === 'connected'
                  ? 'bg-rose-500 hover:bg-rose-600 text-slate-950 shadow-rose-500/20'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-slate-950" /> STOP INJECTOR
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ESTABLISHING...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" /> START INJECTOR
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800/80 p-2 flex justify-around sticky top-16 z-20">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Activity className="w-4 h-4" />
          MONITOR
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activeTab === 'tools' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Network className="w-4 h-4" />
          DIAGNOSTIC
        </button>
        <button
          onClick={() => setActiveTab('exporter')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activeTab === 'exporter' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Code className="w-4 h-4" />
          EXPORTER
        </button>
        <button
          onClick={() => setActiveTab('academy')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activeTab === 'academy' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <BookOpen className="w-4 h-4" />
          ACADEMY
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* TAB 1: DASHBOARD / INJECTOR MONITOR */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand: Config Panel & Payload Builder (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Configuration Panel */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <h2 className="font-bold text-sm text-slate-200 tracking-wider font-mono">CONNECTION TUNER</h2>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-500/80 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/30">
                    SOCKS5 CLIENT MODE
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Preset Selector */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">1. CARRIER BYPASS PRESETS</label>
                    <select
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-medium"
                    >
                      <option value="tmobile">T-Mobile US (Zero-Rated SNI: free.t-mobile.com)</option>
                      <option value="vodafone">Vodafone EU Social (Split Connect: m.facebook.com)</option>
                      <option value="jio">Jio India Chat Pack (SSL/TLS SNI: support.jio.com)</option>
                      <option value="orange">Orange Africa/EU (Zero-Rated SNI: pass.orange.ci)</option>
                      <option value="africell">Africell West Africa (Zero-Rated SNI: portal.africell.gm)</option>
                      <option value="qcell">QCell Gambia/Sierra Leone (Zero-Rated SNI: portal.qcell.sl)</option>
                      <option value="custom">Custom Configuration (Manual Tuning)</option>
                    </select>
                  </div>

                  {/* Remote VPS IP & Port */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">2. VPS SERVER IP</label>
                      <input
                        type="text"
                        value={vpsIp}
                        onChange={(e) => setVpsIp(e.target.value)}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                        placeholder="198.51.100.45"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">VPS PORT</label>
                      <input
                        type="number"
                        value={vpsPort}
                        onChange={(e) => setVpsPort(Number(e.target.value))}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                        placeholder="443"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Local Socks Port & Spoofed Host */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">LOCAL PORT</label>
                      <input
                        type="number"
                        value={localPort}
                        onChange={(e) => setLocalPort(Number(e.target.value))}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                        placeholder="1080"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">SPOOFED HOST (BUG HOST)</label>
                      <input
                        type="text"
                        value={spoofedHost}
                        onChange={(e) => setSpoofedHost(e.target.value)}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                        placeholder="free.t-mobile.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-mono text-cyan-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Tunnel Mode */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">3. BYPASS TECHNIQUE</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTunnelMode('payload')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                          tunnelMode === 'payload'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Header Inject
                      </button>
                      <button
                        onClick={() => setTunnelMode('sni')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                          tunnelMode === 'sni'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        SNI Spoofing
                      </button>
                      <button
                        onClick={() => setTunnelMode('direct')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                          tunnelMode === 'direct'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Direct Tunnel
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Payload Builder Section */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm text-slate-200 tracking-wider font-mono">PAYLOAD INJECTOR BUILDER</h2>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-950/40 px-2 py-0.5 rounded">
                    RAW BYTE CONSTRUCT
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">INJECTOR PATTERN TEMPLATE:</span>
                    <button 
                      onClick={() => handleCopyText(payloadText, 'Payload template')} 
                      className="text-slate-400 hover:text-white transition"
                      title="Copy payload template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition font-mono leading-relaxed resize-none"
                    placeholder="Enter payload string here..."
                  />

                  {/* Payload tags helper */}
                  <div>
                    <span className="block text-[10px] font-mono font-bold text-slate-400 mb-2">QUICK TAGS (CLICK TO INSERT):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['[host]', '[port]', '[protocol]', '[method]', '\\r', '\\n', '[cr]', '[lf]', 'Connection: Keep-Alive\\r\\n'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertPayloadTag(tag)}
                          disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                          className="bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] font-mono px-2 py-1 rounded transition"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Payload Translation Explainer */}
                  <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
                      <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Payload Mechanics Translation:</span>
                    </div>
                    {activePayloadExplanation.length === 0 ? (
                      <p className="text-[10px] text-slate-500 font-mono italic">No recognized injection elements found. Write standard HTTP headers to begin translation.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {activePayloadExplanation.map((exp, i) => (
                          <div key={i} className="text-[10px] font-mono leading-relaxed border-l-2 border-cyan-500/40 pl-2">
                            <span className="text-cyan-400 font-bold">{exp.part}</span>: <span className="text-slate-400">{exp.meaning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Backend Configuration Panel */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <h2 className="font-bold text-sm text-slate-200 tracking-wider font-mono">REAL DATA BACKEND</h2>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    useRealBackend && backendStatus === 'online'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/30'
                      : 'bg-amber-950/60 text-amber-400 border-amber-800/30'
                  }`}>
                    {useRealBackend && backendStatus === 'online' ? 'LIVE MODE' : 'SIMULATION MODE'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">Use Real-Time Backend API</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Required for real port scans & SNI tests
                      </span>
                    </div>
                    <button
                      onClick={() => setUseRealBackend((prev) => !prev)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        useRealBackend ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        useRealBackend ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">BACKEND API URL</label>
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="http://localhost:3001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-1">
                    <span className="font-bold text-slate-300 block">💡 How to enable real data:</span>
                    <p>1. Start the backend in a terminal:</p>
                    <code className="block bg-slate-900 p-2 rounded text-cyan-400 font-mono text-[10px] mt-1">npx tsx server.ts</code>
                    <p className="mt-1">2. Toggle "Use Real-Time Backend API" above.</p>
                    <p>3. Port Scanner and SNI Auditor will then use real TCP/TLS sockets.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Hand: Tunnel Map, Graphs, Terminal Output (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Animated Tunnel Flow Map */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm relative">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <h2 className="font-bold text-sm text-slate-200 tracking-wider font-mono">LIVE TUNNEL DIAGRAM</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {connectionStatus === 'connected' && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-450">
                      {connectionStatus === 'connected' ? 'STREAM ACTIVE' : 'TUNNEL IDLE'}
                    </span>
                  </div>
                </div>

                {/* Animated Interactive Networking SVG */}
                <div className="bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-44 border border-slate-900">
                  
                  {/* Network Map Links and Nodes */}
                  <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 py-2">
                    
                    {/* Node 1: Client App */}
                    <div className="flex flex-col items-center text-center w-24">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        connectionStatus === 'connected'
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">Client Device</span>
                      <span className="text-[9px] font-mono text-slate-500">localhost:{localPort}</span>
                    </div>

                    {/* Arrow/Line 1 */}
                    <div className="flex-1 flex flex-col items-center w-full max-w-[40px] md:max-w-none">
                      <div className="h-1 md:h-0.5 w-0.5 md:w-full bg-slate-800 relative">
                        {connectionStatus === 'connected' && (
                          <div className="absolute top-0 left-0 w-full h-full bg-cyan-400 animate-[dash_1.5s_linear_infinite]" />
                        )}
                      </div>
                    </div>

                    {/* Node 2: SonicTunnel Core */}
                    <div className="flex flex-col items-center text-center w-28">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        connectionStatus === 'connected'
                          ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                          : connectionStatus === 'connecting'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Cpu className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">SonicTunnel Core</span>
                      <span className="text-[9px] font-mono text-slate-500">Local Injector</span>
                    </div>

                    {/* Arrow/Line 2 */}
                    <div className="flex-1 flex flex-col items-center w-full max-w-[40px] md:max-w-none">
                      <div className="h-1 md:h-0.5 w-0.5 md:w-full bg-slate-800 relative">
                        {connectionStatus === 'connected' && (
                          <div className="absolute top-0 left-0 w-full h-full bg-teal-400 animate-[dash_1.5s_linear_infinite_reverse]" />
                        )}
                      </div>
                    </div>

                    {/* Node 3: Carrier DPI Firewall */}
                    <div className="flex flex-col items-center text-center w-28 relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        connectionStatus === 'connected'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : connectionStatus === 'connecting'
                          ? 'bg-amber-500/10 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">ISP DPI Firewall</span>
                      {connectionStatus === 'connected' ? (
                        <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1 py-0.5 rounded mt-1">
                          TRICKED (Zero-Rated)
                        </span>
                      ) : connectionStatus === 'connecting' ? (
                        <span className="text-[8px] font-mono bg-amber-950 text-amber-400 border border-amber-800/50 px-1 py-0.5 rounded mt-1">
                          Sniffing Headers...
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500">DPI Sniffer</span>
                      )}
                    </div>

                    {/* Arrow/Line 3 */}
                    <div className="flex-1 flex flex-col items-center w-full max-w-[40px] md:max-w-none">
                      <div className="h-1 md:h-0.5 w-0.5 md:w-full bg-slate-800 relative">
                        {connectionStatus === 'connected' && (
                          <div className="absolute top-0 left-0 w-full h-full bg-emerald-400 animate-[dash_1.5s_linear_infinite]" />
                        )}
                      </div>
                    </div>

                    {/* Node 4: VPS & Uncensored Internet */}
                    <div className="flex flex-col items-center text-center w-28">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        connectionStatus === 'connected'
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Server className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">Remote VPS</span>
                      <span className="text-[9px] font-mono text-slate-500">{vpsIp}:{vpsPort}</span>
                    </div>

                  </div>

                  {/* Bottom details panel inside the map */}
                  {connectionStatus === 'connected' && (
                    <div className="w-full mt-4 bg-slate-900/60 border border-slate-800/50 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-slate-400">Injected Header:</span>
                        <span className="text-emerald-400 font-bold">CONNECT {spoofedHost}:{vpsPort}</span>
                      </div>
                      <button
                        onClick={() => setShowTestModal(true)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-2.5 py-1 rounded text-[10px] transition flex items-center gap-1 shrink-0"
                      >
                        <Zap className="w-3 h-3 fill-slate-950" />
                        SEND TEST REQUEST
                      </button>
                    </div>
                  )}

                  {connectionStatus === 'disconnected' && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 z-20">
                      <Lock className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-xs font-semibold text-slate-400">Tunnel Core Disconnected</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1">Configure your VPS, injection payload, and click "Start Injector" to fire up the TCP sockets.</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Bandwidth & Cost Savings Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold tracking-wider">DOWNLOAD</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      {connectionStatus === 'connected' ? trafficStats.dlSpeed.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-1">Mbps</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    Total: {trafficStats.totalDl.toFixed(2)} MB
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <TrendingUp className="w-4 h-4 text-teal-400 rotate-90" />
                    <span className="text-[10px] font-mono font-bold tracking-wider">UPLOAD</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      {connectionStatus === 'connected' ? trafficStats.ulSpeed.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-1">Mbps</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    Total: {trafficStats.totalUl.toFixed(2)} MB
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-mono font-bold tracking-wider">LATENCY (PING)</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      {connectionStatus === 'connected' ? trafficStats.ping : '--'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-1">ms</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    Stability: {connectionStatus === 'connected' ? 'Excellent' : 'Offline'}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold tracking-wider">COST SAVED</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ${connectionStatus === 'connected' ? trafficStats.savedCost.toFixed(3) : '0.000'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    Est. $0.05 / MB carrier rate
                  </div>
                </div>
              </div>

              {/* Real-time Network Stability Graph */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-300">STREAMING BANDWIDTH STABILITY CHART</span>
                  <span className="text-[10px] font-mono text-slate-500">Ticking every 1s</span>
                </div>
                <div className="h-20 w-full bg-slate-950 rounded-xl p-2 border border-slate-900 flex items-end justify-between relative overflow-hidden">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none p-1">
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                  </div>

                  {/* Speed Bars */}
                  {speedHistory.map((val, i) => {
                    const max = 20; // max expected speed in mbps
                    const heightPercent = Math.min((val / max) * 100, 100);
                    return (
                      <div
                        key={i}
                        className={`w-[2.5%] transition-all duration-500 rounded-t ${
                          connectionStatus === 'connected' 
                            ? 'bg-gradient-to-t from-cyan-600/60 to-cyan-400' 
                            : 'bg-slate-800'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        title={`${val} Mbps`}
                      />
                    );
                  })}

                  {/* Absolute Labels */}
                  {connectionStatus !== 'connected' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">NO STATISTICAL FLOW</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SOCKS5 / Proxy Logs Terminal */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
                
                {/* Terminal Header */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-450 flex items-center gap-1.5 ml-2">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      SONICTUNNEL_TERMINAL_SESSION
                    </span>
                  </div>

                  {/* Terminal Settings / Controls */}
                  <div className="flex items-center gap-3">
                    {/* Log Filter Search */}
                    <div className="relative hidden sm:block">
                      <input
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Filter logs..."
                        className="bg-slate-900 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500/50 w-36 pl-6"
                      />
                      <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
                    </div>
                    
                    <button
                      onClick={() => {
                        setLogs([]);
                        addToast('Terminal logs cleared', 'info');
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900 px-2.5 py-1 rounded-lg transition"
                    >
                      Clear
                    </button>
                    
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={() => setAutoScroll(!autoScroll)}
                        className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                      />
                      <span className="text-[10px] font-mono text-slate-400">Scroll</span>
                    </label>
                  </div>

                </div>

                {/* Terminal Screen */}
                <div className="bg-slate-950 p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-center flex-col gap-1.5 italic">
                      <TerminalSquare className="w-6 h-6 stroke-[1.5]" />
                      <span>Terminal empty. Fire up the injector or send custom traffic to trigger active socket sessions.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredLogs.map((l) => (
                        <div
                          key={l.id}
                          className={`border-l-2 pl-3 transition-all ${
                            l.type === 'info'
                              ? 'border-slate-700 text-slate-300'
                              : l.type === 'success'
                              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/10'
                              : l.type === 'warning'
                              ? 'border-amber-500 text-amber-300 bg-amber-950/10'
                              : l.type === 'error'
                              ? 'border-rose-500 text-rose-300 bg-rose-950/10'
                              : l.type === 'in'
                              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
                              : 'border-indigo-500 text-indigo-300'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 shrink-0 text-[10px] select-none">[{l.time}]</span>
                            <span className="whitespace-pre-wrap break-all select-all">{l.text}</span>
                          </div>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>

                {/* SOCKS5 proxy bind reminder */}
                <div className="bg-slate-950 px-4 py-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>SOCKS5 BIND: 127.0.0.1:{localPort}</span>
                  <span>TUNNEL DIRECTORY: /data/user/0/com.sonictunnel/files</span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DIAGNOSTIC TOOLS HUB */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            
            {/* Tab header explaining diagnostic suite */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-400" />
                  SonicTunnel Utility Diagnostics Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Search, verify, scan, and hunt down zero-rated hosts and vulnerability brackets to configure the injector.
                </p>
              </div>

              {/* Sub Active Tools Selectors */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/60 self-stretch md:self-auto">
                <button
                  onClick={() => setActiveTool('host-checker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTool === 'host-checker'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Host Bug Checker
                </button>
                <button
                  onClick={() => setActiveTool('port-scanner')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTool === 'port-scanner'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  VPS Port Scanner
                </button>
                <button
                  onClick={() => setActiveTool('ip-hunter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTool === 'ip-hunter'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  IP Subnet Hunter
                </button>
                <button
                  onClick={() => setActiveTool('sni-tester')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTool === 'sni-tester'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-450 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  🔒 SNI Mismatch Auditor
                </button>
              </div>
            </div>

            {/* TOOL 1: HOST BUG CHECKER */}
            {activeTool === 'host-checker' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Check Panel */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    HOST VULNERABILITY AUDIT
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">TEST HOSTNAME / BUG HOST</label>
                      <input
                        type="text"
                        value={hostCheckInput}
                        onChange={(e) => setHostCheckInput(e.target.value)}
                        placeholder="e.g. free.t-mobile.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition"
                      />
                      <span className="block text-[10px] text-slate-500 font-mono mt-1.5">
                        Try: <code className="text-cyan-400 hover:underline cursor-pointer" onClick={() => setHostCheckInput('free.t-mobile.com')}>free.t-mobile.com</code>, <code className="text-cyan-400 hover:underline cursor-pointer" onClick={() => setHostCheckInput('m.facebook.com')}>m.facebook.com</code>, or <code className="text-cyan-400 hover:underline cursor-pointer" onClick={() => setHostCheckInput('wikipedia.org')}>wikipedia.org</code>
                      </span>
                    </div>

                    <button
                      onClick={handleHostCheck}
                      disabled={checkStatus === 'checking'}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs tracking-wider transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      {checkStatus === 'checking' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING AUDIT...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" /> RUN HOST DIAGNOSTIC
                        </>
                      )}
                    </button>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-1">
                      <span className="font-bold text-slate-300 block mb-1">💡 What does this do?</span>
                      <p>ISP firewalls whitelist certain domains (zero-rated portals) so users with zero account balance can access billing or carrier portals.</p>
                      <p className="mt-1">The Host Checker tests if a domain is zero-rated by analyzing its response headers, redirection patterns, and network latency.</p>
                    </div>
                  </div>
                </div>

                {/* Audit results console */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Console logs */}
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-900 shadow-xl font-mono text-xs h-64 overflow-y-auto space-y-2">
                    <div className="pb-2 border-b border-slate-900 flex justify-between text-[11px] text-slate-400">
                      <span>AUDIT SESSION CONSOLE LOGS</span>
                      <span>DIAG_PORT: 80</span>
                    </div>
                    {checkLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-700 text-center italic">
                        Input a host on the left and click "Run Host Diagnostic" to check header responses.
                      </div>
                    ) : (
                      checkLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`pl-3 border-l-2 ${
                            log.startsWith('[+]')
                              ? 'border-emerald-500 text-emerald-300'
                              : log.startsWith('[-] animate') || log.startsWith('[-]')
                              ? 'border-rose-500 text-rose-300'
                              : log.startsWith('[>]')
                              ? 'border-sky-500 text-sky-300'
                              : log.startsWith('[<]')
                              ? 'border-amber-500 text-amber-300'
                              : log.startsWith('[MATCH]')
                              ? 'border-purple-500 text-purple-300 font-bold'
                              : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Audit Analysis Metrics Card */}
                  {checkMetrics && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                      
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">VULNERABILITY LEVEL</span>
                        <div className="my-2">
                          <span className={`text-xl font-black font-mono tracking-wider ${checkMetrics.isVulnerable ? 'text-rose-400' : 'text-slate-400'}`}>
                            {checkMetrics.isVulnerable ? 'CRITICAL (BUG)' : 'NORMAL'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono leading-relaxed">
                          {checkMetrics.isVulnerable 
                            ? 'Vulnerable to Host header spoofing! Highly suitable for HTTP Injector payload.' 
                            : 'Host will consume standard data tariff unless specifically whitelisted.'}
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">RESPONSE METRICS</span>
                        <div className="my-2 space-y-1">
                          <div className="text-xs text-slate-200">
                            Status: <span className="font-bold text-cyan-400 font-mono">{checkMetrics.status} {checkMetrics.statusText}</span>
                          </div>
                          <div className="text-xs text-slate-200">
                            Latency: <span className="font-bold text-cyan-400 font-mono">{checkMetrics.responseTime} ms</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Server response time from carrier network gateway node.
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">INJECTION BLUEPRINT</span>
                        <div className="my-2 font-mono text-[9px] text-slate-300 break-all bg-slate-900 p-1.5 rounded border border-slate-800">
                          {checkMetrics.payloadSuggestion}
                        </div>
                        <button
                          onClick={() => {
                            setPayloadText(checkMetrics.payloadSuggestion);
                            setSpoofedHost(hostCheckInput);
                            addToast('Applied payload blueprint to injector!', 'success');
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-[9px] py-1 rounded transition w-full"
                        >
                          APPLY BLUEPRINT TO INJECTOR
                        </button>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TOOL 2: VPS PORT SCANNER */}
            {activeTool === 'port-scanner' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Control card */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    VPS PORT AUDITOR
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">VPS HOSTNAME OR IP</label>
                      <input
                        type="text"
                        value={scanHost}
                        onChange={(e) => setScanHost(e.target.value)}
                        placeholder="e.g. 198.51.100.45"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition"
                      />
                    </div>

                    <button
                      onClick={handlePortScan}
                      disabled={scanStatus === 'scanning'}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs tracking-wider transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      {scanStatus === 'scanning' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> AUDITING PORTS...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" /> SCAN COMMON PORTS
                        </>
                      )}
                    </button>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-1">
                      <span className="font-bold text-slate-300 block mb-1">🌐 Tunnel Ports</span>
                      <p>SSH Tunnels typically use Port 22 or 443 (dropbear/stunnel).</p>
                      <p className="mt-1">Squid Proxies utilize 80, 8080, or 3128. SOCKS5 servers run on 1080.</p>
                      <p className="mt-1">Use this scanner to confirm your remote VPS listening ports are open and ready to receive injected headers.</p>
                    </div>
                  </div>
                </div>

                {/* Ports List Display */}
                <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-mono font-bold text-slate-200">PORT STATUS MATRIX ({scanHost})</span>
                    <span className="text-[10px] font-mono text-slate-500">Scan Status: {scanStatus.toUpperCase()}</span>
                  </div>

                  <div className="space-y-2.5">
                    {portsList.map((p) => (
                      <div
                        key={p.port}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-10 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-800 font-mono text-[11px]">
                            <span className="text-slate-500 text-[8px] uppercase">PORT</span>
                            <span className="font-bold text-slate-300">{p.port}</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 font-mono">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">TCP / IP protocol socket</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {p.status === 'idle' && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg font-bold">
                              IDLE
                            </span>
                          )}
                          {p.status === 'filtering' && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/20 border border-amber-800/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> SCANNING...
                            </span>
                          )}
                          {p.status === 'open' && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-2.5 py-1 rounded-lg font-bold">
                              OPEN / LISTEN
                            </span>
                          )}
                          {p.status === 'closed' && (
                            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-800/30 px-2.5 py-1 rounded-lg font-bold">
                              CLOSED / FILTERED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TOOL 3: IP SUBNET HUNTER */}
            {activeTool === 'ip-hunter' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Control Panel */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    CELLULAR SUBNET HUNTER
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">SELECT CELLULAR CARRIER</label>
                      <select
                        value={hunterCarrier}
                        onChange={(e) => setHunterCarrier(e.target.value)}
                        disabled={isHunting}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="T-Mobile">T-Mobile (USA / North America)</option>
                        <option value="Vodafone">Vodafone (Europe / Global)</option>
                        <option value="Jio">Reliance Jio (India / Asia)</option>
                        <option value="Claro">Claro (South America)</option>
                        <option value="Orange">Orange (Europe / Africa)</option>
                        <option value="Africell">Africell (Gambia / Sierra Leone / DRC / Uganda)</option>
                        <option value="QCell">QCell (Gambia / Sierra Leone)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleIPHunter}
                      disabled={isHunting}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs tracking-wider transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      {isHunting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> HUNTING IP BRACKET...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> START SUBNET HUNT
                        </>
                      )}
                    </button>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-450 space-y-1">
                      <span className="font-bold text-slate-300 block mb-1">📡 How Cellular IP Hunting works</span>
                      <p>Mobile networks assign private IPs via CG-NAT. Some specific CG-NAT IP brackets (e.g. `10.124.x.x`) have transparent proxies that completely bypass packet balance rules.</p>
                      <p className="mt-1">In real-world usage, this tool cycles Airplane Mode on the Android phone until the cellular network leases an IP in the vulnerable zero-rated bracket. SonicTunnel simulates this search.</p>
                    </div>
                  </div>
                </div>

                {/* Hunter Log Console */}
                <div className="lg:col-span-8 space-y-6">
                  
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-900 shadow-xl font-mono text-xs h-80 overflow-y-auto space-y-2">
                    <div className="pb-2 border-b border-slate-900 flex justify-between text-[11px] text-slate-400">
                      <span>IP HUNTER MONITOR LOGS</span>
                      <span>TARGET SUBNET: 10.124.50.x</span>
                    </div>
                    {hunterLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-700 text-center italic">
                        Select a carrier and click "Start Subnet Hunt" to simulate network IP lease renegotiation loops.
                      </div>
                    ) : (
                      hunterLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`pl-3 border-l-2 ${
                            log.includes('[MATCH]') || log.includes('[success]')
                              ? 'border-emerald-500 text-emerald-300 font-bold bg-emerald-950/10'
                              : log.startsWith('[+]')
                              ? 'border-cyan-500 text-cyan-300'
                              : log.startsWith('[i]')
                              ? 'border-slate-700 text-slate-500'
                              : 'border-slate-800 text-slate-450'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Matching IP Card */}
                  {matchedIp && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">ZERO-RATED CG-NAT IP ACQUIRED!</div>
                          <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{matchedIp}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setLogs((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              time: new Date().toLocaleTimeString(),
                              type: 'success',
                              text: `[IP Hunter] Imported hunted cell lease IP: ${matchedIp}. Firewalls are unlocked.`
                            }
                          ]);
                          setActiveTab('dashboard');
                          addToast('Carrier Subnet linked to Injector Core!', 'success');
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition"
                      >
                        ACTIVATE TUNNEL CORE NOW
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TOOL 4: SNI MISMATCH AUDITOR */}
            {activeTool === 'sni-tester' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Control Panel */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    SNI LEAKAGE DIAGNOSTIC
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">1. TARGET SERVER IP</label>
                      <input
                        type="text"
                        value={sniTestIp}
                        onChange={(e) => setSniTestIp(e.target.value)}
                        placeholder="e.g. 104.18.2.161"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-250 focus:outline-none focus:border-cyan-500/50 transition"
                      />
                      <span className="block text-[9px] text-slate-500 font-mono mt-1">
                        Uncensored target destination (e.g. Cloudflare Edge)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">SPOOFED SNI HOST</label>
                        <input
                          type="text"
                          value={sniTestHost}
                          onChange={(e) => setSniTestHost(e.target.value)}
                          placeholder="free-portal.local-telecom.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500/50 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">PORT</label>
                        <input
                          type="number"
                          value={sniTestPort}
                          onChange={(e) => setSniTestPort(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSniInspectionTest}
                      disabled={sniTestStatus === 'testing'}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs tracking-wider transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      {sniTestStatus === 'testing' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> WRAPPING SOCKET...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-slate-950" /> AUDIT SNI MISMATCH
                        </>
                      )}
                    </button>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-2">
                      <span className="font-bold text-slate-300 block">💡 Diagnostic Objective:</span>
                      <p>
                        This tool wraps a standard TCP socket in SSL and sets the `server_hostname` parameter (ClientHello SNI field) to a whitelisted telecom domain. 
                        If the handshake succeeds, the carrier firewall is vulnerable to SNI mismatch tunneling!
                      </p>
                    </div>
                  </div>
                </div>

                {/* SNI Diagnostic Console */}
                <div className="lg:col-span-8 space-y-6">
                  
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-900 shadow-xl font-mono text-xs h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                    <div className="pb-2 border-b border-slate-900 flex justify-between text-[11px] text-slate-400">
                      <span>TLS WRAPPER CONSOLE OUTPUT (MIMICS PYTHON SSL)</span>
                      <span>ssl.wrap_socket()</span>
                    </div>
                    {sniTestLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600 text-center italic">
                        Configure target credentials and click "Audit SNI Mismatch" to trace packet wrapper signatures.
                      </div>
                    ) : (
                      sniTestLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`pl-3 border-l-2 ${
                            log.startsWith('[success]') || log.startsWith('[+]')
                              ? 'border-emerald-500 text-emerald-300 font-bold'
                              : log.startsWith('[-] TLS') || log.startsWith('[-]')
                              ? 'border-rose-500 text-rose-300'
                              : log.startsWith('[~]')
                              ? 'border-indigo-400 text-indigo-300 font-bold'
                              : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={sniLogsEndRef} />
                  </div>

                  {/* SNI Metrics Output */}
                  {sniMetrics && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                      
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">FIREWALL AUDIT VERDICT</span>
                        <div className="my-2">
                          <span className={`text-xl font-black font-mono tracking-wider ${sniMetrics.isVulnerable ? 'text-emerald-400' : 'text-rose-450'}`}>
                            {sniMetrics.isVulnerable ? 'VULNERABLE (LEAK)' : 'SECURED (BLOCKED)'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono leading-relaxed">
                          {sniMetrics.isVulnerable 
                            ? 'Firewall accepts spoofed SNI matching telecom whitelists. Excellent for SNI bypass!' 
                            : 'Firewall terminates handshakes with mismatched destination IPs.'}
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">CIPHER & HANDSHAKE</span>
                        <div className="my-2 space-y-1">
                          <div className="text-xs text-slate-200">
                            Handshake: <span className="font-bold text-cyan-400 font-mono">{sniMetrics.handshakeSuccessful ? 'Success' : 'Failed'}</span>
                          </div>
                          <div className="text-xs text-slate-200">
                            Cipher: <span className="font-bold text-cyan-400 font-mono text-[10px]">{sniMetrics.cipher}</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Negotiated TLS session details from destination endpoint.
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">FIREWALL BEHAVIOR</span>
                        <div className="my-2 text-[11px] font-mono font-bold text-slate-300">
                          {sniMetrics.firewallAction}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedExporter('sni-tester');
                            setActiveTab('exporter');
                            addToast('Opened SNI Mismatch Script Exporter!', 'info');
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-[9px] py-1 rounded transition w-full"
                        >
                          EXPORT PYTHON DIAGNOSTIC SCRIPT
                        </button>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: CODE EXPORTER */}
        {activeTab === 'exporter' && (
          <div className="space-y-6">
            
            {/* Top Info Banner */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Multi-Language Tunnel Client Exporter
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Export your current injector configuration (VPS IP: <code className="text-cyan-400">{vpsIp}</code>, VPS Port: <code className="text-cyan-400">{vpsPort}</code>, Spoofed Host: <code className="text-cyan-400">{spoofedHost}</code>) directly into compiled executables, scripts, or Android environment configurations.
              </p>
            </div>

            {/* Language grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sidebar selectors */}
              <div className="lg:col-span-3 space-y-3">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block mb-3">AVAILABLE BINDINGS</span>
                  
                  <div className="space-y-2">
                    {[
                      { id: 'python', name: 'Python 3 (Chaquopy)', lang: 'python', icon: '🐍' },
                      { id: 'go', name: 'Go (Golang Engine)', lang: 'go', icon: '🐹' },
                      { id: 'rust', name: 'Rust (Baremetal)', lang: 'rust', icon: '🦀' },
                      { id: 'termux', name: 'Android Termux Script', lang: 'shell', icon: '📱' },
                      { id: 'sni-tester', name: 'Python SNI Diagnostic', lang: 'python', icon: '🔒' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedExporter(item.id as 'python' | 'go' | 'rust' | 'termux' | 'sni-tester');
                          addToast(`Switched code binding to: ${item.name}`, 'info');
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition border ${
                          selectedExporter === item.id
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-inner'
                            : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-400 space-y-2">
                  <span className="font-bold text-slate-300 block">💡 Diagnostic Script Usage</span>
                  <p>The **Python SNI Diagnostic** script tests firewall leakage by injecting mismatched SNI hostnames into standard TLS packets using Python's core `socket` and `ssl` libraries.</p>
                </div>
              </div>

              {/* Code viewer editor */}
              <div className="lg:col-span-9 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                
                {/* Editor Header */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {selectedExporter === 'python' && 'sonictunnel_chaquopy.py'}
                      {selectedExporter === 'go' && 'main.go'}
                      {selectedExporter === 'rust' && 'main.rs'}
                      {selectedExporter === 'termux' && 'setup_termux.sh'}
                      {selectedExporter === 'sni-tester' && 'sni_leakage_diagnostic.py'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const code = getSelectedCode();
                        handleCopyText(code, 'Exported code');
                      }}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      COPY CODE
                    </button>
                    
                    <button
                      onClick={() => {
                        const code = getSelectedCode();
                        const filename = 
                          selectedExporter === 'python' ? 'sonictunnel_chaquopy.py' :
                          selectedExporter === 'go' ? 'main.go' :
                          selectedExporter === 'rust' ? 'main.rs' :
                          selectedExporter === 'termux' ? 'setup_termux.sh' : 'sni_leakage_diagnostic.py';
                        
                        const blob = new Blob([code], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                        addToast(`Downloaded ${filename}`, 'success');
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 fill-slate-950" />
                      DOWNLOAD FILE
                    </button>
                  </div>
                </div>

                {/* Code viewport */}
                <div className="bg-slate-950 p-5 overflow-auto max-h-[550px] font-mono text-xs leading-relaxed text-cyan-200/90 select-all border-b border-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
                  <pre className="whitespace-pre">{getSelectedCode()}</pre>
                </div>

                {/* Exporter Footer */}
                <div className="bg-slate-950 px-5 py-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Compilation dependency: socket, select, ssl, thread (StdLib)</span>
                  <span>Payload Byte Signature Length: {getCompiledPayload(payloadText, spoofedHost, vpsPort).length} bytes</span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 4: DPI ACADEMY */}
        {activeTab === 'academy' && (
          <div className="space-y-6">
            
            {/* Academy Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950 border border-indigo-800/60 px-2 py-0.5 rounded">
                  EDUCATIONAL COMPENDIUM
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mt-2.5">
                  How Carrier DPI Firewalls Work & How Injection Spoofs Them
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  An academic dive into Deep Packet Inspection, Server Name Indication (SNI) leakage, Transparent Proxy redirection, and the packet-manipulation mechanics used to secure uncensored data packets.
                </p>
              </div>
            </div>

            {/* Core Concepts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200">1. WHAT IS DEEP PACKET INSPECTION (DPI)?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traditional firewalls route traffic by looking only at packet headers (Layer 3 IP addresses, Layer 4 TCP ports). 
                  However, **Deep Packet Inspection (DPI)** peers deep into the actual data payload (Layer 7 Application Layer) to read TLS Client Hellos, HTTP GET requests, and Host headers.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mobile carriers implement DPI to log billing rules. If they detect you are visiting a normal website, they charge your account. If they detect a whitelisted domain, they bypass billing.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200">2. THE SERVER NAME INDICATION (SNI) FLAW</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When establishing a secure TLS/HTTPS connection, the very first packet sent by the client is the **TLS Client Hello**. Because the connection is not yet encrypted, the hostname of the destination server is sent in **plaintext** inside the SNI extension.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carrier DPI routers read this plaintext SNI. By altering the SNI extension to match a zero-rated domain (like `free.t-mobile.com`) while routing the actual TCP stream to a VPS, the DPI firewall permits the connection.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200">3. HTTP HEADER INJECTION TRICKERY</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In HTTP-based connections (and HTTP CONNECT proxies), the DPI router scans the `Host`, `X-Online-Host`, and `X-Forward-Host` headers.
                  A packet injector acts as a local proxy that intercepts SOCKS5 traffic from your browser, encapsulates it, and prepends a spoofed HTTP header right at the beginning of the stream.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The ISP's transparent proxy reads the header, records the traffic under the zero-rated quota, and passes it along. Once it reaches your VPS, the VPS strips the spoofed header or transparently routes the encapsulated TCP stream to the uncensored web.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Network className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200">4. ZERO-RATING SCHEMES EXPLAINED</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carriers utilize **Zero-Rating** to partner with social networks, Wikipedia, or government portals, ensuring users can access vital resources for free. 
                  These zero-rated portals have specific IPs or hostnames whitelisted in the ISP gateway.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  By utilizing a remote VPS proxy combined with a local header injector, users tunnel their entire internet traffic (YouTube, games, general browsing) under the billing category of the free whitelisted host.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 md:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200">5. CARRIER STUDY: ORANGE, AFRICELL & QCELL ARCHITECTURES</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-orange-400 block">🍊 ORANGE NETWORKS</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Orange networks (active in EU and major West/Central African regions) often whitelist educational portals, Orange Money subdomains (`orange-money`), or social passes (`pass.orange`).
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      **Bypass Method**: Using SNI header spoofing combined with payload tunneling routes the encrypted packets through Orange whitelisted proxies.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-teal-400 block">📞 AFRICELL NETWORKS</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Africell (operating in Gambia, Sierra Leone, DRC, Uganda, and Angola) offers zero-rated balance portals and chat passes.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      **Bypass Method**: Africell's transparent SQUID proxies often allow transparent SOCKS5 requests when prefixed with a whitelisted `X-Online-Host: portal.africell.gm` parameter.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-sky-400 block">📱 QCELL NETWORKS</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      QCell (Gambia's and Sierra Leone's major operator) zero-rates its main portal domains (`portal.qcell.sl`, `qcell.gm`) and citizen portal hubs.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      **Bypass Method**: The firewall relies on SNI ClientHello matching to authorize TLS traffic. Spoofing `portal.qcell.sl` enables full unmetered web tunnels.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Academic Handshake Visualizer Comparison */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                DPI HANDSHAKE COMPARISON MATRIX
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Handshake 1 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-300 font-mono mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>1. NORMAL HTTPS CONNECTION</span>
                    <span className="text-rose-400">Blocked / Billed</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="text-cyan-400">Client --&gt; ClientHello (SNI = github.com)</div>
                    <div className="text-rose-500">[DPI Sniffer] Host NOT Zero-Rated.</div>
                    <div className="text-slate-500">Gateway: Subtracts balance or blocks access.</div>
                  </div>
                </div>

                {/* Handshake 2 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-300 font-mono mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>2. SNI SPOOFED CONNECTION</span>
                    <span className="text-emerald-400">Bypassed!</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="text-cyan-400">Client --&gt; ClientHello (SNI = free.t-mobile.com)</div>
                    <div className="text-emerald-400">[DPI Sniffer] SNI matches free host! Approved.</div>
                    <div className="text-indigo-400">VPS: Receives stream, routes to github.com.</div>
                  </div>
                </div>

                {/* Handshake 3 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-300 font-mono mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>3. HTTP INJECTOR PAYLOAD</span>
                    <span className="text-emerald-400">Bypassed!</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="text-cyan-400">Client --&gt; CONNECT free.t-mobile.com:443</div>
                    <div className="text-emerald-400">[DPI Transparent Proxy] Zero-Rated! Approved.</div>
                    <div className="text-indigo-400">VPS: Strips headers, forwards encrypted SSL.</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Ethical Disclaimer Warning */}
            <div className="bg-rose-900/20 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-rose-300 uppercase font-mono tracking-wider">Academic Disclosure & Usage Agreement</h4>
                <p className="text-[11px] text-rose-200/80 leading-relaxed">
                  SonicTunnel is developed as an educational suite to study network protocol engineering, transparent proxy behavior, and deep packet inspection firewalls. Bypassing commercial billing systems may violate carrier terms of service or local laws. Always check your local carrier guidelines and use this knowledge ethically in test environments.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Test Request Simulator Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-200 font-mono tracking-wider">HTTP HEADER INJECTION DIAGNOSTIC TEST</h3>
              </div>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestProgress('idle');
                  setTestLogs([]);
                }}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs transition"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Trigger a simulated client request to an external website. This will trace the packet, prepend your current injection headers, simulate carrier firewall inspection, and test routing.
              </p>

              <div className="grid grid-cols-4 gap-3">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://www.github.com"
                  className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 transition"
                />
                <button
                  onClick={runTestRequest}
                  disabled={testProgress !== 'idle' && testProgress !== 'completed'}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  SEND PACKET
                </button>
              </div>

              {/* Progress Stepper Visualizer */}
              <div className="grid grid-cols-5 gap-1 pt-2">
                {[
                  { step: 'initiating', label: '1. SOCKS5 Intercept' },
                  { step: 'payload', label: '2. Prepend Payload' },
                  { step: 'dpi_check', label: '3. DPI Sniff' },
                  { step: 'vps_forward', label: '4. VPS Connect' },
                  { step: 'completed', label: '5. Completed' },
                ].map((s, idx) => {
                  const stages = ['idle', 'initiating', 'payload', 'dpi_check', 'vps_forward', 'completed'];
                  const currentIdx = stages.indexOf(testProgress);
                  const stepIdx = stages.indexOf(s.step);
                  const isDone = currentIdx >= stepIdx && testProgress !== 'idle';
                  const isActive = testProgress === s.step;

                  return (
                    <div key={idx} className="flex flex-col gap-1 items-center">
                      <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                        isActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse' : isDone ? 'bg-emerald-500' : 'bg-slate-800'
                      }`} />
                      <span className={`text-[8px] font-mono text-center font-bold tracking-tight transition ${
                        isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Console Output logs */}
              <div className="bg-slate-950 rounded-xl p-4 h-56 border border-slate-900 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
                {testLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-700 text-center italic">
                    Click "Send Packet" to watch step-by-step packet inspection and payload transmission sequence.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {testLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`pl-3 border-l-2 ${
                          log.startsWith('[success]') || log.includes('APPROVED')
                            ? 'border-emerald-500 text-emerald-300 font-bold'
                            : log.startsWith('[SOCKS5]') || log.startsWith('[DPI Router]')
                            ? 'border-cyan-500 text-cyan-400'
                            : log.startsWith('[VPS')
                            ? 'border-indigo-400 text-indigo-300'
                            : log.includes('====')
                            ? 'border-slate-900 text-slate-700 select-none'
                            : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                    <div ref={testLogsEndRef} />
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-5 py-3.5 border-t border-slate-900 flex justify-end">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestProgress('idle');
                  setTestLogs([]);
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Close Trace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>SonicTunnel Project © {new Date().getFullYear()}. All Rights Reserved.</span>
          </div>
          <div className="flex gap-4">
            <a href="#github" className="hover:text-slate-300 transition">Open Source</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-300 transition">Privacy Sandbox</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-300 transition">Terms of Research</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
