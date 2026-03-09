declare module "react-dom/client" {
  import type { ReactNode } from "react";

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: object
  ): Root;

  export function hydrateRoot(
    container: Element | Document,
    initialChildren: ReactNode,
    options?: object
  ): Root;
}
