import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { isAuthenticated, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Get all events for the authenticated user
router.get(
  "/",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { ownerId: req.payload?.userId },
            { attendees: { some: { userId: req.payload?.userId } } },
          ],
        },
        include: {
          owner: {
            select: { id: true, name: true, avatar: true },
          },
          attendees: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          categories: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { startDate: "asc" },
      });

      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  }
);

// Get single event
router.get(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          attendees: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { dueDate: "asc" },
          },
          categories: true,
        },
      });

      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  }
);

// Create event
router.post(
  "/",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, location, startDate, endDate, imageUrl, isPublic } =
        req.body;

      if (!title || !startDate) {
        res.status(400).json({ message: "Title and start date are required" });
        return;
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          location,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          imageUrl,
          isPublic: isPublic || false,
          ownerId: req.payload!.userId,
        },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ message: "Error creating event" });
    }
  }
);

// Update event
router.put(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, location, startDate, endDate, imageUrl, isPublic } =
        req.body;

      const existingEvent = await prisma.event.findUnique({ where: { id } });
      if (!existingEvent) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      if (existingEvent.ownerId !== req.payload?.userId) {
        res.status(403).json({ message: "Not authorized to update this event" });
        return;
      }

      const event = await prisma.event.update({
        where: { id },
        data: {
          title,
          description,
          location,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          imageUrl,
          isPublic,
        },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          attendees: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Error updating event" });
    }
  }
);

// Delete event
router.delete(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existingEvent = await prisma.event.findUnique({ where: { id } });
      if (!existingEvent) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      if (existingEvent.ownerId !== req.payload?.userId) {
        res.status(403).json({ message: "Not authorized to delete this event" });
        return;
      }

      await prisma.event.delete({ where: { id } });

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ message: "Error deleting event" });
    }
  }
);

// Add attendee to event
router.post(
  "/:id/attendees",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, status } = req.body;

      const attendee = await prisma.eventAttendee.create({
        data: {
          eventId: id,
          userId,
          status: status || "PENDING",
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.status(201).json(attendee);
    } catch (error) {
      console.error("Add attendee error:", error);
      res.status(500).json({ message: "Error adding attendee" });
    }
  }
);

export default router;
