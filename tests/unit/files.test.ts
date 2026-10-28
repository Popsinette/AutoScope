import { describe, expect, it } from "vitest";
import { checkUpload, detectFileType, DOCUMENT_TYPES, safeFileName } from "@/lib/files";

describe("contrôle des fichiers", () => {
  it("détecte le type par signature binaire", () => {
    expect(detectFileType(new TextEncoder().encode("%PDF-1.4 ..."))).toBe("application/pdf");
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectFileType(new TextEncoder().encode("<html><script>"))).toBeNull();
  });

  it("refuse un fichier déguisé, vide ou trop gros", async () => {
    const html = new File(["<script>alert(1)</script>"], "facture.pdf", { type: "application/pdf" });
    expect(await checkUpload(html, DOCUMENT_TYPES, 1000)).toEqual({ ok: false, error: "Type de fichier non accepté." });
    expect((await checkUpload(new File([], "x.pdf"), DOCUMENT_TYPES, 1000)).ok).toBe(false);
    const big = new File([new Uint8Array(2048)], "x.pdf");
    expect(await checkUpload(big, DOCUMENT_TYPES, 1024)).toMatchObject({ ok: false });
    const pdf = new File(["%PDF-1.4\n%%EOF"], "ok.pdf");
    expect(await checkUpload(pdf, DOCUMENT_TYPES, 1024)).toMatchObject({ ok: true, type: "application/pdf" });
  });

  it("nettoie les noms de fichiers", () => {
    expect(safeFileName('../../etc/"passwd"\r\n.pdf')).toBe("....etcpasswd.pdf");
    expect(safeFileName("Facture révision.pdf")).toBe("Facture revision.pdf");
  });
});
