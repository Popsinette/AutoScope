import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { deleteUserFiles } from "./account";

export const auth = betterAuth({
  appName: "CarView",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteUserFiles(user.id);
      },
    },
  },
  // Limitation de débit active par défaut (y compris en développement) ; désactivable pour les tests E2E uniquement.
  rateLimit: { enabled: process.env.AUTH_RATE_LIMIT !== "off", window: 60, max: 30 },
  // nextCookies doit rester le dernier plugin (pose les cookies depuis les server actions).
  plugins: [nextCookies()],
});
