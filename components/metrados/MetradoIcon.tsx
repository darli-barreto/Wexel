import Image from "next/image";
import { memo } from "react";

export type MetradoIconName =
  | "template" | "review" | "preview" | "restore" | "header" | "new-item"
  | "detail" | "blank-row" | "units" | "delete-row" | "items" | "levels" | "collapse"
  | "expand" | "summary" | "steel-sheet" | "steel" | "stirrup" | "slab"
  | "column" | "wood" | "calculation" | "style" | "layout" | "worksheet"
  | "import" | "export" | "csv" | "clear";

/** Fixed SVG slots keep ribbon geometry stable and do not subscribe to cell state. */
export default memo(function MetradoIcon({ name, size = "small" }: { name: MetradoIconName; size?: "small" | "large" }) {
  const dimension = size === "large" ? 32 : 20;
  return <span aria-hidden="true" data-metrado-icon={name} className={`relative flex shrink-0 items-center justify-center ${size === "large" ? "h-8 w-8" : "h-6 w-6"}`}>
    <Image src={`/icons/metrados/inactive/${name}.svg`} alt="" width={dimension} height={dimension} loading="eager" draggable={false} className="group-hover:invisible group-focus-visible:invisible group-active:invisible group-aria-pressed:invisible" />
    <Image src={`/icons/metrados/${name}.svg`} alt="" width={dimension} height={dimension} loading="eager" draggable={false} className="invisible absolute group-hover:visible group-focus-visible:visible group-active:visible group-aria-pressed:visible" />
  </span>;
});
