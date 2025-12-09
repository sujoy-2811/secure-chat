import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

const room = new Elysia({ prefix: "/room" }).post("/create", () => {
  console.log("Create a new room. ");
});

const app = new Elysia({ prefix: "/api" })
  .get("/user", {
    user: { name: "Sujoy" },
  })
  .use(room);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;
