import { expect, test } from "@playwright/test";
import { addVehicle, pdfFile, signUp } from "./helpers";

test("un utilisateur ne peut pas accéder aux données d'un autre", async ({ browser }) => {
  const alice = await browser.newPage();
  await signUp(alice, "Alice");
  const vehicleId = await addVehicle(alice, "Alpine", "A110", "12000");
  await alice.goto(`/documents?v=${vehicleId}`);
  await alice.getByLabel("Titre").fill("Carte grise Alice");
  await alice.getByLabel("Fichier").setInputFiles(pdfFile("carte-grise.pdf"));
  await alice.getByRole("button", { name: "Ajouter le document" }).click();
  await expect(alice.getByText("Document ajouté.")).toBeVisible();
  const docHref = await alice.getByRole("link", { name: /Télécharger Carte grise Alice/ }).getAttribute("href");

  const bobContext = await browser.newContext();
  const bob = await bobContext.newPage();
  await signUp(bob, "Bob");

  await bob.goto(`/garage/${vehicleId}`);
  await expect(bob.getByText("Élément introuvable")).toBeVisible();
  await bob.goto(`/garage/${vehicleId}/modifier`);
  await expect(bob.getByText("Élément introuvable")).toBeVisible();
  // Un identifiant étranger en paramètre est ignoré : Bob ne voit pas les documents d'Alice.
  await bob.goto(`/documents?v=${vehicleId}`);
  await expect(bob.getByText("Carte grise Alice")).toHaveCount(0);
  expect((await bob.request.get(docHref!)).status()).toBe(404);
  expect((await bob.request.get(`/api/vehicules/${vehicleId}/photo`)).status()).toBe(404);
  const csv = await bob.request.get(`/api/depenses/export?v=${vehicleId}`);
  expect(csv.status()).toBe(404);
  const exported = await (await bob.request.get("/api/compte/export")).json();
  expect(exported.vehicles).toEqual([]);
  await bobContext.close();
});
