import { expect, test } from "@playwright/test";
import { makeTestGlb } from "../helpers/glb";
import { addVehicle, signUp } from "./helpers";

test("@mobile un véhicule sans modèle affiche un état explicite", async ({ page }) => {
  await signUp(page);
  const vehicleId = await addVehicle(page);
  await page.goto(`/vue-3d?v=${vehicleId}`);
  await expect(page.getByRole("heading", { name: "Aucun modèle 3D pour ce véhicule" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("@mobile scène 3D de démonstration : sélection d'une pièce et fiche", async ({ page, isMobile }) => {
  await signUp(page);
  await page.goto("/vue-3d?demo=1");
  const scene = page.getByTestId("scene-container");
  await expect(scene).toHaveAttribute("data-ready", "1", { timeout: 60_000 });
  await expect(page.getByText("Véhicule générique de démonstration").first()).toBeVisible();

  // Sélection au clic / toucher dans la scène (vue initiale : la carrosserie occupe le centre).
  const box = (await scene.locator("canvas").boundingBox())!;
  if (isMobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(scene).not.toHaveAttribute("data-selected", "");
  await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: /Caisse|Capot|Vitrage|Portières/ })).toBeVisible();
  await page.getByRole("button", { name: "Fermer la fiche" }).click();

  // Sélection depuis la liste accessible : la pièce interne est révélée.
  if (isMobile) await page.getByRole("button", { name: "Pièces" }).click();
  await page.getByRole("button", { name: "Calculateur moteur (ECU)" }).click();
  await expect(scene).toHaveAttribute("data-selected", "calculateur-moteur");
  await expect(scene).toHaveAttribute("data-mode", "electronique");
  await expect(page.getByRole("heading", { name: "Calculateur moteur (ECU)" })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Voir la fiche complète" }).click();
  await expect(page.getByText("Pilote l’injection").or(page.getByText("Pilote l'injection"))).toBeVisible();
  await expect(page.getByText("Source et fiabilité")).toBeVisible();
  await expect(page.getByText("Générique", { exact: true })).toBeVisible();
});

test("modes d'affichage, vues de caméra et vue éclatée", async ({ page }) => {
  await signUp(page);
  await page.goto("/vue-3d?demo=1");
  const scene = page.getByTestId("scene-container");
  await expect(scene).toHaveAttribute("data-ready", "1", { timeout: 60_000 });
  for (const [label, key] of [
    ["Transparent", "transparent"],
    ["Mécanique", "mecanique"],
    ["Électronique", "electronique"],
    ["Vue complète", "complete"],
    ["Vue éclatée", "eclatee"],
  ] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(scene).toHaveAttribute("data-mode", key);
  }
  await expect(page.getByLabel("Légende")).toHaveCount(0);
  const slider = page.getByLabel("Séparation");
  await expect(slider).toBeVisible();
  await slider.fill("1");
  await expect(slider).toHaveValue("1");
  await page.getByRole("button", { name: "Rassembler" }).click();
  await expect(slider).toHaveValue("0");
  await page.getByRole("button", { name: "Électronique", exact: true }).click();
  await expect(page.getByLabel("Légende")).toContainText("Calculateurs (ECU)");
  for (const view of ["Avant", "Arrière", "Profil", "Dessus", "Intérieur"]) await page.getByRole("button", { name: view, exact: true }).click();
  await page.getByRole("button", { name: "Réinitialiser la caméra" }).click();

  // Masquer une famille depuis l'arborescence.
  await page.getByRole("button", { name: "Masquer la famille Carrosserie" }).click();
  await expect(page.getByRole("button", { name: "Afficher la famille Carrosserie" })).toBeVisible();
});

test("import d'un GLB, correspondances et modes disponibles selon le contenu", async ({ page }) => {
  await signUp(page);
  const vehicleId = await addVehicle(page);
  await page.goto(`/vue-3d/import?v=${vehicleId}`);
  const glb = makeTestGlb([
    { name: "Body Shell", translation: [0, 0.7, 0], scale: [1.8, 0.8, 4.4] },
    { name: "Engine_Block", translation: [0, 0.5, 1.3], scale: [0.6, 0.4, 0.6] },
    { name: "Brake_Disc_FL", translation: [0.7, 0.34, 1.4], scale: [0.05, 0.4, 0.4] },
    { name: "Cube.004", translation: [0, 1.4, 0], scale: [0.2, 0.2, 0.2] },
  ]);
  await page.getByLabel("Fichier GLB").setInputFiles({ name: "test.glb", mimeType: "model/gltf-binary", buffer: Buffer.from(glb) });
  await page.getByLabel("Licence / droit d’usage").fill("Création de test");
  await page.getByLabel("Provenance").fill("Généré par la suite de tests");
  await page.getByLabel("Je confirme disposer du droit d’utiliser ce fichier.").check();
  await page.getByRole("button", { name: "Importer" }).click();

  await expect(page.getByRole("heading", { name: "Correspondances" })).toBeVisible();
  await page.getByRole("button", { name: "Suggérer d’après les noms" }).click();
  await expect(page.getByLabel("Fiche pour Engine_Block")).toHaveValue("bloc-moteur");
  await expect(page.getByLabel("Fiche pour Cube.004")).toHaveValue("");
  await page.getByRole("button", { name: "Enregistrer les correspondances" }).click();
  await expect(page.getByText("3 / 4 associés")).toBeVisible();

  await page.goto(`/vue-3d?v=${vehicleId}`);
  const scene = page.getByTestId("scene-container");
  await expect(scene).toHaveAttribute("data-ready", "1", { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Mécanique", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Électronique", exact: true })).toBeDisabled();
  await expect(page.getByText("1 objet(s) sans fiche")).toBeVisible();
  await page.getByRole("button", { name: "Bloc-moteur et culasse" }).click();
  await expect(scene).toHaveAttribute("data-selected", "bloc-moteur");

  // Un fichier qui n'est pas un GLB est refusé.
  await page.goto(`/vue-3d/import?v=${vehicleId}`);
  await page.getByLabel("Fichier GLB").setInputFiles({ name: "faux.glb", mimeType: "model/gltf-binary", buffer: Buffer.from("pas un modèle") });
  await page.getByLabel("Licence / droit d’usage").fill("Test");
  await page.getByLabel("Provenance").fill("xyz");
  await page.getByLabel("Je confirme disposer du droit d’utiliser ce fichier.").check();
  await page.getByRole("button", { name: "Importer" }).click();
  await expect(page.getByText("Seuls les fichiers GLB")).toBeVisible();
});
