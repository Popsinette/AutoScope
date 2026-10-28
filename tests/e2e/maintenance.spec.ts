import { expect, test } from "@playwright/test";
import { addVehicle, pdfFile, signUp } from "./helpers";

test("@mobile entretien avec facture, modification et mise à jour des dépenses", async ({ page, request }) => {
  await signUp(page);
  const vehicleId = await addVehicle(page);

  await page.goto(`/entretiens/nouveau?v=${vehicleId}`);
  await page.locator("#mileage").fill("46000");
  await page.getByLabel("Catégorie").selectOption("REVISION");
  await page.getByLabel("Description").fill("Révision annuelle E2E");
  await page.getByLabel("Pièces (€)").fill("100");
  await page.getByLabel("Main-d'œuvre (€)").fill("50,50");
  await page.getByRole("button", { name: "Ajouter une pièce" }).click();
  await page.getByLabel("Nom de la pièce 1").fill("Filtre à huile");
  await page.getByLabel("Factures, photos, documents").setInputFiles(pdfFile());
  await page.getByRole("button", { name: "Enregistrer l’intervention" }).click();

  await expect(page.getByRole("heading", { name: "Révision annuelle E2E" })).toBeVisible();
  await expect(page.getByText("Filtre à huile")).toBeVisible();
  await expect(page.getByText("facture.pdf")).toBeVisible();
  const downloadHref = await page.getByRole("link", { name: /Télécharger/ }).first().getAttribute("href");
  const response = await page.request.get(downloadHref!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  // Sans session, le document est inaccessible.
  expect((await request.get(downloadHref!)).status()).toBe(401);

  await page.goto(`/depenses?v=${vehicleId}&annee=toutes`);
  await expect(page.getByTestId("expense-total")).toHaveText("150,50 €");

  // Modification de l'intervention : la dépense liée est recalculée, pas dupliquée.
  await page.goto(`/entretiens?v=${vehicleId}`);
  await page.getByRole("link", { name: /Révision annuelle E2E/ }).click();
  await page.getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Pièces (€)").fill("200");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("La dépense liée a été recalculée")).toBeVisible();
  await page.goto(`/depenses?v=${vehicleId}&annee=toutes`);
  await expect(page.getByTestId("expense-total")).toHaveText("250,50 €");
  await expect(page.getByText("1 ligne")).toBeVisible();

  // Kilométrage du véhicule mis à jour par l'intervention.
  await page.goto(`/garage/${vehicleId}`);
  await expect(page.locator("main").getByText("46 000 km").first()).toBeVisible();

  // Export CSV.
  const csv = await page.request.get(`/api/depenses/export?v=${vehicleId}&annee=toutes`);
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("250,50;Intervention");
});

test("suppression d'une intervention avec confirmation", async ({ page }) => {
  await signUp(page);
  const vehicleId = await addVehicle(page);
  await page.goto(`/entretiens/nouveau?v=${vehicleId}`);
  await page.locator("#mileage").fill("45100");
  await page.getByLabel("Catégorie").selectOption("VIDANGE");
  await page.getByLabel("Description").fill("Vidange à supprimer");
  await page.getByLabel("Pièces (€)").fill("80");
  await page.getByRole("button", { name: "Enregistrer l’intervention" }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("dialog")).toContainText("Supprimer cette intervention ?");
  await page.getByRole("dialog").getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("heading", { name: "Vidange à supprimer" })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Aucune intervention enregistrée")).toBeVisible();
  await page.goto(`/depenses?v=${vehicleId}&annee=toutes`);
  await expect(page.getByTestId("expense-total")).toHaveText("0,00 €");
});
