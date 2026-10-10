/**
 * Normalize an email address according to provider-specific mailbox rules.
 *
 * Normalization Policy:
 * 1. General: Lowercase and trim the raw email.
 * 2. Gmail / Googlemail:
 *    - Domain 'googlemail.com' is standardized to 'gmail.com'.
 *    - Dots ('.') in the username/local-part are stripped because Gmail routes all dot variants to the same inbox.
 *    - Plus tags ('+tag') in the username/local-part are stripped because Gmail ignores anything after '+'.
 *    - Example: 'John.Doe+trial@googlemail.com' -> 'johndoe@gmail.com'.
 * 3. Non-Gmail Providers (e.g. Outlook, Yahoo, Proton, iCloud, Custom Domains):
 *    - Local-part is lowercased and trimmed without removing dots or plus tags, as other providers may treat dots or plus subaddressing differently.
 *    - Example: 'john.doe+trial@yahoo.com' -> 'john.doe+trial@yahoo.com'.
 *
 * NOTE ON EMAIL IDENTITY:
 * Email normalization matches equivalent mailbox identifiers for Gmail users. It does not prove physical identity if a user
 * uses completely different email addresses or accounts, which requires authenticated email verification.
 */
export const normalizeEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      normalizedEmail: '',
      originalEmail: '',
      isValid: false,
      isGmail: false,
    };
  }

  const trimmed = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      normalizedEmail: trimmed,
      originalEmail: rawEmail.trim(),
      isValid: false,
      isGmail: false,
    };
  }

  const [rawLocal, ...domainParts] = trimmed.split('@');
  const domain = domainParts.join('@');

  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';

  let normalizedLocal = rawLocal;
  let normalizedDomain = domain;

  if (isGmail) {
    normalizedDomain = 'gmail.com';
    // Strip plus tag first
    const withoutTag = rawLocal.split('+')[0];
    // Strip all dots
    normalizedLocal = withoutTag.replace(/\./g, '');
  }

  const normalizedEmail = `${normalizedLocal}@${normalizedDomain}`;

  return {
    normalizedEmail,
    originalEmail: rawEmail.trim(),
    isValid: true,
    isGmail,
  };
};
