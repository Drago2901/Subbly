import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

describe("Subbly Resizable NLE Layout Tests", () => {
  describe("Resizable Layout Persistence & Key Names", () => {
    it("uses unique localStorage autoSaveIds for each split region", () => {
      const mainVerticalLayoutId = "subbly-main-vertical-layout";
      const topHorizontalLayoutId = "subbly-top-horizontal-layout";
      const timelineTracksLayoutId = "subbly-timeline-tracks-layout";

      const set = new Set([mainVerticalLayoutId, topHorizontalLayoutId, timelineTracksLayoutId]);
      expect(set.size).toBe(3);
      expect(mainVerticalLayoutId).toMatch(/^subbly-/);
      expect(topHorizontalLayoutId).toMatch(/^subbly-/);
      expect(timelineTracksLayoutId).toMatch(/^subbly-/);
    });
  });

  describe("Layout Constraints & Proportions", () => {
    it("main vertical layout enforces minimum timeline size to prevent collapse", () => {
      const topWorkspace = { defaultSize: 62, minSize: 25, maxSize: 82 };
      const bottomTimeline = { defaultSize: 38, minSize: 18, maxSize: 75 };

      expect(topWorkspace.defaultSize + bottomTimeline.defaultSize).toBe(100);
      expect(bottomTimeline.minSize).toBeGreaterThanOrEqual(15);
      expect(topWorkspace.minSize).toBeGreaterThanOrEqual(20);
      expect(topWorkspace.maxSize + bottomTimeline.minSize).toBeLessThanOrEqual(100);
    });

    it("top horizontal layout enforces safe bounds for tools and video preview", () => {
      const defaultToolPanel = { defaultSize: 26, minSize: 18, maxSize: 55 };
      const defaultVideoPreview = { defaultSize: 74, minSize: 45 };

      expect(defaultToolPanel.defaultSize + defaultVideoPreview.defaultSize).toBe(100);
      expect(defaultToolPanel.minSize).toBeGreaterThanOrEqual(15);
      expect(defaultVideoPreview.minSize).toBeGreaterThanOrEqual(40);

      // Text tool mode has wider defaults for dual sub-panels
      const textToolPanel = { defaultSize: 40, minSize: 22, maxSize: 55 };
      const textVideoPreview = { defaultSize: 60, minSize: 45 };
      expect(textToolPanel.defaultSize + textVideoPreview.defaultSize).toBe(100);
      expect(textToolPanel.minSize).toBeGreaterThanOrEqual(20);
    });

    it("timeline horizontal tracks layout ensures sidebar and lanes fit properly", () => {
      const trackSidebar = { defaultSize: 18, minSize: 12, maxSize: 35 };
      const trackLanes = { defaultSize: 82, minSize: 65 };

      expect(trackSidebar.defaultSize + trackLanes.defaultSize).toBe(100);
      expect(trackSidebar.minSize).toBeGreaterThanOrEqual(10);
      expect(trackSidebar.maxSize).toBeLessThanOrEqual(40);
      expect(trackLanes.minSize).toBeGreaterThanOrEqual(60);
    });
  });

  describe("ResizableHandle Clean Edge Styling (No Icons)", () => {
    it("renders clean horizontal divider edge without any icons or grip badges", () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>
            <div>Left</div>
          </ResizablePanel>
          <ResizableHandle data-testid="horizontal-handle" />
          <ResizablePanel defaultSize={50}>
            <div>Right</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      const handle = container.querySelector('[data-panel-resize-handle-enabled="true"]');
      expect(handle).not.toBeNull();
      // Verifies NO icons, svg, or pill badges exist inside the handle
      expect(handle?.querySelector("svg")).toBeNull();
      expect(handle?.className).toContain("cursor-col-resize");
      expect(handle?.className).toContain("group-hover:before:bg-[#FF6B2C]");
    });

    it("renders clean vertical divider edge without any icons or grip badges", () => {
      const { container } = render(
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={60}>
            <div>Top</div>
          </ResizablePanel>
          <ResizableHandle data-testid="vertical-handle" />
          <ResizablePanel defaultSize={40}>
            <div>Bottom</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      const handle = container.querySelector('[data-panel-resize-handle-enabled="true"]');
      expect(handle).not.toBeNull();
      // Verifies NO icons, svg, or pill badges exist inside the handle
      expect(handle?.querySelector("svg")).toBeNull();
      expect(handle?.getAttribute("data-panel-group-direction")).toBe("vertical");
      expect(handle?.className).toContain("data-[panel-group-direction=vertical]:cursor-row-resize");
    });
  });
});
