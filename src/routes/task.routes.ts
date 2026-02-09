import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { isAuthenticated, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Get all tasks for an event
router.get(
  "/event/:eventId",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;

      const tasks = await prisma.task.findMany({
        where: { eventId },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ isCompleted: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
      });

      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  }
);

// Get single task
router.get(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          event: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      });

      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ message: "Error fetching task" });
    }
  }
);

// Create task
router.post(
  "/",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, dueDate, priority, eventId, assigneeId } = req.body;

      if (!title || !eventId) {
        res.status(400).json({ message: "Title and event ID are required" });
        return;
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "MEDIUM",
          eventId,
          assigneeId,
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Error creating task" });
    }
  }
);

// Update task
router.put(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, dueDate, priority, isCompleted, assigneeId } =
        req.body;

      const existingTask = await prisma.task.findUnique({ where: { id } });
      if (!existingTask) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority,
          isCompleted,
          assigneeId,
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.json(task);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  }
);

// Toggle task completion
router.patch(
  "/:id/toggle",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existingTask = await prisma.task.findUnique({ where: { id } });
      if (!existingTask) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      const task = await prisma.task.update({
        where: { id },
        data: { isCompleted: !existingTask.isCompleted },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.json(task);
    } catch (error) {
      console.error("Toggle task error:", error);
      res.status(500).json({ message: "Error toggling task" });
    }
  }
);

// Delete task
router.delete(
  "/:id",
  isAuthenticated,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existingTask = await prisma.task.findUnique({ where: { id } });
      if (!existingTask) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      await prisma.task.delete({ where: { id } });

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Error deleting task" });
    }
  }
);

export default router;
