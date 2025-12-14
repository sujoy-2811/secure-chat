"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${mins}:${
    sec.toString().length < 2 ? 0 + sec.toString() : sec.toString()
  }`;
}

const Page = () => {
  const param = useParams();
  const roomId = param.roomId as string;
  const { username } = useUsername();

  const router = useRouter();

  const [copyStatus, setCopyStatus] = useState("Copy");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining == null || timeRemaining < 0) return;

    if (timeRemaining == 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null || prev < 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });

      return res.data;
    },
  });

  const { mutate: seendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    },
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const copyLink = () => {
    const url = window.location.href;

    navigator.clipboard.writeText(url);
    setCopyStatus("Copied!");

    setTimeout(() => {
      setCopyStatus("Copy");
    }, 2000);
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30 ">
        <div className="flex items-center gap-4">
          <div className="flex flex-col ">
            <span className="text-xs text-zinc-500 uppercase">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 ">{roomId}</span>
              <button
                onClick={copyLink}
                className="relative group text-[10px] bg-zinc-800 hover:bg-zinc-700
             px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200
             transition-colors"
              >
                {copyStatus}

                {/* Tooltip */}
                <span
                  className="absolute left-1/2 top-1 translate-y-full -translate-x-1/2 mt-1
               rounded-md bg-zinc-900 border border-zinc-700
               px-2 py-1 text-xs font-medium text-zinc-200
               opacity-0 group-hover:opacity-100
               transition-opacity duration-200
               pointer-events-none whitespace-nowrap shadow-lg"
                >
                  Share the link with a friend or open it in incognito.
                </span>
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500 uppercase">
              Self-Destruct
            </span>
            <span
              className={`text-sm font-bold flex items-center gap-2 ${
                timeRemaining != null && timeRemaining < 60
                  ? "text-red-500"
                  : "text-green-500"
              } `}
            >
              {timeRemaining != null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>
        <button
          onClick={() => destroyRoom()}
          className="text-sm bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded  text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50 uppercase"
        >
          Destroy Now
        </button>
      </header>

      {/* Message Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm font-mono">
              No messages yet, start the conversation.
            </p>
          </div>
        )}

        {messages?.messages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start">
            <div className="max-w-[80%] group">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className={` text-sm font-bold ${
                    msg.sender === username ? "text-green-500" : "text-blue-500"
                  }`}
                >
                  {msg.sender === username ? "You" : msg.sender}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {" "}
                  {format(msg.timestamp, "HH:mm")}
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed break-all">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input section for messages */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">
              {">"}
            </span>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Enter" && input.trim()) {
                  seendMessage({ text: input });
                  setInput("");
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              type="text"
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <button
            onClick={() => {
              seendMessage({ text: input });
              setInput("");
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isPending}
            className=" bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-pointer"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
