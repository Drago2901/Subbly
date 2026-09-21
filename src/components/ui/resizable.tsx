import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "group relative flex w-1 items-center justify-center bg-transparent transition-colors duration-150 select-none z-30 " +
        // Visual line in center
        "before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-[1px] before:bg-border/60 group-hover:before:bg-[#FF6B2C] group-active:before:bg-[#FF6B2C] " +
        // Comfortable hit target
        "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 " +
        // Vertical panel group overrides (horizontal divider between top/bottom)
        "data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full " +
        "data-[panel-group-direction=vertical]:before:inset-x-0 data-[panel-group-direction=vertical]:before:top-1/2 data-[panel-group-direction=vertical]:before:-translate-y-1/2 data-[panel-group-direction=vertical]:before:h-[1px] data-[panel-group-direction=vertical]:before:w-full " +
        "data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-3 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 " +
        "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize " +
        "focus-visible:outline-none",
      className
    )}
    {...props}
  />
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
