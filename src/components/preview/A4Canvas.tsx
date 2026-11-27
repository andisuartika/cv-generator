import type { ReactNode, Ref } from "react";

type A4CanvasProps = {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/** Fixed-size A4 sheet (794x1123 px). Grows downward when content is longer. */
export function A4Canvas({ children, ref }: A4CanvasProps) {
  return (
    <div ref={ref} className="a4-canvas mx-auto flex flex-col shadow-lg">
      {children}
    </div>
  );
}
