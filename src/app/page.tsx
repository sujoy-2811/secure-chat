"use client";

import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { ChangeEvent, useEffect, useState } from "react";

const USERNAME_STORAGE_KEY = "chat_username";
const UUID_STORAGE_KEY = "chat_uuid";
const UUID = nanoid(3);

export default function Home() {
  const [username, setUsername] = useState("");
  const [uuid, setUuid] = useState("");

  function saveUsernameHandler(event: ChangeEvent<HTMLInputElement>): void {
    setUsername(event.target.value);
    localStorage.setItem(USERNAME_STORAGE_KEY, event.target.value);
  }

  useEffect(() => {
    const stored_name = localStorage.getItem(USERNAME_STORAGE_KEY);
    const stored_uuid = localStorage.getItem(UUID_STORAGE_KEY);
    if (stored_name) {
      setUsername(stored_name);
    }
    if (stored_uuid) {
      setUuid(stored_uuid);
    } else {
      localStorage.setItem(UUID_STORAGE_KEY, UUID);
      setUuid(UUID);
    }
  }, []);

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold  text-green-500">
            {">SECURE CHAT"}
          </h1>
          <p className="text-zinc-500 text-sm">
            A secure, self-destructing chat room
          </p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="flex items-center text-zinc-500"
              >
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <input
                  value={username}
                  onChange={saveUsernameHandler}
                  id="username"
                  className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono"
                />
                <span className="  pointer-none:">{uuid}</span>
              </div>
            </div>
            <button
              onClick={() => createRoom()}
              className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50 "
            >
              Create Secure Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
