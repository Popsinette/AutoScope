import { describe, expect, it } from "vitest";
import type { ExplorerModel } from "@/components/viewer3d/types";
import { assetUrl, catalogEntryFor, resolveVehicleModel, setAssetBase } from "@/lib/vehicle-models";

const gt3 = { make: "Porsche", model: "911 GT3", trim: "992", year: 2023 };
const clio = { make: "Renault", model: "Clio", trim: null, year: 2018 };

describe("association véhicule → modèle 3D", () => {
  it("reconnaît les véhicules du catalogue", () => {
    expect(catalogEntryFor(gt3)?.id).toBe("porsche-911-gt3-992");
    expect(catalogEntryFor({ ...gt3, trim: null, year: 2015 })).toBeNull(); // 991 : pas la même génération
    expect(catalogEntryFor({ make: "peugeot", model: "106 Rallye", trim: null, year: 1997 })?.id).toBe("peugeot-106");
    expect(catalogEntryFor(clio)).toBeNull();
  });

  it("présente le modèle générique comme tel, avec le modèle dédié en préférence", () => {
    const { model, preferred } = resolveVehicleModel(gt3, null);
    expect(model.id).toBe("car-concept");
    expect(model.isIllustrative).toBe(true);
    expect(model.notice).toContain("il ne représente pas votre Porsche 911 GT3 992");
    expect(preferred?.id).toBe("porsche-911-gt3-992");
    expect(preferred?.notice).toBeNull();
    expect(resolveVehicleModel(clio, null).preferred).toBeNull();
  });

  it("le modèle importé par l'utilisateur prime, sauf demande explicite du modèle de présentation", () => {
    const own = { id: "m1", kind: "GLB", name: "Mon modèle", url: "/x.glb", isIllustrative: false, source: "", license: "", mapping: {} } as ExplorerModel;
    expect(resolveVehicleModel(gt3, own)).toEqual({ model: own, preferred: null });
    const forced = resolveVehicleModel(gt3, own, { forceGeneric: true });
    expect(forced.model.id).toBe("car-concept");
    expect(forced.preferred).toBeNull();
  });

  it("sans véhicule, la mention reste générique", () => {
    expect(resolveVehicleModel(null, null).model.notice).toBe(
      "Modèle de présentation générique. Transmission, suspensions, refroidissement, échappement et électronique sont des organes illustratifs ajoutés par CarView.",
    );
  });

  it("préfixe les fichiers selon l'hébergement", () => {
    setAssetBase("/AutoScope");
    expect(assetUrl("models/car-concept.glb")).toBe("/AutoScope/models/car-concept.glb");
    setAssetBase("/");
    expect(assetUrl("/models/a.glb")).toBe("/models/a.glb");
  });
});
