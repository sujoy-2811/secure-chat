import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);

  if (!roomMatch) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  console.log(roomMatch);

  const roomId = roomMatch[1];

  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    `meta:${roomId}`
  );
  console.log("🚀 ~ proxy ~ meta:", meta);

  // no room is found
  if (!meta) {
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  }

  const existingToken = req.cookies.get("x-auth-token")?.value;
  console.log("🚀 ~ proxy ~ existingToken:", existingToken);

  //  USER is allowed to join room
  if (existingToken && meta.connected.includes(existingToken)) {
    console.log("already allowd");

    return NextResponse.next();
  }

  // User is not allowed to join room
  if (meta.connected.length > 2) {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  const respose = NextResponse.next();
  const token = nanoid();

  respose.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  console.log("Setting");

  await redis.hset(`meta:${roomId}`, {
    connected: [...meta.connected, token],
  });

  return respose;
};

export const config = {
  matcher: "/room/:path*",
};
