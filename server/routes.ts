import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { agentService } from "./agent-service";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { startMockBlockchain } from "./mock-blockchain";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const response = await agentService.processMessage(message);
      res.json(response);
    } catch (error) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ 
        error: "Failed to process message",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Wallet update endpoint
  app.post("/api/update-wallet", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { avalancheAddress, privateKey } = req.body;

      // Update user's wallet information
      const updatedUser = await storage.updateUserWallet(req.user!.id, {
        avalancheAddress,
        privateKey
      });

      // Return updated user without sensitive information
      const { password, privateKey: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Update wallet error:', error);
      res.status(500).json({ 
        error: "Failed to update wallet",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  startMockBlockchain(wss);

  return httpServer;
}