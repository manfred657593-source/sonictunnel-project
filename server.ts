import express from "express";
import cors from "cors";
import dns from "dns";
import https from "https";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// IP info
app.get("/api/ip-info", async (_req, res) => {
  try {
    https.get("https://ipapi.co/json/", (resp) => {
      let data = "";

      resp.on("data", (chunk) => {
        data += chunk;
      });

      resp.on("end", () => {
        res.json(JSON.parse(data));
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch IP info" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SonicTunnel running on ${PORT}`);
}); 
