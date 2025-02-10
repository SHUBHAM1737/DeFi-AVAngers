import express, { type Request, Response, NextFunction } from "express";
import { WebSocketServer, type WebSocket } from 'ws';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { agentService } from "./agent-service";
import { storage } from "./storage";
import session from 'express-session';
import { setupAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

const sessionSettings: session.SessionOptions = {
  secret: process.env.REPL_ID || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: app.get("env") === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
}

// Set up session middleware before passport
const sessionMiddleware = session(sessionSettings);
app.use(sessionMiddleware);

// Set up authentication
setupAuth(app);

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
  pingTimeout?: NodeJS.Timeout;
}

(async () => {
  const PORT = process.env.PORT || 5000;
  const server = registerRoutes(app);

  // Store authenticated WebSocket connections with proper type
  const authenticatedClients = new Map<string, AuthenticatedWebSocket>();

  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true,
    verifyClient: async (info, cb) => {
      try {
        await new Promise<void>((resolve, reject) => {
          sessionMiddleware(info.req as Request, {} as Response, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });

        const sessionReq = info.req as Request;
        if (!sessionReq.session?.passport?.user) {
          cb(false, 401, 'Unauthorized');
          return;
        }

        cb(true);
      } catch (error) {
        log(`WebSocket verification error: ${error instanceof Error ? error.message : String(error)}`);
        cb(false, 500, 'Internal Server Error');
      }
    }
  });

  // Set up heartbeat interval to detect stale connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        if (ws.userId) {
          authenticatedClients.delete(ws.userId);
        }
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Handle WebSocket connections
  wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
    log('New WebSocket connection established');
    ws.isAlive = true;

    try {
      const sessionReq = req as Request;
      const userId = sessionReq.session?.passport?.user;

      if (!userId) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { error: 'Authentication required' }
        }));
        ws.close();
        return;
      }

      try {
        const user = await storage.getUser(userId);
        if (!user) {
          throw new Error('User not found');
        }

        ws.userId = userId.toString();
        authenticatedClients.set(userId.toString(), ws);
        log(`User ${userId} authenticated via session`);

        ws.send(JSON.stringify({
          type: 'success',
          data: { message: 'Authentication successful' }
        }));
      } catch (error) {
        log(`User lookup error: ${error instanceof Error ? error.message : String(error)}`);
        ws.send(JSON.stringify({
          type: 'error',
          data: { error: 'Authentication failed - invalid user' }
        }));
        ws.close();
        return;
      }

      // Set up ping-pong for this connection
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'request') {
            try {
              const response = await agentService.processMessage(message.content, parseInt(ws.userId!));
              ws.send(JSON.stringify({
                type: 'response',
                data: response
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { error: error instanceof Error ? error.message : String(error) }
              }));
            }
          }
        } catch (error) {
          log(`WebSocket message error: ${error instanceof Error ? error.message : String(error)}`);
          ws.send(JSON.stringify({
            type: 'error',
            data: { error: 'Failed to process message' }
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          authenticatedClients.delete(ws.userId);
          log(`User ${ws.userId} WebSocket connection closed`);
        }

        if (ws.pingTimeout) {
          clearTimeout(ws.pingTimeout);
        }
      });

      ws.on('error', (error) => {
        log(`WebSocket error: ${error instanceof Error ? error.message : String(error)}`);
        if (ws.userId) {
          authenticatedClients.delete(ws.userId);
        }

        if (ws.pingTimeout) {
          clearTimeout(ws.pingTimeout);
        }
      });
    } catch (error) {
      log(`WebSocket connection error: ${error instanceof Error ? error.message : String(error)}`);
      ws.close();
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`Error: ${message}`);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });
})();