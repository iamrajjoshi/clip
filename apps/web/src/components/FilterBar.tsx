import { useEffect, useState } from "react";
import type { ClipKind } from "@/content/schema";

type Props = {
  kinds: ClipKind[];
};

export default function FilterBar({ kinds }: Props) {
  if (kinds.length === 0) {
    return null;
  }

  const [activeKinds, setActiveKinds] = useState<ClipKind[]>(kinds);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("clip-filters:change", {
        detail: {
          kinds: activeKinds,
        },
      }),
    );
  }, [activeKinds]);

  function toggleKind(kind: ClipKind) {
    setActiveKinds((current) => {
      return current.includes(kind)
        ? current.filter((value) => value !== kind)
        : [...current, kind];
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
    </div>
  );
}
