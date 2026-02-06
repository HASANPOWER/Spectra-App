import { Platform } from "react-native";

export type PersonaType = "family" | "work" | "ghost" | "neutral";

export const PersonaColorsDark = {
  family: {
    primary: "#FF8C42",
    primaryDark: "#D97232",
    background: "#1A1412",
    surface: "#2D1F1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#FFD4B8",
    accent: "#FFAB73",
  },
  work: {
    primary: "#3B82F6",
    primaryDark: "#1E3A8A",
    background: "#0A0E1A",
    surface: "#151B2E",
    textPrimary: "#FFFFFF",
    textSecondary: "#93A3D1",
    accent: "#60A5FA",
  },
  ghost: {
    primary: "#00FF41",
    primaryDark: "#00CC34",
    background: "#000000",
    surface: "#1A1A1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#7FFF9F",
    accent: "#39FF14",
  },
  neutral: {
    primary: "#FFFFFF",
    primaryDark: "#CCCCCC",
    background: "#0A0A0A",
    surface: "#1A1A1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#888888",
    accent: "#666666",
  },
};

export const PersonaColorsLight = {
  family: {
    primary: "#FF8C42",
    primaryDark: "#D97232",
    background: "#FFF8F3",
    surface: "#FFF0E6",
    textPrimary: "#1A1412",
    textSecondary: "#8B5A3C",
    accent: "#FFAB73",
  },
  work: {
    primary: "#3B82F6",
    primaryDark: "#1E3A8A",
    background: "#F0F6FF",
    surface: "#E0EDFF",
    textPrimary: "#0A0E1A",
    textSecondary: "#3D5A80",
    accent: "#60A5FA",
  },
  ghost: {
    primary: "#00CC34",
    primaryDark: "#00AA2A",
    background: "#F0FFF4",
    surface: "#E0FFE8",
    textPrimary: "#0A1A0E",
    textSecondary: "#2D5A3A",
    accent: "#39FF14",
  },
  neutral: {
    primary: "#333333",
    primaryDark: "#111111",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    textPrimary: "#111111",
    textSecondary: "#666666",
    accent: "#888888",
  },
};

export const PersonaColors = PersonaColorsDark;

const tintColorLight = "#007AFF";
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: "#11181C",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#007AFF",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F2F2F2",
    backgroundSecondary: "#E6E6E6",
    backgroundTertiary: "#D9D9D9",
  },
  dark: {
    text: "#ECEDEE",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#0A84FF",
    backgroundRoot: "#0A0A0A",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#333333",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
