import { describe, expect, it } from "vitest";
import { inspectGlb, sanitizeNodeName, suggestComponentSlug } from "@/lib/gltf";
import { appearanceFor, explodeDirection, modeAvailability, modeToReveal, type PartInfo } from "@/lib/viewer-modes";
import { makeTestGlb } from "../helpers/glb";
import { DEMO_NODE_MAPPING } from "@/lib/demo-model";
import { COMPONENTS } from "../../prisma/demo-data/components";

const body: PartInfo = { family: "CARROSSERIE", system: "EXTERIEUR", electronicKind: null };
const engine: PartInfo = { family: "MOTEUR", system: "MECANIQUE", electronicKind: null };
const ecu: PartInfo = { family: "ELECTRONIQUE", system: "ELECTRONIQUE", electronicKind: "CALCULATEUR" };

describe("modes de l'explorateur", () => {
  it("apparence selon le mode", () => {
    expect(appearanceFor("exterieur", engine)).toEqual({ visible: false });
    expect(appearanceFor("exterieur", body)).toEqual({ visible: true, style: "original" });
    expect(appearanceFor("transparent", body)).toEqual({ visible: true, style: "ghost" });
    expect(appearanceFor("mecanique", engine)).toEqual({ visible: true, style: "family" });
    expect(appearanceFor("mecanique", ecu)).toEqual({ visible: false });
    expect(appearanceFor("electronique", ecu)).toEqual({ visible: true, style: "electronic" });
    expect(appearanceFor("eclatee", engine)).toEqual({ visible: true, style: "original" });
  });

  it("une carrosserie seule ne permet pas les modes internes", () => {
    const parts = [body];
    expect(modeAvailability("exterieur", parts, 1).available).toBe(true);
    for (const m of ["transparent", "mecanique", "electronique", "complete", "eclatee"] as const) {
      expect(modeAvailability(m, parts, 1).available).toBe(false);
    }
  });

  it("le modèle de démonstration active tous les modes", () => {
    const bySlug = new Map(COMPONENTS.map((c) => [c.slug, c]));
    const parts = Object.values(DEMO_NODE_MAPPING).map((slug) => {
      const c = bySlug.get(slug);
      expect(c, `fiche manquante pour ${slug}`).toBeDefined();
      return { family: c!.family, system: c!.system, electronicKind: c!.electronicKind ?? null };
    });
    for (const m of ["exterieur", "transparent", "mecanique", "electronique", "complete", "eclatee"] as const) {
      expect(modeAvailability(m, parts, Object.keys(DEMO_NODE_MAPPING).length).available).toBe(true);
    }
  });

  it("révèle une pièce cachée sélectionnée depuis la liste", () => {
    expect(modeToReveal("exterieur", ecu)).toBe("electronique");
    expect(modeToReveal("exterieur", engine)).toBe("transparent");
    expect(modeToReveal("mecanique", engine)).toBe("mecanique");
  });

  it("direction d'éclatement normalisée et orientée vers l'extérieur", () => {
    const [x, y, z] = explodeDirection([0, 0, 0], [0, 0, 2], "MOTEUR");
    expect(z).toBeGreaterThan(0.99);
    expect(Math.abs(x) + Math.abs(y)).toBeLessThan(1e-9);
    expect(explodeDirection([0, 0, 0], [0, 0, 0], null)).toEqual([0, 1, 0]);
  });
});

describe("import GLB", () => {
  it("lit les noms de nœuds d'un GLB valide", () => {
    const glb = makeTestGlb([
      { name: "Body Shell", translation: [0, 0.5, 0] },
      { name: "Brake_Disc_FL", translation: [0.8, 0.3, 1.4] },
    ]);
    expect(inspectGlb(glb)).toEqual({ ok: true, nodeNames: ["Body Shell", "Brake_Disc_FL"], meshCount: 1, generator: "CarView test fixture" });
  });

  it("refuse les fichiers invalides", () => {
    expect(inspectGlb(new TextEncoder().encode("pas un glb du tout")).ok).toBe(false);
    const glb = makeTestGlb([{ name: "A", translation: [0, 0, 0] }]);
    new DataView(glb.buffer).setUint32(4, 1, true);
    expect(inspectGlb(glb)).toMatchObject({ ok: false });
  });

  it("normalise les noms comme GLTFLoader et suggère des fiches", () => {
    expect(sanitizeNodeName("Body Shell.001")).toBe("Body_Shell001");
    expect(suggestComponentSlug("Brake_Disc_FL")).toBe("disques-frein");
    expect(suggestComponentSlug("Steering_Wheel")).toBe("volant");
    expect(suggestComponentSlug("Wheel_RR")).toBe("jantes");
    expect(suggestComponentSlug("Cube.004")).toBeNull();
  });
});
