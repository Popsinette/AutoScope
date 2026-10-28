import { expect, test } from "@playwright/test";
import { addVehicle, signUp } from "./helpers";

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

test("échéances par date et kilométrage", async ({ page }) => {
  await signUp(page);
  const vehicleId = await addVehicle(page, "Peugeot", "308", "45000");
  await page.goto(`/echeances?v=${vehicleId}`);

  // Date lointaine mais kilométrage proche : « à prévoir prochainement ».
  await page.getByLabel("Intitulé").fill("Vidange prochaine");
  await page.getByLabel("Catégorie").selectOption("VIDANGE");
  await page.getByLabel("Date limite").fill(inDays(300));
  await page.getByLabel("Kilométrage limite (km)").fill("45600");
  await page.getByRole("button", { name: "Créer l’échéance" }).click();
  await expect(page.getByText("Échéance créée.")).toBeVisible();
  const row = page.getByTestId("reminder-row").filter({ hasText: "Vidange prochaine" });
  await expect(row).toContainText("À prévoir prochainement");
  await expect(row).toContainText("600 km restants");

  // Seuil kilométrique déjà atteint : dépassé.
  await page.getByLabel("Intitulé").fill("Courroie");
  await page.getByLabel("Catégorie").selectOption("REPARATION");
  await page.getByLabel("Kilométrage limite (km)").fill("44000");
  await page.getByRole("button", { name: "Créer l’échéance" }).click();
  await expect(page.getByTestId("reminder-row").filter({ hasText: "Courroie" })).toContainText("Dépassé");

  // Préconisation constructeur sans source : refusée.
  await page.getByLabel("Intitulé").fill("Révision constructeur");
  await page.getByLabel("Catégorie").selectOption("REVISION");
  await page.getByLabel("Origine").selectOption("CONSTRUCTEUR_DOCUMENTE");
  await page.getByLabel("Date limite").fill(inDays(200));
  await page.getByRole("button", { name: "Créer l’échéance" }).click();
  await expect(page.getByText("Une préconisation constructeur doit citer sa source")).toBeVisible();

  // Le tableau de bord signale l'échéance la plus urgente.
  await page.goto(`/tableau-de-bord?v=${vehicleId}`);
  await expect(page.getByRole("heading", { name: "Prochain entretien" })).toBeVisible();
  await expect(page.getByText("Courroie").first()).toBeVisible();

  // Marquer réalisée.
  await page.goto(`/echeances?v=${vehicleId}`);
  await page.getByTestId("reminder-row").filter({ hasText: "Courroie" }).getByRole("button", { name: "Marquer réalisée" }).click();
  await expect(page.getByTestId("reminder-row").filter({ hasText: "Courroie" })).toHaveCount(0);
  await page.goto(`/echeances?v=${vehicleId}&statut=REALISE`);
  await expect(page.getByTestId("reminder-row").filter({ hasText: "Courroie" })).toContainText("Réalisé");
});
