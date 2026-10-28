/**
 * Véhicule générique de démonstration : noms des nœuds 3D et correspondance
 * avec les fiches de composants (slug). Ce fichier est la « table de
 * correspondance » du modèle procédural ; un modèle GLB importé utilise
 * exactement le même mécanisme (table ComponentMapping en base).
 */
export const DEMO_MODEL_ID = "demo-procedural-v1";

export const DEMO_NODE_MAPPING: Record<string, string> = {
  // Carrosserie
  Body_Shell: "caisse",
  Body_Roof: "caisse",
  Hood: "capot",
  Door_L: "portieres",
  Door_R: "portieres",
  Bumper_F: "pare-chocs-avant",
  Bumper_R: "pare-chocs-arriere",
  Glass_Windshield: "vitrage",
  Glass_Rear: "vitrage",
  Glass_Side_L: "vitrage",
  Glass_Side_R: "vitrage",
  Headlight_L: "optiques-avant",
  Headlight_R: "optiques-avant",
  Taillight_L: "feux-arriere",
  Taillight_R: "feux-arriere",
  Spoiler: "aileron",
  // Moteur
  Engine_Block: "bloc-moteur",
  Engine_Head: "bloc-moteur",
  Air_Intake: "admission",
  // Transmission
  Gearbox: "boite-de-vitesses",
  Driveshaft: "arbre-de-transmission",
  Differential: "differentiel",
  // Freinage
  Brake_Disc_FL: "disques-frein",
  Brake_Disc_FR: "disques-frein",
  Brake_Disc_RL: "disques-frein",
  Brake_Disc_RR: "disques-frein",
  Brake_Caliper_FL: "etriers-frein",
  Brake_Caliper_FR: "etriers-frein",
  Brake_Caliper_RL: "etriers-frein",
  Brake_Caliper_RR: "etriers-frein",
  // Suspension
  Damper_FL: "amortisseurs",
  Damper_FR: "amortisseurs",
  Damper_RL: "amortisseurs",
  Damper_RR: "amortisseurs",
  Wishbone_FL: "triangles",
  Wishbone_FR: "triangles",
  Wishbone_RL: "triangles",
  Wishbone_RR: "triangles",
  // Direction
  Steering_Rack: "cremaillere",
  Steering_Column: "colonne-direction",
  // Refroidissement
  Radiator: "radiateur",
  Coolant_Hose_Upper: "durites",
  Coolant_Hose_Lower: "durites",
  // Échappement
  Exhaust_Pipe: "ligne-echappement",
  Muffler: "silencieux",
  // Roues
  Tire_FL: "pneumatiques",
  Tire_FR: "pneumatiques",
  Tire_RL: "pneumatiques",
  Tire_RR: "pneumatiques",
  Rim_FL: "jantes",
  Rim_FR: "jantes",
  Rim_RL: "jantes",
  Rim_RR: "jantes",
  // Électronique
  ECU: "calculateur-moteur",
  ABS_Module: "module-abs",
  Battery: "batterie",
  Alternator: "alternateur",
  Harness_Main: "faisceau-principal",
  Harness_Rear: "faisceau-principal",
  Harness_Wheels: "faisceau-principal",
  WheelSpeed_Sensor_FL: "capteurs-vitesse-roue",
  WheelSpeed_Sensor_FR: "capteurs-vitesse-roue",
  WheelSpeed_Sensor_RL: "capteurs-vitesse-roue",
  WheelSpeed_Sensor_RR: "capteurs-vitesse-roue",
  Lambda_Sensor: "sonde-lambda",
  Injectors: "injecteurs",
  Starter: "demarreur",
  // Habitacle
  Seat_L: "sieges",
  Seat_R: "sieges",
  Dashboard: "tableau-de-bord",
  Steering_Wheel: "volant",
};
