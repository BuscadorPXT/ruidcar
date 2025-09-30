import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { registerRoutes as registerNewRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { startNotificationJobs } from "./services/notificationService";
import { initializeWebSocket } from "./websocket";

const app = express();

// Configuração CORS simples para desenvolvimento
const corsOptions = {
  origin: function(origin: any, callback: any) {
    // Permitir localhost em desenvolvimento
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    // Se não há origin (mesma origem) ou está na lista, permitir
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // Em desenvolvimento, permitir qualquer origem
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true, // CRÍTICO: Permitir envio de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // Cache preflight por 24 horas
};

// Aplicar CORS em todas as rotas (necessário para cookies funcionarem)
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Registrar novas rotas unificadas
  registerNewRoutes(app);

  // Initialize WebSocket server
  const websocket = initializeWebSocket(server);

  // Store WebSocket instance globally for use in other modules
  (global as any).websocket = websocket;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve app e API (porta configurável via env)
  const port = Number(process.env.PORT) || 5000;
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
    log("WebSocket server initialized successfully");

    // Inicializar jobs de notificação
    try {
      startNotificationJobs();
      log("Notification jobs initialized successfully");
    } catch (error) {
      console.error("Failed to start notification jobs:", error);
    }
  });
})();
