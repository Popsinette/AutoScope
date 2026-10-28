import { expect, type Page } from "@playwright/test";
import { makeDemoPdf } from "../../prisma/demo-data/pdf";

export async function signUp(page: Page, name = "Testeur") {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/inscription");
  await page.getByLabel("Prénom ou pseudo").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("motdepasse-e2e-solide");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/tableau-de-bord/);
  return email;
}

export async function addVehicle(page: Page, make = "Peugeot", model = "308", mileage = "45000") {
  await page.goto("/garage/nouveau");
  await page.getByLabel("Marque").fill(make);
  await page.locator("#model").fill(model);
  await page.getByLabel("Année").fill("2019");
  await page.getByLabel("Énergie").selectOption("DIESEL");
  await page.getByLabel("Transmission").selectOption("MANUELLE");
  await page.getByLabel("Kilométrage actuel (km)").fill(mileage);
  await page.getByRole("button", { name: "Ajouter le véhicule" }).click();
  await expect(page).toHaveURL(/\/garage\/(?!nouveau)[a-z0-9]+\?ok=|\/garage\/(?!nouveau)[a-z0-9]+$/);
  return page.url().split("/garage/")[1].split("?")[0];
}

export const pdfFile = (name = "facture.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from(makeDemoPdf(["Facture de test E2E"])),
});
