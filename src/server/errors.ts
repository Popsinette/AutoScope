/** Ressource absente ou appartenant à un autre utilisateur (on ne distingue pas les deux). */
export class NotFoundError extends Error {
  constructor(message = "Ressource introuvable.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenActionError";
  }
}
