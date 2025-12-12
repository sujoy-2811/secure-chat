import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import z from "zod";
import { Bodoni_Moda } from "next/font/google";

const ROOM_TTL_SECONDS = 60 * 10;
const room = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();

  await redis.hset(`meta:${roomId}`, {
    connected: [],
    createdAt: Date.now(),
  });

  await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);

  console.log("new room is created with id ", roomId);

  return { roomId };
});

const messages = new Elysia({ prefix: "/message" }).use(authMiddleware).post(
  "/",
  async ({ body, auth }) => {
    const { roomId } = auth;
    const { sender, text } = body;
    const roomExists = await redis.exists(`meta:${roomId}`);
  },
  {
    query: z.object({ roomId: z.string() }),
    body: z.object({
      sender: z.string().max(100),
      text: z.string().max(100),
    }),
  }
);

const app = new Elysia({ prefix: "/api" }).use(room).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;
