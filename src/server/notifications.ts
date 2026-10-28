import "server-only";

/**
 * Point d'intégration des notifications externes.
 *
 * Aucun canal n'est implémenté : l'interface l'indique explicitement et
 * n'affiche jamais de succès d'envoi. Pour brancher un service, implémenter
 * NotificationChannel (ex. Resend, Brevo, SES pour l'e-mail ; Web Push avec
 * clés VAPID pour le push), l'enregistrer ici et planifier un job quotidien
 * qui appelle listReminders() puis notify() pour les statuts PROCHE/DEPASSE.
 */
export interface NotificationChannel {
  readonly name: "email" | "push";
  send(to: { userId: string; email: string }, message: { subject: string; body: string }): Promise<void>;
}

const channels: NotificationChannel[] = [];

export function emailNotificationsAvailable() {
  return channels.some((c) => c.name === "email");
}
