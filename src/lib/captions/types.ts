export type Word = {
  text: string;
  start: number;
  end: number;
  type?: string;
};

export type Caption = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type CaptionStyle = {
  fontFamily: string;
  fontSize: number; // px relative to 1080p height
  color: string; // hex
  bgOpacity: number; // 0..1
  bgColor: string; // hex
  position: "top" | "middle" | "bottom";
  bold: boolean;
  uppercase: boolean;
};

export const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: "Inter",
  fontSize: 56,
  color: "#FFFFFF",
  bgOpacity: 0.55,
  bgColor: "#000000",
  position: "bottom",
  bold: true,
  uppercase: false,
};

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Bebas Neue",
  "Montserrat",
  "Anton",
  "Roboto",
  "Georgia",
  "Impact",
];
