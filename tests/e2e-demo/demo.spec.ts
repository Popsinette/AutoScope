import { expect, test } from "@playwright/test";
import { makeDemoPdf } from "../../prisma/demo-data/pdf";

test("le jeu de démonstration est prêt et un véhicule ajouté survit au rechargement", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Bonjour Visiteur" })).toBeVisible();
  await expect(page.getByText("Démo hors ligne")).toBeVisible();
  await expect(page.locator("main").getByText("Porsche 911 GT3 (992)").first()).toBeVisible();

  await page.goto("garage/nouveau");
  await page.getByLabel("Marque").fill("Renault");
  await page.locator("#model").fill("Clio");
  await page.getByLabel("Année").fill("2019");
  await page.getByLabel("Énergie").selectOption("DIESEL");
  await page.getByLabel("Transmission").selectOption("MANUELLE");
  await page.getByLabel("Kilométrage actuel (km)").fill("30000");
  await page.getByRole("button", { name: "Ajouter le véhicule" }).click();
  await expect(page.getByRole("heading", { name: "Renault Clio" })).toBeVisible();
  await expect(page.getByText("Véhicule ajouté à votre garage.")).toBeVisible();
  // Lien direct + rechargement : données relues depuis le navigateur.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Renault Clio" })).toBeVisible();
});

test("entretien avec facture puis modification : dépense recalculée", async ({ page }) => {
  await page.goto("garage/nouveau");
  await page.getByLabel("Marque").fill("Mazda");
  await page.locator("#model").fill("MX-5");
  await page.getByLabel("Année").fill("2020");
  await page.getByLabel("Énergie").selectOption("ESSENCE");
  await page.getByLabel("Transmission").selectOption("MANUELLE");
  await page.getByLabel("Kilométrage actuel (km)").fill("20000");
  await page.getByRole("button", { name: "Ajouter le véhicule" }).click();
  const vehicleId = new URL(page.url()).pathname.split("/").pop();

  await page.goto(`entretiens/nouveau?v=${vehicleId}`);
  await page.locator("#mileage").fill("21000");
  await page.getByLabel("Catégorie").selectOption("VIDANGE");
  await page.getByLabel("Description").fill("Vidange démo");
  await page.getByLabel("Pièces (€)").fill("60");
  await page.getByLabel("Main-d'œuvre (€)").fill("40");
  await page.getByLabel("Factures, photos, documents").setInputFiles({ name: "facture.pdf", mimeType: "application/pdf", buffer: Buffer.from(makeDemoPdf(["Test"])) });
  await page.getByRole("button", { name: "Enregistrer l’intervention" }).click();
  await expect(page.getByRole("heading", { name: "Vidange démo" })).toBeVisible();
  await expect(page.getByText("facture.pdf")).toBeVisible();
  await expect(page.getByRole("link", { name: /Télécharger/ }).first()).toHaveAttribute("href", /^blob:/);

  await page.goto(`depenses?v=${vehicleId}&annee=toutes`);
  await expect(page.getByTestId("expense-total")).toHaveText("100,00 €");
  await page.goBack();
  await page.getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Pièces (€)").fill("160");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("La dépense liée a été recalculée")).toBeVisible();
  await page.goto(`depenses?v=${vehicleId}&annee=toutes`);
  await expect(page.getByTestId("expense-total")).toHaveText("200,00 €");
  await expect(page.getByText("1 ligne")).toBeVisible();
});

test("vue 3D : sélection d'une pièce et fiche", async ({ page, isMobile }) => {
  await page.goto("vue-3d?demo=1");
  const scene = page.getByTestId("scene-container");
  await expect(scene).toHaveAttribute("data-ready", "1", { timeout: 60_000 });
  if (isMobile) await page.getByRole("button", { name: "Pièces" }).click();
  await page.getByRole("button", { name: "Disques de frein" }).click();
  await expect(scene).toHaveAttribute("data-selected", "disques-frein");
  await expect(page.getByRole("heading", { name: "Disques de frein" })).toBeVisible();
  // Les interventions du véhicule sélectionné liées à ce composant apparaissent dans la fiche.
  await page.getByRole("button", { name: "Fermer la fiche" }).click();
  await page.getByRole("button", { name: "Vue éclatée", exact: true }).click();
  await expect(scene).toHaveAttribute("data-mode", "eclatee");
});

test("réinitialisation de la démo", async ({ page }) => {
  await page.goto("parametres");
  await page.getByRole("button", { name: "Tout effacer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Tout effacer" }).click();
  await expect(page.getByText("Commencez par ajouter votre voiture")).toBeVisible();
  await page.goto("parametres");
  await page.getByRole("button", { name: "Réinitialiser" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Visiteur" })).toBeVisible();
  await expect(page.locator("main").getByText("Porsche 911 GT3 (992)").first()).toBeVisible();
});
