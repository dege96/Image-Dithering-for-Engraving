import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENGRAVING_PROFILE,
  OAK_5W_DIODE_V1,
  effectiveDpi,
  profileLabel,
} from "@/presets/engravingProfile";
import { SVG_EXPORT_MAX_SIZE } from "@/presets/default";

describe("engravingProfile", () => {
  it("defines oak 5W diode v1 with versioned defaults", () => {
    expect(OAK_5W_DIODE_V1.id).toBe("oak-5w-diode");
    expect(OAK_5W_DIODE_V1.version).toBe(1);
    expect(OAK_5W_DIODE_V1.material).toBe("oak");
    expect(OAK_5W_DIODE_V1.laser.nominalPowerW).toBe(5);
    expect(OAK_5W_DIODE_V1.physical.defaultWidthMm).toBe(80);
    expect(OAK_5W_DIODE_V1.raster.maxSize).toBe(SVG_EXPORT_MAX_SIZE);
    expect(OAK_5W_DIODE_V1.machineHints).toBeNull();
    expect(DEFAULT_ENGRAVING_PROFILE).toBe(OAK_5W_DIODE_V1);
  });

  it("formats profile label with version", () => {
    expect(profileLabel(OAK_5W_DIODE_V1)).toBe("Ek · 5 W diodlaser (v1)");
  });

  it("computes effective DPI after downscale", () => {
    // 1000 px over 80 mm → 317.5 DPI
    expect(effectiveDpi(1000, 80)).toBeCloseTo(317.5, 5);
  });
});
