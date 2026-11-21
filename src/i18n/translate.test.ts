import { beforeEach, describe, expect, it } from "vitest";
import { t } from "@/i18n";
import { debtReminderMessage } from "@/i18n/customerMessages";
import { setAppLanguage } from "@/lib/appLanguage";
import { labels } from "@/lib/kinyarwanda";

describe("catalogue language", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses the exact catalogue words", () => {
    expect(t("AUTH-003", "en")).toBe("Welcome back");
    expect(t("AUTH-003", "rw")).toBe("Murakaza neza nanone");
    expect(t("AUTH-003", "fr")).toBe("Bon retour");
    expect(t("AUTH-003", "sw")).toBe("Karibu tena");
    expect(t("MISC-001", "lg")).toBe("Awatandikirwa");
    expect(t("MISC-001", "es")).toBe("Inicio");
    expect(t("MISC-001", "pt")).toBe("Início");
    expect(t("MISC-001", "ar")).toBe("الرئيسية");
    expect(t("MISC-001", "zh")).toBe("首页");
    expect(t("AUTH-003", "es")).toBe("Bienvenido de nuevo");
    expect(t("SALE-004", "en", { count: 3 })).toBe("3 in stock");
  });

  it("changes labels when the preferred language changes", () => {
    setAppLanguage("rw");
    expect(labels.home).toBe("Ahabanza");
    setAppLanguage("en");
    expect(labels.home).toBe("Home");
    setAppLanguage("fr");
    expect(labels.home).toBe("Accueil");
    setAppLanguage("sw");
    expect(labels.debtsTab).toBe("Madeni");
  });

  it("writes the customer reminder in the preferred language", () => {
    setAppLanguage("es");
    expect(debtReminderMessage("Isabune", "5 000")).toContain("estimado cliente");
    setAppLanguage("fr");
    expect(debtReminderMessage("Isabune", "5 000")).toContain("Bonjour cher client");
    setAppLanguage("rw");
    expect(debtReminderMessage("Isabune", "5 000")).toContain(
      "Muraho mukiliya mwiza twifuzaga kubibutsa"
    );
  });
});
