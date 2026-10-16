export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const hasCountryCode = digits.startsWith("55") && (digits.length === 12 || digits.length === 13);
  const national = hasCountryCode ? digits.slice(2) : digits;
  const countryPrefix = hasCountryCode ? "+55 " : "";

  if (national.length === 11) return `${countryPrefix}(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  if (national.length === 10) return `${countryPrefix}(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  return value;
};
