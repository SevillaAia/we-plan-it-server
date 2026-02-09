import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Get all plans
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ message: "Error fetching plans" });
  }
});

// Get single plan
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    res.json(plan);
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({ message: "Error fetching plan" });
  }
});

// Create plan
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, priority, completed } = req.body;

    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        completed: completed || false,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ message: "Error creating plan" });
  }
});

// Update plan
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, completed } = req.body;

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        completed,
      },
    });

    res.json(plan);
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ message: "Error updating plan" });
  }
});

// Toggle plan completion
router.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: { completed: !existingPlan.completed },
    });

    res.json(plan);
  } catch (error) {
    console.error("Toggle plan error:", error);
    res.status(500).json({ message: "Error toggling plan" });
  }
});

// Delete plan
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    await prisma.plan.delete({ where: { id } });

    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ message: "Error deleting plan" });
  }
});

export default router;
