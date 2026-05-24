import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters")
});

export const workspaceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/)
});

export const boardSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(240).optional(),
  visibility: z.enum(["workspace", "private"]).default("workspace")
});

export const taskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(6000).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional()
});

export const taskUpdateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(6000).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional().or(z.literal(""))
});

export const commentSchema = z.object({
  body: z.string().min(1, "Write a comment first").max(4000)
});

export const subtaskSchema = z.object({
  title: z.string().min(2).max(180)
});

export const subtaskToggleSchema = z.object({
  is_complete: z.boolean()
});

export const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email()
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member")
});

export const reorderTaskSchema = z.object({
  taskId: z.string().uuid(),
  columnId: z.string().uuid(),
  position: z.number().int().min(0)
});
