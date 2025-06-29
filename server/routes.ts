import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFamilyMemberSchema, insertRelationshipSchema, insertFamilyEventSchema } from "@shared/schema";
import { z } from "zod";

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
      res.status(400).json({ 
        message: "Invalid family member data",
        error: error instanceof z.ZodError ? error.errors : undefined
      });
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

  // Update family member details
  app.patch("/api/family-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFamilyMemberSchema.partial().parse(req.body);
      const updatedMember = await storage.updateFamilyMember(id, updateData);
      res.json(updatedMember);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to update family member",
        error: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // Create relationship
  app.post("/api/relationships", async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      const newRelationship = await storage.createRelationship(relationshipData);
      res.json(newRelationship);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid relationship data",
        error: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // Update relationship
  app.patch("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertRelationshipSchema.partial().parse(req.body);
      const updatedRelationship = await storage.updateRelationship(id, updateData);
      res.json(updatedRelationship);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to update relationship",
        error: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // Delete relationship
  app.delete("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelationship(id);
      res.json({ message: "Relationship deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "Relationship not found" });
    }
  });

  // Create family event
  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertFamilyEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(eventData);
      res.json(newEvent);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid event data",
        error: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // Get events for specific members
  app.get("/api/events", async (req, res) => {
    try {
      const memberIds = req.query.memberIds 
        ? (Array.isArray(req.query.memberIds) 
          ? req.query.memberIds.map(id => parseInt(id as string))
          : [parseInt(req.query.memberIds as string)])
        : undefined;
      
      const events = await storage.getEvents(memberIds);
      res.json(events);
    } catch (error) {
      res.status(400).json({ message: "Failed to get events" });
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvent(id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "Event not found" });
    }
  });

  // Delete family member (and related relationships/events)
  app.delete("/api/family-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFamilyMember(id);
      res.json({ message: "Family member and related data deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "Family member not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
