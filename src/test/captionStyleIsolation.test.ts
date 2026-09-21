import { describe, it, expect } from "vitest";
import { DEFAULT_STYLE, type Caption, type CaptionStyle } from "@/lib/captions/types";

describe("Caption Track Style Isolation", () => {
  it("changing font of a caption on Track 1 does not affect captions on Track 2", () => {
    let style: CaptionStyle = { ...DEFAULT_STYLE, fontFamily: "Inter" };
    let track2Style: CaptionStyle = { ...DEFAULT_STYLE, position: "top", posY: 0.18, fontFamily: "Bebas Neue" };

    let captions: Caption[] = [
      {
        id: "cap-1",
        start: 0,
        end: 2,
        text: "Track 1 Caption",
        track: 1,
        style: { ...DEFAULT_STYLE, fontFamily: "Inter" },
      },
      {
        id: "cap-2",
        start: 0,
        end: 2,
        text: "Track 2 Caption",
        track: 2,
        style: { ...DEFAULT_STYLE, fontFamily: "Bebas Neue", position: "top", posY: 0.18 },
      },
    ];

    // User selects cap-1 and changes font to "Playfair Display"
    const selectedCaptionId = "cap-1";
    const nextStyle: CaptionStyle = { ...style, fontFamily: "Playfair Display" };

    const selected = captions.find((c) => c.id === selectedCaptionId);
    const targetTrack = selected ? (selected.track || 1) : 1;
    const baseTrack = targetTrack === 2 ? track2Style : style;

    if (targetTrack === 2) {
      track2Style = nextStyle;
    } else {
      style = nextStyle;
    }

    captions = captions.map((c) => {
      const cTrack = c.track || 1;
      if (cTrack !== targetTrack) {
        return c;
      }
      if (selectedCaptionId) {
        if (c.id === selectedCaptionId) {
          const existing = c.style || baseTrack;
          const updatedStyle = { ...nextStyle };
          if (existing.position !== undefined) updatedStyle.position = existing.position;
          if (existing.posX !== undefined) updatedStyle.posX = existing.posX;
          if (existing.posY !== undefined) updatedStyle.posY = existing.posY;
          return { ...c, style: updatedStyle };
        }
        return c;
      }
      return c;
    });

    // Verification
    const cap1 = captions.find((c) => c.id === "cap-1")!;
    const cap2 = captions.find((c) => c.id === "cap-2")!;

    expect(cap1.style?.fontFamily).toBe("Playfair Display");
    expect(style.fontFamily).toBe("Playfair Display");

    // Track 2 must remain completely unchanged!
    expect(cap2.style?.fontFamily).toBe("Bebas Neue");
    expect(track2Style.fontFamily).toBe("Bebas Neue");
  });

  it("changing font of a caption on Track 2 does not affect captions on Track 1", () => {
    let style: CaptionStyle = { ...DEFAULT_STYLE, fontFamily: "Inter" };
    let track2Style: CaptionStyle = { ...DEFAULT_STYLE, position: "top", posY: 0.18, fontFamily: "Outfit" };

    let captions: Caption[] = [
      {
        id: "cap-1",
        start: 0,
        end: 2,
        text: "Track 1 Caption",
        track: 1,
        style: { ...DEFAULT_STYLE, fontFamily: "Inter" },
      },
      {
        id: "cap-2",
        start: 0,
        end: 2,
        text: "Track 2 Caption",
        track: 2,
        style: { ...DEFAULT_STYLE, fontFamily: "Outfit", position: "top", posY: 0.18 },
      },
    ];

    // User selects cap-2 and changes font to "Montserrat"
    const selectedCaptionId = "cap-2";
    const nextStyle: CaptionStyle = { ...track2Style, fontFamily: "Montserrat" };

    const selected = captions.find((c) => c.id === selectedCaptionId);
    const targetTrack = selected ? (selected.track || 1) : 1;
    const baseTrack = targetTrack === 2 ? track2Style : style;

    if (targetTrack === 2) {
      track2Style = nextStyle;
    } else {
      style = nextStyle;
    }

    captions = captions.map((c) => {
      const cTrack = c.track || 1;
      if (cTrack !== targetTrack) {
        return c;
      }
      if (selectedCaptionId) {
        if (c.id === selectedCaptionId) {
          const existing = c.style || baseTrack;
          const updatedStyle = { ...nextStyle };
          if (existing.position !== undefined) updatedStyle.position = existing.position;
          if (existing.posX !== undefined) updatedStyle.posX = existing.posX;
          if (existing.posY !== undefined) updatedStyle.posY = existing.posY;
          return { ...c, style: updatedStyle };
        }
        return c;
      }
      return c;
    });

    const cap1 = captions.find((c) => c.id === "cap-1")!;
    const cap2 = captions.find((c) => c.id === "cap-2")!;

    expect(cap2.style?.fontFamily).toBe("Montserrat");
    expect(track2Style.fontFamily).toBe("Montserrat");

    // Track 1 must remain completely unchanged!
    expect(cap1.style?.fontFamily).toBe("Inter");
    expect(style.fontFamily).toBe("Inter");
  });

  it("Apply to All on Track 1 never touches Track 2 captions", () => {
    let style: CaptionStyle = { ...DEFAULT_STYLE, fontFamily: "Inter" };
    let track2Style: CaptionStyle = { ...DEFAULT_STYLE, position: "top", posY: 0.18, fontFamily: "Pacifico" };

    let captions: Caption[] = [
      {
        id: "cap-1a",
        start: 0,
        end: 2,
        text: "Track 1 First",
        track: 1,
        style: { ...DEFAULT_STYLE, fontFamily: "Inter" },
      },
      {
        id: "cap-1b",
        start: 2,
        end: 4,
        text: "Track 1 Second",
        track: 1,
        style: { ...DEFAULT_STYLE, fontFamily: "Inter" },
      },
      {
        id: "cap-2",
        start: 0,
        end: 3,
        text: "Track 2 Caption",
        track: 2,
        style: { ...DEFAULT_STYLE, fontFamily: "Pacifico", position: "top", posY: 0.18 },
      },
    ];

    const selectedCaptionId = "cap-1a";
    const nextStyle: CaptionStyle = { ...style, fontFamily: "Cinzel" };

    const selected = captions.find((c) => c.id === selectedCaptionId);
    const targetTrack = selected ? (selected.track || 1) : 1;
    const baseTrack = targetTrack === 2 ? track2Style : style;

    if (targetTrack === 2) {
      track2Style = nextStyle;
    } else {
      style = nextStyle;
    }

    captions = captions.map((c) => {
      const cTrack = c.track || 1;
      if (cTrack !== targetTrack) return c;

      const existing = c.style || baseTrack;
      const updatedStyle = { ...nextStyle };
      if (existing.position !== undefined) updatedStyle.position = existing.position;
      if (existing.posX !== undefined) updatedStyle.posX = existing.posX;
      if (existing.posY !== undefined) updatedStyle.posY = existing.posY;
      return { ...c, style: updatedStyle };
    });

    expect(captions.find((c) => c.id === "cap-1a")!.style?.fontFamily).toBe("Cinzel");
    expect(captions.find((c) => c.id === "cap-1b")!.style?.fontFamily).toBe("Cinzel");

    // Track 2 caption remains untouched
    expect(captions.find((c) => c.id === "cap-2")!.style?.fontFamily).toBe("Pacifico");
  });

  it("resolves baseTrackStyle correctly for preview and render when style is absent", () => {
    const style: CaptionStyle = { ...DEFAULT_STYLE, fontFamily: "Track1Font" };
    const track2Style: CaptionStyle = { ...DEFAULT_STYLE, position: "top", posY: 0.18, fontFamily: "Track2Font" };

    const track1Caption: Caption = {
      id: "t1",
      start: 0,
      end: 2,
      text: "Track 1",
      track: 1,
    };

    const track2Caption: Caption = {
      id: "t2",
      start: 0,
      end: 2,
      text: "Track 2",
      track: 2,
    };

    const resolveItemStyle = (item: Caption) => {
      const baseTrackStyle = item.track === 2 ? (track2Style || { ...style, position: "top", posY: 0.18 }) : style;
      return item.style ? { ...baseTrackStyle, ...item.style } : baseTrackStyle;
    };

    const t1Style = resolveItemStyle(track1Caption);
    const t2Style = resolveItemStyle(track2Caption);

    expect(t1Style.fontFamily).toBe("Track1Font");
    expect(t2Style.fontFamily).toBe("Track2Font");
  });
});
