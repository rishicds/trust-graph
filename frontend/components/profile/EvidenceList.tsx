"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

import { profile as profileCopy } from "@/constants";
import { cn } from "@/lib/utils";
import { PublicProfile } from "@/lib/api";

type EvidenceItem = NonNullable<PublicProfile["evidence"]>[number];

function formatEvidenceTitle(item: EvidenceItem) {
  if (item.count && item.count > 0) {
    return `${item.title} (${item.count})`;
  }
  return item.title;
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{formatEvidenceTitle(item)}</p>
        <p className="mt-0.5 text-sm capitalize text-muted">{item.platform}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.verified && (
          <span className="text-xs font-medium text-teal">{profileCopy.evidence.verified}</span>
        )}
        {item.url && <ExternalLink className="h-4 w-4 text-muted" />}
      </div>
    </>
  );

  if (item.url) {
    return (
      <li>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-3 px-2 py-2 text-sm transition hover:bg-[#FAFAFA]"
        >
          {content}
        </a>
      </li>
    );
  }

  return <li className="flex items-start justify-between gap-3 px-2 py-2 text-sm">{content}</li>;
}

type EvidenceListProps = {
  evidence: EvidenceItem[];
  defaultOpen?: boolean;
  embedded?: boolean;
};

export function EvidenceList({ evidence, defaultOpen = true, embedded = false }: EvidenceListProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (evidence.length === 0) return null;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={cn(!embedded && "mt-8 border-t border-border pt-6")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {profileCopy.evidence.title}
          </h2>
          <p className="text-[11px] text-muted">
            {evidence.length} {profileCopy.evidence.countSuffix}
          </p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="mt-2 divide-y divide-border border border-border">
          {evidence.map((item, i) => (
            <EvidenceRow key={`${item.title}-${item.platform}-${i}`} item={item} />
          ))}
        </ul>
      )}
    </Wrapper>
  );
}
