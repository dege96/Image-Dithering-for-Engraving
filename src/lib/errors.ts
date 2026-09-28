export const ERROR_MESSAGES = {
  INVALID_IMAGE:
    "Ogiltig bildfil. Ladda upp JPG, PNG eller WebP.",
  BG_FAIL:
    "Kunde inte ta bort bakgrunden. Prova en annan bild eller försök igen.",
  PROCESS_FAIL:
    "Kunde inte bearbeta bilden. Prova igen eller välj en ny bild.",
  EXPORT_FAIL:
    "Kunde inte exportera PNG. Prova igen.",
  UNKNOWN: "Något gick fel. Prova igen.",
} as const;

export function messageForError(error: unknown): string {
  const code =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
  }
  return ERROR_MESSAGES.UNKNOWN;
}
