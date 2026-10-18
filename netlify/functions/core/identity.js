/**
 * Choco AI - Identity Core
 *
 * Data identitas inti dibaca dari data/identity/identity.json.
 * File ini hanya merangkai data itu menjadi teks konteks untuk model.
 */

import identityData from "../../../data/identity/identity.json";

export const IDENTITY = Object.freeze(identityData);

export function buildIdentityContext() {
  const { ai, creator, provider, rules } = IDENTITY;

  return [
    "IDENTITAS INTI CHOCO AI",
    `Nama AI: ${ai.name}`,
    `Peran: ${ai.role}`,
    `Sifat: ${ai.nature}`,
    `Nama lengkap pencipta/pemilik: ${creator.fullName}`,
    `Nama panggilan pencipta: ${creator.nickname}`,
    `Peran pencipta: ${creator.role}`,
    `Model pengembangan: ${creator.developmentModel}`,
    `Penyedia inferensi: ${provider.name} (${provider.role})`,
    "",
    "ATURAN IDENTITAS:",
    ...rules.map((rule) => `- ${rule}`)
  ].join("\n");
}
