import type { DitherAlgorithm } from "@/presets/default";
import {
  DEFAULT_ALGORITHM,
  DEFAULT_THRESHOLD,
  EXPORT_DPI,
  SVG_EXPORT_MAX_SIZE,
} from "@/presets/default";

/**
 * Versionshanterad graveringsprofil.
 * machineHints lämnas tom tills värden verifierats med fysiska tester.
 */
export type EngravingProfile = {
  id: string;
  version: number;
  label: string;
  material: "oak";
  laser: {
    type: "diode";
    nominalPowerW: number;
  };
  physical: {
    /** Standardbredd i mm när användaren inte anger storlek. */
    defaultWidthMm: number;
    /** Nominell raster-DPI för storleksberäkning från pixlar. */
    dpi: number;
  };
  raster: {
    /**
     * Max sidlängd för preview, SVG och PNG vid profilstyrd export.
     * Samma värde ger nära paritet mellan förhandsvisning och fil.
     */
    maxSize: number;
  };
  dither: {
    algorithm: DitherAlgorithm;
    threshold: number;
  };
  prepare: {
    /** auto = BG-remove när analys föreslår det. */
    removeBackground: "auto" | "off" | "on";
  };
  /** Ofylld tills gravyrtester på ek låst hastighet/effekt/passes. */
  machineHints: null;
};

export const OAK_5W_DIODE_V1: EngravingProfile = {
  id: "oak-5w-diode",
  version: 1,
  label: "Ek · 5 W diodlaser",
  material: "oak",
  laser: {
    type: "diode",
    nominalPowerW: 5,
  },
  physical: {
    defaultWidthMm: 80,
    dpi: EXPORT_DPI,
  },
  raster: {
    maxSize: SVG_EXPORT_MAX_SIZE,
  },
  dither: {
    algorithm: DEFAULT_ALGORITHM,
    threshold: DEFAULT_THRESHOLD,
  },
  prepare: {
    removeBackground: "auto",
  },
  machineHints: null,
};

/** Aktiv standardprofil för gravyr. */
export const DEFAULT_ENGRAVING_PROFILE: EngravingProfile = OAK_5W_DIODE_V1;

export function profileLabel(profile: EngravingProfile): string {
  return `${profile.label} (v${profile.version})`;
}

/** Effektiv DPI efter att bitmap skalats till given mm-bredd. */
export function effectiveDpi(
  widthPx: number,
  widthMm: number,
): number {
  if (!(widthPx > 0) || !(widthMm > 0)) return EXPORT_DPI;
  return (widthPx / widthMm) * 25.4;
}
