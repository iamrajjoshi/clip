import { useEffect, useState } from "react";
import type { ClipKind } from "@/content/schema";

type TagCount = {
  tag: string;
  count: number;
};

type Props = {
  kinds: ClipKind[];
  tagCounts: TagCount[];
};

export default function FilterBar({ kinds, tagCounts }: Props) {
  if (kinds.length === 0 && tagCounts.length === 0) {
    return null;
  }

  const [activeKinds, setActiveKinds] = useState<ClipKind[]>(kinds);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("clip-filters:change", {
        detail: {
          kinds: activeKinds,
          tags: activeTags,
        },
      }),
    );
  }, [activeKinds, activeTags]);

  function toggleKind(kind: ClipKind) {
    setActiveKinds((current) => {
      return current.includes(kind)
        ? current.filter((value) => value !== kind)
        : [...current, kind];
    });
  }

  function toggleTag(tag: string) {
    setActiveTags((current) => {
      return current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag];
    });
  }

  return (
    <div className="section-block mt-0 pt-6">
      <div className="flex flex-wrap gap-2">
        {kinds.map((kind) => (
          <button
            key={kind}
            className="kind-toggle mono-button text-sm"
            data-active={activeKinds.includes(kind)}
            onClick={() => toggleKind(kind)}
            type="button"
          >
            {kind}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tagCounts.map(({ tag, count }) => (
          <button
            key={tag}
            className="tag-toggle mono-button text-sm"
            data-active={activeTags.includes(tag)}
            onClick={() => toggleTag(tag)}
            type="button"
          >
            #{tag} <span className="ml-2 text-[var(--text-dim)]">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
