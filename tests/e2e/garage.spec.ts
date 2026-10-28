import { expect, test } from "@playwright/test";
import { addVehicle, signUp } from "./helpers";

test("@mobile création de compte, ajout d'un véhicule retrouvé après rechargement", async ({ page }) => {
  await signUp(page);
  await expect(page.getByText("Commencez par ajouter votre voiture")).toBeVisible();

  // Validation serveur : un VIN invalide est refusé et les saisies sont conservées.
  await page.goto("/garage/nouveau");
  await page.getByLabel("Marque").fill("Peugeot");
  await page.locator("#model").fill("308");
  await page.getByLabel("Année").fill("2019");
  await page.getByLabel("Énergie").selectOption("DIESEL");
  await page.getByLabel("Transmission").selectOption("MANUELLE");
  await page.getByLabel("Kilométrage actuel (km)").fill("45000");
  await page.getByLabel("Numéro VIN").fill("INVALIDE");
  await page.getByRole("button", { name: "Ajouter le véhicule" }).click();
  await expect(page.getByText("Le VIN comporte 17 caractères")).toBeVisible();
  await expect(page.getByLabel("Marque")).toHaveValue("Peugeot");

  const id = await addVehicle(page, "Renault", "Clio", "30000");
  await expect(page.getByRole("heading", { name: "Renault Clio" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Renault Clio" })).toBeVisible();
  await page.goto("/garage");
  await expect(page.locator("main").getByRole("link", { name: /Renault Clio/ })).toHaveAttribute("href", `/garage/${id}`);
});

test("déconnexion puis reconnexion", async ({ page }) => {
  const email = await signUp(page);
  await page.getByRole("button", { name: /Se déconnecter/ }).first().click();
  await expect(page).toHaveURL(/connexion/);
  await page.goto("/garage");
  await expect(page).toHaveURL(/connexion/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
  await page.getByLabel("Mot de passe").fill("motdepasse-e2e-solide");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/tableau-de-bord/);
});

test("export puis suppression du compte et de ses fichiers", async ({ page }) => {
  const email = await signUp(page);
  const vehicleId = await addVehicle(page, "Mazda", "MX-5", "80000");
  const exported = await (await page.request.get("/api/compte/export")).json();
  expect(exported.user.email).toBe(email);
  expect(exported.vehicles.map((v: { id: string }) => v.id)).toEqual([vehicleId]);

  await page.goto("/parametres");
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Saisissez/).fill(email);
  await dialog.getByLabel("Mot de passe").fill("motdepasse-e2e-solide");
  await dialog.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/connexion/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("motdepasse-e2e-solide");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
});
