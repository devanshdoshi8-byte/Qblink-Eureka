// Synthetic email derivation so we can use Supabase password auth with phone-only signup.
// Format: phone_<digits>@qblink.user  (digits include country code, no +)
export function normalizePhone(countryCode: string, raw: string): string {
  const cc = countryCode.replace(/\D/g, "");
  const num = raw.replace(/\D/g, "");
  return `${cc}${num}`;
}
export function phoneToEmail(fullDigits: string): string {
  return `phone_${fullDigits}@qblink.user`;
}
export function isValidPhone(raw: string, minLen = 7, maxLen = 15): boolean {
  const num = raw.replace(/\D/g, "");
  return num.length >= minLen && num.length <= maxLen;
}
export const COUNTRY_CODES: { code: string; flag: string; name: string }[] = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1",  flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
];
