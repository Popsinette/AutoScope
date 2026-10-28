-- CreateEnum
CREATE TYPE "Energy" AS ENUM ('ESSENCE', 'DIESEL', 'HYBRIDE', 'HYBRIDE_RECHARGEABLE', 'ELECTRIQUE', 'GPL', 'AUTRE');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUELLE', 'AUTOMATIQUE', 'DOUBLE_EMBRAYAGE', 'CVT', 'AUTRE');

-- CreateEnum
CREATE TYPE "Model3DKind" AS ENUM ('PROCEDURAL_DEMO', 'GLB');

-- CreateEnum
CREATE TYPE "ComponentFamily" AS ENUM ('CARROSSERIE', 'MOTEUR', 'TRANSMISSION', 'FREINAGE', 'SUSPENSION', 'DIRECTION', 'REFROIDISSEMENT', 'ECHAPPEMENT', 'ROUES', 'ELECTRONIQUE', 'HABITACLE');

-- CreateEnum
CREATE TYPE "ComponentSystem" AS ENUM ('EXTERIEUR', 'MECANIQUE', 'ELECTRONIQUE', 'INTERIEUR');

-- CreateEnum
CREATE TYPE "ElectronicKind" AS ENUM ('CALCULATEUR', 'FAISCEAU', 'CAPTEUR', 'ACTIONNEUR', 'BATTERIE');

-- CreateEnum
CREATE TYPE "InfoReliability" AS ENUM ('DOCUMENTEE', 'GENERIQUE', 'ILLUSTRATIVE');

-- CreateEnum
CREATE TYPE "InterventionCategory" AS ENUM ('VIDANGE', 'REVISION', 'FREINAGE', 'PNEUS', 'BATTERIE', 'CONTROLE_TECHNIQUE', 'REPARATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ENTRETIEN', 'REPARATION', 'PIECES', 'PNEUMATIQUES', 'CARBURANT', 'ASSURANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ReminderOrigin" AS ENUM ('UTILISATEUR', 'CONSTRUCTEUR_DOCUMENTE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('FACTURE', 'PHOTO', 'NOTICE', 'CONTROLE_TECHNIQUE', 'ASSURANCE', 'CARTE_GRISE', 'AUTRE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "engine" TEXT,
    "energy" "Energy" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "mileage" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3),
    "photoKey" TEXT,
    "photoMime" TEXT,
    "registration" TEXT,
    "vin" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "model3dId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model3d" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "kind" "Model3DKind" NOT NULL,
    "storageKey" TEXT,
    "fileSize" INTEGER,
    "source" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true,
    "nodeNames" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model3d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" "ComponentFamily" NOT NULL,
    "system" "ComponentSystem" NOT NULL,
    "electronicKind" "ElectronicKind",
    "function" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specs" JSONB NOT NULL DEFAULT '[]',
    "reference" TEXT,
    "source" TEXT NOT NULL,
    "reliability" "InfoReliability" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_mapping" (
    "id" TEXT NOT NULL,
    "model3dId" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,

    CONSTRAINT "component_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "category" "InterventionCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "garage" TEXT,
    "partsCostCents" INTEGER NOT NULL DEFAULT 0,
    "laborCostCents" INTEGER NOT NULL DEFAULT 0,
    "nextDueDate" TIMESTAMP(3),
    "nextDueMileage" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replaced_part" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "replaced_part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_component" (
    "interventionId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,

    CONSTRAINT "intervention_component_pkey" PRIMARY KEY ("interventionId","componentId")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "interventionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "InterventionCategory" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "origin" "ReminderOrigin" NOT NULL DEFAULT 'UTILISATEUR',
    "sourceReference" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "sourceInterventionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "interventionId" TEXT,
    "componentId" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" "ComponentFamily" NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT,
    "reference" TEXT,
    "componentSlug" TEXT,
    "source" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "catalog_part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_compatibility" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "source" TEXT NOT NULL,

    CONSTRAINT "part_compatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "vehicle_userId_idx" ON "vehicle"("userId");

-- CreateIndex
CREATE INDEX "model3d_userId_idx" ON "model3d"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "component_slug_key" ON "component"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "component_mapping_model3dId_nodeName_key" ON "component_mapping"("model3dId", "nodeName");

-- CreateIndex
CREATE INDEX "intervention_vehicleId_date_idx" ON "intervention"("vehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "expense_interventionId_key" ON "expense"("interventionId");

-- CreateIndex
CREATE INDEX "expense_vehicleId_date_idx" ON "expense"("vehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_sourceInterventionId_key" ON "reminder"("sourceInterventionId");

-- CreateIndex
CREATE INDEX "reminder_vehicleId_idx" ON "reminder"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "document_storageKey_key" ON "document"("storageKey");

-- CreateIndex
CREATE INDEX "document_userId_idx" ON "document"("userId");

-- CreateIndex
CREATE INDEX "document_vehicleId_idx" ON "document"("vehicleId");

-- CreateIndex
CREATE INDEX "part_compatibility_make_model_idx" ON "part_compatibility"("make", "model");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_model3dId_fkey" FOREIGN KEY ("model3dId") REFERENCES "model3d"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model3d" ADD CONSTRAINT "model3d_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_mapping" ADD CONSTRAINT "component_mapping_model3dId_fkey" FOREIGN KEY ("model3dId") REFERENCES "model3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_mapping" ADD CONSTRAINT "component_mapping_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replaced_part" ADD CONSTRAINT "replaced_part_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_component" ADD CONSTRAINT "intervention_component_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_component" ADD CONSTRAINT "intervention_component_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_sourceInterventionId_fkey" FOREIGN KEY ("sourceInterventionId") REFERENCES "intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_compatibility" ADD CONSTRAINT "part_compatibility_partId_fkey" FOREIGN KEY ("partId") REFERENCES "catalog_part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
