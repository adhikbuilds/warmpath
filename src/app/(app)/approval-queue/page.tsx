"use client";

import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const QUEUE_ITEMS = [
  {
    id: "james-1",
    group: "Via James Liu",
    groupCount: 2,
    items: [
      {
        id: "sarah-jenkins",
        name: "Sarah Jenkins",
        title: "VP Engineering at Stripe",
        warmth: 94,
        tag: "Rippling Overlap",
        time: "2h ago",
        active: true,
      },
      {
        id: "michael-chen",
        name: "Michael Chen",
        title: "Founder at Stealth Startup",
        warmth: 88,
        tag: "Angel Investor",
        time: "5h ago",
        active: false,
      },
    ],
  },
  {
    id: "elena-1",
    group: "Via Elena Rodriguez",
    groupCount: 1,
    items: [
      {
        id: "david-park",
        name: "David Park",
        title: "Partner at Sequoia",
        warmth: 76,
        tag: "Board Member",
        time: "1d ago",
        active: false,
      },
    ],
  },
];

export default function ApprovalQueuePage() {
  const activeItem = QUEUE_ITEMS[0].items[0];

  return (
    <AppShell activeNav="queue">
      <main className="flex-1 flex h-full" style={{ backgroundColor: "#131315" }}>
        {/* Left Pane: Queue List (35%) */}
        <div
          className="w-[35%] min-w-[320px] max-w-[400px] border-r flex flex-col z-10"
          style={{
            borderColor: "#464554",
            backgroundColor: "#131315",
          }}
        >
          {/* Queue Header */}
          <div
            className="h-12 border-b flex items-center justify-between px-4 shrink-0"
            style={{
              borderColor: "#464554",
            }}
          >
            <h2 className="font-medium text-sm text-[#e5e1e4]">Pending Intros</h2>
            <div className="flex gap-2">
              <button className="p-1 text-[#c7c4d7] hover:text-[#e5e1e4] transition-colors">
                ⚙️
              </button>
              <button className="p-1 text-[#c7c4d7] hover:text-[#e5e1e4] transition-colors">
                ⋮
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto">
            {QUEUE_ITEMS.map((group) => (
              <div key={group.id}>
                {/* Group Header */}
                <div
                  className="px-4 py-2 border-b sticky top-0 z-10"
                  style={{
                    borderColor: "#464554",
                    backgroundColor: "#0e0e10",
                  }}
                >
                  <span className="text-xs text-[#c7c4d7] uppercase tracking-widest">
                    {group.group} ({group.groupCount})
                  </span>
                </div>

                {/* Group Items */}
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 border-b border-l-2 cursor-pointer transition-colors ${
                      item.active ? "border-l-[#8083ff]" : "border-l-transparent hover:border-l-[#464554]"
                    }`}
                    style={{
                      borderBottomColor: "#464554",
                      backgroundColor: item.active ? "#201f22" : "#131315",
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm text-[#e5e1e4]">{item.name}</h3>
                      <span className="text-xs text-[#c7c4d7]">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#c7c4d7] mb-2">{item.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                        style={{
                          backgroundColor: "rgba(78, 222, 163, 0.1)",
                          color: "#4edea3",
                          borderColor: "rgba(78, 222, 163, 0.2)",
                        }}
                      >
                        🔥 {item.warmth} Warmth
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: "#353437",
                          color: "#c7c4d7",
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Review Dashboard (65%) */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top App Bar */}
          <div
            className="h-12 border-b flex items-center justify-between px-6 shrink-0 sticky top-0 z-20"
            style={{
              borderColor: "#464554",
              backgroundColor: "#131315",
            }}
          >
            <div className="flex items-center gap-4">
              <h2 className="font-medium text-sm text-[#e5e1e4]">Review Request: {activeItem.name}</h2>
              <span
                className="px-2 py-0.5 rounded text-xs border"
                style={{
                  backgroundColor: "#353437",
                  color: "#c7c4d7",
                  borderColor: "#464554",
                }}
              >
                ID: REQ-8821
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-8 px-3 flex items-center justify-center border rounded text-sm hover:bg-[#201f22] transition-colors"
                style={{
                  borderColor: "#464554",
                  color: "#e5e1e4",
                }}
              >
                📜 View History
              </button>
              <button
                className="h-8 w-8 flex items-center justify-center border rounded hover:bg-[#201f22] transition-colors"
                style={{
                  borderColor: "#464554",
                  color: "#e5e1e4",
                }}
              >
                ⋮
              </button>
            </div>
          </div>

          {/* Content Canvas */}
          <div className="p-6 max-w-[800px] mx-auto w-full flex flex-col gap-8">
            {/* Path Context Banner */}
            <div className="grid grid-cols-3 gap-1">
              {/* Target Card */}
              <div
                className="col-span-2 border rounded p-4 flex flex-col justify-between"
                style={{
                  borderColor: "#464554",
                  backgroundColor: "#1c1b1d",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#c7c4d7] uppercase tracking-widest">Target Node</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#e5e1e4]">{activeItem.name}</h3>
                  <p className="text-sm text-[#c7c4d7] mt-1">{activeItem.title}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href="#"
                    className="text-[#8083ff] hover:text-[#c0c1ff] text-xs flex items-center gap-1 transition-colors"
                  >
                    🔗 LinkedIn
                  </a>
                </div>
              </div>

              {/* Path Connector Card */}
              <div
                className="col-span-1 border rounded p-4 flex flex-col justify-between relative overflow-hidden"
                style={{
                  borderColor: "#464554",
                  backgroundColor: "#1c1b1d",
                }}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10" style={{ fontSize: "64px" }}>
                  🛣️
                </div>
                <div>
                  <span className="text-xs text-[#c7c4d7] uppercase tracking-widest">Strongest Path</span>
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      alt="James Liu"
                      className="w-6 h-6 rounded-full border object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVMpDHEbEVxBPXddSUpSExLevvamIlyGydck0Xh1IzHQuzVqEWbDl9yQSehrGtZsVHxICQDgxuEyKl8svHzOYeRDg7wCgjhwG1eIDO9zuB0lSVWzz7MSLYgAgFKIaI2k2Qqn7P4psUKD1BlIWva8TMEAau5YC2IoPRltwbkGCZsjE95Gayv1q4uT1wTQrNHVHHzkjHpkAVoSAJPbNfUYn4GhLvdv-c1Ltv4D2fZi567zC2-2f7l_yMYUYjpPzDq7EEQNxpKSo7EJVq"
                      style={{ borderColor: "#464554" }}
                    />
                    <span className="font-medium text-sm text-[#e5e1e4]">James Liu</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                    style={{
                      backgroundColor: "rgba(78, 222, 163, 0.1)",
                      color: "#4edea3",
                      borderColor: "rgba(78, 222, 163, 0.2)",
                    }}
                  >
                    🔥 94 Warmth
                  </span>
                  <p className="text-xs text-[#c7c4d7] mt-1">2yr overlap at Rippling</p>
                </div>
              </div>
            </div>

            {/* Message Editor Section */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <h3 className="font-medium text-sm text-[#e5e1e4] flex items-center gap-2">
                  <span>✨</span>
                  AI Draft Generation
                </h3>
                <span className="text-xs text-[#c7c4d7]">Editing as James Liu</span>
              </div>

              {/* Editor */}
              <div
                className="border rounded overflow-hidden flex flex-col"
                style={{
                  borderColor: "#464554",
                  backgroundColor: "#1c1b1d",
                }}
              >
                {/* Formatting Toolbar */}
                <div
                  className="h-10 border-b flex items-center px-2 gap-1"
                  style={{
                    borderColor: "#464554",
                    backgroundColor: "#201f22",
                  }}
                >
                  {["B", "I", "🔗"].map((btn) => (
                    <button
                      key={btn}
                      className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#2a2a2c] rounded transition-colors text-sm"
                    >
                      {btn}
                    </button>
                  ))}
                  <div
                    className="w-px h-4"
                    style={{ backgroundColor: "#464554" }}
                  />
                  {["•", "1"].map((btn) => (
                    <button
                      key={btn}
                      className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#2a2a2c] rounded transition-colors text-sm"
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                {/* Subject Line */}
                <div
                  className="border-b px-4 py-2 flex items-center gap-2"
                  style={{
                    borderColor: "#464554",
                    backgroundColor: "#0e0e10",
                  }}
                >
                  <span className="text-xs text-[#c7c4d7]">Subject:</span>
                  <input
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm text-[#e5e1e4] outline-none"
                    type="text"
                    defaultValue="Catching up + quick intro to WarmPath VC"
                  />
                </div>

                {/* Editor Body */}
                <div
                  className="p-4 min-h-[240px]"
                  style={{ backgroundColor: "#0e0e10" }}
                >
                  <textarea
                    className="w-full h-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#e5e1e4] resize-none outline-none leading-relaxed"
                    rows={10}
                    defaultValue={`Hey Sarah,

Hope things are going well at Stripe! It's been a while since our days at Rippling. I saw the recent launch of the new billing API – looked like a massive undertaking, congrats to you and the team.

I'm reaching out because I'm currently working with a portfolio company at WarmPath VC that's building some interesting dev tools in the payments infrastructure space. Given your background, I thought it might be right up your alley.

Would you be open to a brief intro to their founder? No pressure either way, but I think you'd enjoy the technical challenge they are tackling.

Best,
James`}
                  />
                </div>

                {/* AI Footer */}
                <div
                  className="px-4 py-2 flex items-center justify-between border-t"
                  style={{
                    borderColor: "#464554",
                    backgroundColor: "#201f22",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#4edea3" }}
                    />
                    <span className="text-xs text-[#c7c4d7]">Draft optimized for high response rate</span>
                  </div>
                  <button className="text-xs text-[#8083ff] hover:text-[#c0c1ff] flex items-center gap-1 transition-colors">
                    🔄 Regenerate Tone
                  </button>
                </div>
              </div>
            </div>

            {/* Action Console */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#464554" }}>
              <div className="flex gap-3">
                <button
                  className="h-8 px-4 flex items-center justify-center border rounded text-sm hover:bg-[#201f22] transition-colors"
                  style={{
                    borderColor: "#464554",
                    color: "#e5e1e4",
                  }}
                >
                  Re-route Path
                </button>
                <button
                  className="h-8 px-4 flex items-center justify-center border rounded text-sm hover:bg-[#201f22] transition-colors"
                  style={{
                    borderColor: "#464554",
                    color: "#e5e1e4",
                  }}
                >
                  Discard
                </button>
              </div>
              <button
                className="h-8 px-6 flex items-center justify-center font-medium text-sm rounded text-white hover:opacity-90 transition-colors"
                style={{
                  backgroundColor: "#4edea3",
                  color: "#131315",
                  boxShadow: "0 0 15px rgba(78, 222, 163, 0.1)",
                }}
              >
                <span className="mr-2">✉️</span>
                Approve & Send via James
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
