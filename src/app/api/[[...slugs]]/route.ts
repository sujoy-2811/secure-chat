import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import z from "zod";
import { Bodoni_Moda } from "next/font/google";
import { Message, realtime } from "@/lib/realtime";

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

    if (!roomExists) {
      throw new Error("Room does not exist.");
    }

    const message: Message = {
      id: nanoid(),
      sender,
      text,
      timestamp: Date.now(),
      roomId,
    };

    // add message to history
    await redis.rpush(`message:${roomId}`, {
      ...message,
      token: auth.token,
    });

    await realtime.channel(roomId).emit("chat.message", message);

    const remaing = await redis.ttl(`meta:${roomId}`);

    await redis.expire(`message:${roomId}`, remaing);
    await redis.expire(`history:${roomId}`, remaing);
    await redis.expire(roomId, remaing);
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
