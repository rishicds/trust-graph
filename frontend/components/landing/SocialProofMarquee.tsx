"use client";

import { Code, Code2, Mic2, Trophy, Users } from "lucide-react";

import { Marquee } from "@/components/ui/marquee";
import { landing } from "@/constants";

const platformIcons: Record<string, React.ReactNode> = {
  GitHub: <Code className="h-5 w-5" />,
  "Stack Overflow": <Code2 className="h-5 w-5" />,
  Devpost: <Trophy className="h-5 w-5" />,
  LinkedIn: <Users className="h-5 w-5" />,
  "Conference talks": <Mic2 className="h-5 w-5" />,
};

export function SocialProof() {
  const { socialProof } = landing;

  return (
    <section className="border-y border-border bg-white py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-sm text-muted">{socialProof.title}</p>
        <Marquee pauseOnHover className="[--duration:30s]">
          {socialProof.platforms.map((name) => (
            <div
              key={name}
              className="mx-4 flex items-center gap-2 rounded-full border border-border bg-[#FAFAFA] px-5 py-2.5 text-sm font-medium text-[#666666]"
            >
              <span className="text-teal">{platformIcons[name]}</span>
              {name}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
