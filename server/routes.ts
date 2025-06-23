import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFamilyMemberSchema, insertRelationshipSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get family tree data
  app.get("/api/family-tree", async (req, res) => {
    try {
      const familyTree = await storage.getFamilyTree();
      res.json(familyTree);
    } catch (error) {
      res.status(500).json({ message: "Failed to get family tree data" });
    }
  });

  // Create new family member
  app.post("/api/family-members", async (req, res) => {
    try {
      const memberData = insertFamilyMemberSchema.parse(req.body);
      const newMember = await storage.createFamilyMember(memberData);
      res.json(newMember);
    } catch (error) {
      res.status(400).json({ message: "Invalid family member data" });
    }
  });

  // Update family member position
  app.patch("/api/family-members/:id/position", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { x, y } = req.body;
      
      if (typeof x !== 'number' || typeof y !== 'number') {
        return res.status(400).json({ message: "Invalid position data" });
      }

      const updatedMember = await storage.updateFamilyMemberPosition(id, x, y);
      res.json(updatedMember);
    } catch (error) {
      res.status(404).json({ message: "Family member not found" });
    }
  });

  // Create relationship
  app.post("/api/relationships", async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      const newRelationship = await storage.createRelationship(relationshipData);
      res.json(newRelationship);
    } catch (error) {
      res.status(400).json({ message: "Invalid relationship data" });
    }
  });

  // Delete family member
  app.delete("/api/family-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFamilyMember(id);
      res.json({ message: "Family member deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "Family member not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
