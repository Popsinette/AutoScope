/**
 * Fiches pédagogiques des composants.
 * Fiabilité « GENERIQUE » : principe de fonctionnement valable pour la plupart
 * des véhicules thermiques, sans valeur constructeur. Les caractéristiques
 * chiffrées sont des ordres de grandeur indicatifs, signalés comme tels.
 */
import type { ComponentFamily, ComponentSystem, ElectronicKind, InfoReliability } from "../../src/generated/prisma/enums";

export interface ComponentSeed {
  slug: string;
  name: string;
  family: ComponentFamily;
  system: ComponentSystem;
  electronicKind?: ElectronicKind;
  function: string;
  description: string;
  specs: { label: string; value: string }[];
  reliability: InfoReliability;
}

const GENERIC_SOURCE =
  "Rédaction CarView — principes généraux de technologie automobile. Ordres de grandeur indicatifs, non spécifiques à un modèle.";

export const COMPONENT_SOURCE = GENERIC_SOURCE;

export const COMPONENTS: ComponentSeed[] = [
  // --- Carrosserie ---------------------------------------------------------
  {
    slug: "caisse",
    name: "Caisse et pavillon",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Structure porteuse qui reçoit tous les organes et protège les occupants.",
    description:
      "La caisse autoporteuse assure la rigidité du véhicule et intègre des zones à déformation programmée qui absorbent l'énergie en cas de choc. Le pavillon (toit) contribue à la rigidité torsionnelle et à la protection en cas de retournement.",
    specs: [
      { label: "Matériaux courants", value: "Aciers à haute limite élastique, aluminium, composites" },
      { label: "Rôle sécurité", value: "Cellule de survie et zones d'absorption" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "capot",
    name: "Capot",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Donne accès au compartiment moteur et participe à l'aérodynamique.",
    description:
      "Panneau ouvrant articulé, verrouillé par une serrure et un crochet de sécurité. Sur les véhicules récents, sa structure est conçue pour limiter les blessures d'un piéton heurté.",
    specs: [{ label: "Matériaux courants", value: "Acier, aluminium ou carbone" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "portieres",
    name: "Portières",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Permettent l'accès à l'habitacle et protègent contre les chocs latéraux.",
    description:
      "Chaque portière contient une barre de renfort anti-intrusion, le lève-vitre, la serrure et souvent des capteurs de choc latéral reliés aux airbags.",
    specs: [{ label: "Éléments intégrés", value: "Renfort latéral, lève-vitre, serrure, haut-parleur" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "pare-chocs-avant",
    name: "Bouclier avant",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Absorbe les petits chocs et canalise l'air vers les radiateurs.",
    description:
      "Le bouclier en matériau souple recouvre une poutre de choc métallique. Ses ouvertures alimentent en air le radiateur, l'échangeur et les freins ; il peut accueillir des capteurs de stationnement ou de radar.",
    specs: [{ label: "Matériaux courants", value: "Polypropylène, poutre acier ou aluminium" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "pare-chocs-arriere",
    name: "Bouclier arrière",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Protège l'arrière du véhicule et intègre souvent les sorties d'échappement.",
    description:
      "Comme à l'avant, une peau plastique recouvre une poutre de choc. On y trouve fréquemment les capteurs de recul et un extracteur aérodynamique sur les modèles sportifs.",
    specs: [{ label: "Matériaux courants", value: "Polypropylène, poutre acier ou aluminium" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "vitrage",
    name: "Vitrage",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Assure la visibilité tout en protégeant de l'air et des projections.",
    description:
      "Le pare-brise est en verre feuilleté (il ne se brise pas en éclats) et participe à la rigidité de la caisse. Les vitres latérales et la lunette arrière sont généralement en verre trempé.",
    specs: [
      { label: "Pare-brise", value: "Verre feuilleté" },
      { label: "Vitres latérales", value: "Verre trempé ou feuilleté" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "optiques-avant",
    name: "Optiques avant",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Éclairent la route et signalent le véhicule.",
    description:
      "Les blocs optiques regroupent feux de croisement, de route, de position et clignotants. Les technologies courantes sont l'halogène, le xénon et la LED ; un mauvais réglage peut éblouir les autres usagers.",
    specs: [{ label: "Technologies", value: "Halogène, xénon, LED, matriciel" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "feux-arriere",
    name: "Feux arrière",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Signalent le véhicule, son freinage et ses changements de direction.",
    description: "Les blocs arrière combinent feux de position, stop, clignotants, recul et antibrouillard.",
    specs: [{ label: "Technologies", value: "Ampoules ou LED" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "aileron",
    name: "Aileron arrière",
    family: "CARROSSERIE",
    system: "EXTERIEUR",
    function: "Génère de l'appui aérodynamique sur l'essieu arrière.",
    description:
      "Un aileron dévie le flux d'air vers le haut, ce qui plaque l'arrière du véhicule au sol à haute vitesse et améliore la motricité, au prix d'une traînée accrue.",
    specs: [{ label: "Effet", value: "Appui croissant avec le carré de la vitesse" }],
    reliability: "GENERIQUE",
  },
  // --- Moteur --------------------------------------------------------------
  {
    slug: "bloc-moteur",
    name: "Bloc-moteur et culasse",
    family: "MOTEUR",
    system: "MECANIQUE",
    function: "Transforme l'énergie du carburant en mouvement de rotation.",
    description:
      "Le bloc contient les cylindres où coulissent les pistons, reliés au vilebrequin par les bielles. La culasse ferme les cylindres et porte les soupapes et l'arbre à cames. Dans un moteur 4 temps, chaque cylindre enchaîne admission, compression, combustion-détente et échappement.",
    specs: [
      { label: "Cycle", value: "4 temps (admission, compression, détente, échappement)" },
      { label: "Entretien associé", value: "Vidange, filtre à huile, distribution selon modèle" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "admission",
    name: "Admission d'air",
    family: "MOTEUR",
    system: "MECANIQUE",
    function: "Filtre et dose l'air qui entre dans le moteur.",
    description:
      "L'air passe par la boîte à air et son filtre, puis par le papillon (ou le turbocompresseur et l'échangeur sur un moteur suralimenté) avant d'atteindre le collecteur d'admission. Un filtre encrassé réduit les performances.",
    specs: [{ label: "Entretien associé", value: "Remplacement périodique du filtre à air" }],
    reliability: "GENERIQUE",
  },
  // --- Transmission ----------------------------------------------------------
  {
    slug: "boite-de-vitesses",
    name: "Boîte de vitesses",
    family: "TRANSMISSION",
    system: "MECANIQUE",
    function: "Adapte le couple et le régime du moteur à la vitesse du véhicule.",
    description:
      "La boîte propose plusieurs rapports de démultiplication. Elle peut être manuelle, automatique à convertisseur, à double embrayage (deux embrayages pré-sélectionnant les rapports pairs et impairs) ou à variation continue.",
    specs: [
      { label: "Types", value: "Manuelle, automatique, double embrayage, CVT" },
      { label: "Entretien associé", value: "Vidange selon préconisation constructeur" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "arbre-de-transmission",
    name: "Arbre de transmission",
    family: "TRANSMISSION",
    system: "MECANIQUE",
    function: "Transmet la rotation de la boîte vers le pont arrière.",
    description:
      "Sur une architecture moteur avant et propulsion, l'arbre longitudinal relie la boîte au différentiel arrière. Des joints de cardan ou homocinétiques absorbent les variations d'angle.",
    specs: [{ label: "Architecture illustrée", value: "Moteur avant, propulsion" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "differentiel",
    name: "Différentiel",
    family: "TRANSMISSION",
    system: "MECANIQUE",
    function: "Permet aux roues d'un même essieu de tourner à des vitesses différentes.",
    description:
      "En virage, la roue extérieure parcourt plus de distance que la roue intérieure. Le différentiel répartit le couple tout en autorisant cet écart ; une version à glissement limité améliore la motricité en conduite sportive.",
    specs: [{ label: "Variantes", value: "Ouvert, à glissement limité, piloté" }],
    reliability: "GENERIQUE",
  },
  // --- Freinage --------------------------------------------------------------
  {
    slug: "disques-frein",
    name: "Disques de frein",
    family: "FREINAGE",
    system: "MECANIQUE",
    function: "Surface de friction sur laquelle les plaquettes ralentissent la roue.",
    description:
      "Solidaire du moyeu, le disque transforme l'énergie cinétique en chaleur lorsque les plaquettes le pincent. Les disques ventilés évacuent mieux la chaleur ; une épaisseur minimale, gravée sur le disque, impose son remplacement.",
    specs: [
      { label: "Matériaux", value: "Fonte, carbone-céramique" },
      { label: "Contrôle", value: "Épaisseur minimale gravée par le fabricant" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "etriers-frein",
    name: "Étriers et plaquettes",
    family: "FREINAGE",
    system: "MECANIQUE",
    function: "Pincent le disque sous l'effet de la pression hydraulique.",
    description:
      "Le liquide de frein pousse les pistons de l'étrier, qui appliquent les plaquettes sur le disque. Les plaquettes sont des pièces d'usure ; un témoin d'usure ou un bruit métallique signale leur remplacement.",
    specs: [
      { label: "Types d'étrier", value: "Flottant ou fixe multi-pistons" },
      { label: "Pièces d'usure", value: "Plaquettes, liquide de frein" },
    ],
    reliability: "GENERIQUE",
  },
  // --- Suspension ------------------------------------------------------------
  {
    slug: "amortisseurs",
    name: "Combinés ressort-amortisseur",
    family: "SUSPENSION",
    system: "MECANIQUE",
    function: "Maintiennent le contact des pneus avec la route et filtrent les irrégularités.",
    description:
      "Le ressort supporte la masse du véhicule ; l'amortisseur hydraulique freine ses oscillations. Des amortisseurs usés allongent les distances de freinage et dégradent la tenue de route.",
    specs: [{ label: "Signes d'usure", value: "Rebonds, fuite d'huile, usure irrégulière des pneus" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "triangles",
    name: "Bras et triangles de suspension",
    family: "SUSPENSION",
    system: "MECANIQUE",
    function: "Guident le mouvement vertical de la roue.",
    description:
      "Les bras relient le porte-moyeu à la caisse par des articulations (silentblocs, rotules). Leur géométrie détermine le carrossage, la chasse et le comportement en virage.",
    specs: [{ label: "Pièces d'usure", value: "Silentblocs, rotules" }],
    reliability: "GENERIQUE",
  },
  // --- Direction --------------------------------------------------------------
  {
    slug: "cremaillere",
    name: "Crémaillère de direction",
    family: "DIRECTION",
    system: "MECANIQUE",
    function: "Convertit la rotation du volant en braquage des roues avant.",
    description:
      "Un pignon entraîné par la colonne déplace latéralement une barre dentée reliée aux roues par les biellettes. L'assistance est aujourd'hui le plus souvent électrique.",
    specs: [{ label: "Assistance", value: "Hydraulique, électro-hydraulique ou électrique" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "colonne-direction",
    name: "Colonne de direction",
    family: "DIRECTION",
    system: "MECANIQUE",
    function: "Relie le volant à la crémaillère.",
    description: "La colonne est rétractable en cas de choc et peut intégrer le moteur d'assistance électrique et le capteur d'angle volant.",
    specs: [{ label: "Sécurité", value: "Colonne télescopique ou à rupture programmée" }],
    reliability: "GENERIQUE",
  },
  // --- Refroidissement --------------------------------------------------------
  {
    slug: "radiateur",
    name: "Radiateur de refroidissement",
    family: "REFROIDISSEMENT",
    system: "MECANIQUE",
    function: "Évacue dans l'air la chaleur du liquide de refroidissement.",
    description:
      "Le liquide chauffé par le moteur traverse le faisceau du radiateur, refroidi par l'air de la calandre et un motoventilateur. Un thermostat régule la température de fonctionnement.",
    specs: [{ label: "Entretien associé", value: "Niveau et remplacement du liquide de refroidissement" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "durites",
    name: "Durites",
    family: "REFROIDISSEMENT",
    system: "MECANIQUE",
    function: "Acheminent le liquide de refroidissement entre moteur et radiateur.",
    description: "Tuyaux souples résistants à la chaleur et à la pression. Une durite craquelée ou poreuse peut provoquer une surchauffe.",
    specs: [{ label: "Contrôle", value: "Aspect, souplesse, absence de fuite" }],
    reliability: "GENERIQUE",
  },
  // --- Échappement -------------------------------------------------------------
  {
    slug: "ligne-echappement",
    name: "Ligne d'échappement",
    family: "ECHAPPEMENT",
    system: "MECANIQUE",
    function: "Évacue et dépollue les gaz brûlés.",
    description:
      "Elle part du collecteur, traverse le catalyseur (et le filtre à particules selon le moteur) puis les silencieux. Les sondes lambda mesurent l'oxygène résiduel pour ajuster la combustion.",
    specs: [{ label: "Éléments", value: "Collecteur, catalyseur, filtre à particules, silencieux" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "silencieux",
    name: "Silencieux arrière",
    family: "ECHAPPEMENT",
    system: "MECANIQUE",
    function: "Atténue le bruit des gaz d'échappement.",
    description: "Par chicanes ou matériau absorbant, le silencieux réduit le niveau sonore. Certains modèles sportifs utilisent une valve pilotée.",
    specs: [{ label: "Variantes", value: "Chicanes, absorption, valve pilotée" }],
    reliability: "GENERIQUE",
  },
  // --- Roues -------------------------------------------------------------------
  {
    slug: "pneumatiques",
    name: "Pneumatiques",
    family: "ROUES",
    system: "MECANIQUE",
    function: "Seul contact du véhicule avec la route.",
    description:
      "Le pneu assure adhérence, freinage et confort. Sa pression doit être contrôlée à froid ; en France, la profondeur minimale légale des sculptures est de 1,6 mm.",
    specs: [
      { label: "Profondeur minimale légale (France)", value: "1,6 mm" },
      { label: "Contrôle", value: "Pression à froid, usure, date de fabrication (marquage DOT)" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "jantes",
    name: "Jantes",
    family: "ROUES",
    system: "MECANIQUE",
    function: "Supportent le pneu et transmettent les efforts au moyeu.",
    description: "Les jantes en alliage sont plus légères et dissipent mieux la chaleur des freins que les jantes en acier.",
    specs: [{ label: "Matériaux", value: "Acier, alliage d'aluminium, magnésium, carbone" }],
    reliability: "GENERIQUE",
  },
  // --- Électronique ------------------------------------------------------------
  {
    slug: "calculateur-moteur",
    name: "Calculateur moteur (ECU)",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "CALCULATEUR",
    function: "Pilote l'injection, l'allumage et la gestion du moteur.",
    description:
      "À partir des capteurs (régime, pression, température, sonde lambda…), le calculateur détermine en temps réel la quantité de carburant injectée et l'avance à l'allumage. Il enregistre les codes défaut lisibles via la prise de diagnostic.",
    specs: [
      { label: "Entrées typiques", value: "Régime, charge, températures, sondes lambda" },
      { label: "Sorties typiques", value: "Injecteurs, bobines, papillon motorisé" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "module-abs",
    name: "Module ABS / ESP",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "CALCULATEUR",
    function: "Empêche le blocage des roues et corrige les pertes de trajectoire.",
    description:
      "Le bloc hydraulique et son calculateur modulent la pression de freinage de chaque roue en fonction des capteurs de vitesse de roue. L'ESP ajoute un capteur de lacet pour freiner sélectivement une roue en cas de dérive.",
    specs: [{ label: "Capteurs utilisés", value: "Vitesse de roue, angle volant, lacet" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "batterie",
    name: "Batterie 12 V",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "BATTERIE",
    function: "Alimente le démarreur et le réseau de bord moteur arrêté.",
    description:
      "La batterie fournit le fort courant nécessaire au démarrage. Sa tension au repos renseigne sur son état de charge ; un véhicule peu utilisé gagne à être maintenu par un chargeur adapté.",
    specs: [
      { label: "Tension nominale", value: "12 V" },
      { label: "Technologies", value: "Plomb, AGM, EFB, lithium" },
    ],
    reliability: "GENERIQUE",
  },
  {
    slug: "alternateur",
    name: "Alternateur",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "BATTERIE",
    function: "Recharge la batterie et alimente le réseau moteur tournant.",
    description: "Entraîné par la courroie d'accessoires, l'alternateur produit du courant redressé et régulé autour de 14 V.",
    specs: [{ label: "Tension de charge typique", value: "≈ 13,8 à 14,8 V" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "faisceau-principal",
    name: "Faisceaux électriques",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "FAISCEAU",
    function: "Distribuent l'énergie et les signaux entre les équipements.",
    description:
      "Les faisceaux regroupent les câbles d'alimentation et les bus de communication (CAN, LIN…) qui relient calculateurs, capteurs et actionneurs. Le tracé affiché ici est schématique.",
    specs: [{ label: "Bus courants", value: "CAN, LIN, FlexRay, Ethernet automobile" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "capteurs-vitesse-roue",
    name: "Capteurs de vitesse de roue",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "CAPTEUR",
    function: "Mesurent la vitesse de rotation de chaque roue.",
    description: "Placés près du moyeu, ils lisent une couronne magnétique ou dentée. Leurs signaux servent à l'ABS, à l'ESP et souvent au compteur.",
    specs: [{ label: "Technologies", value: "Inductif ou à effet Hall" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "sonde-lambda",
    name: "Sonde lambda",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "CAPTEUR",
    function: "Mesure l'oxygène dans les gaz d'échappement.",
    description: "Cette mesure permet au calculateur de maintenir le mélange air-carburant optimal pour le catalyseur. Une sonde défaillante augmente la consommation et les émissions.",
    specs: [{ label: "Position", value: "En amont et en aval du catalyseur" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "injecteurs",
    name: "Injecteurs",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "ACTIONNEUR",
    function: "Pulvérisent le carburant dosé par le calculateur.",
    description: "Électrovannes de haute précision, ouvertes pendant quelques millisecondes à chaque cycle. L'injection peut être indirecte (dans l'admission) ou directe (dans la chambre).",
    specs: [{ label: "Types", value: "Indirecte, directe, mixte" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "demarreur",
    name: "Démarreur",
    family: "ELECTRONIQUE",
    system: "ELECTRONIQUE",
    electronicKind: "ACTIONNEUR",
    function: "Lance le moteur thermique.",
    description: "Moteur électrique puissant qui entraîne la couronne du volant moteur le temps que le moteur démarre.",
    specs: [{ label: "Alimentation", value: "Batterie 12 V" }],
    reliability: "GENERIQUE",
  },
  // --- Habitacle -----------------------------------------------------------------
  {
    slug: "sieges",
    name: "Sièges",
    family: "HABITACLE",
    system: "INTERIEUR",
    function: "Maintiennent les occupants et participent à leur sécurité.",
    description: "Le siège travaille avec la ceinture et l'appui-tête pour retenir l'occupant. Les sièges baquets privilégient le maintien latéral.",
    specs: [{ label: "Éléments", value: "Armature, glissières, appui-tête, airbag latéral éventuel" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "tableau-de-bord",
    name: "Planche de bord",
    family: "HABITACLE",
    system: "INTERIEUR",
    function: "Regroupe instrumentation, commandes et airbag passager.",
    description: "Elle intègre le combiné d'instruments, l'écran central, la climatisation et une traverse métallique qui renforce la caisse.",
    specs: [{ label: "Éléments", value: "Combiné, écran, aérateurs, traverse" }],
    reliability: "GENERIQUE",
  },
  {
    slug: "volant",
    name: "Volant",
    family: "HABITACLE",
    system: "INTERIEUR",
    function: "Commande de direction du conducteur.",
    description: "Le volant porte l'airbag conducteur et souvent des commandes (palettes de changement de rapport, multimédia).",
    specs: [{ label: "Éléments", value: "Airbag, commandes, palettes éventuelles" }],
    reliability: "GENERIQUE",
  },
];
