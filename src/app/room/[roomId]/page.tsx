"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds);
  const sec = seconds % 60;

  // TODO : improvement is possible
  return `${mins}:${sec.toString()}`;
}

const Page = () => {
  const param = useParams();
  const roomId = param.roomId;

  const [copyStatus, setCopyStatus] = useState("Copy");
  const [timeRaining, setTimeRemaining] = useState<number | null>(null);

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
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copyStatus}
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500 uppercase">
              {" "}
              Self-Destruct
            </span>
            <span
              className={`text-sm font-bold flex items-center gap-2 ${
                timeRaining != null && timeRaining < 60
                  ? "text-red-500"
                  : "text-green-500"
              } `}
            >
              {timeRaining != null ? formatTimeRemaining(timeRaining) : "--:--"}
            </span>
          </div>
        </div>
        <button className="text-sm bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded  text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50 uppercase">
          Destroy Now
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 -----"></div>

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
                  // future code
                  setInput("");
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              type="text"
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <button className=" bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-pointer">
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
