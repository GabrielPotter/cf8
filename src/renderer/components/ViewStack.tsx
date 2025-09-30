import React from "react";

/** Keep-alive view stack: all panels stay mounted, non-active ones are hidden. */
export interface ViewStackProps<T extends string> {
  activeId: T;
  children: Array<{ id: T; node: React.ReactNode }>;
}

export function ViewStack<T extends string>({ activeId, children }: ViewStackProps<T>) {
  return (
    <>
      {children.map((c) => (
        <div
          key={c.id}
          className="viewstack-panel"
          role="tabpanel"
          aria-hidden={c.id !== activeId}
          hidden={c.id !== activeId}
          style={{ height: "100%" }}
        >
          {c.node}
        </div>
      ))}
    </>
  );
}
