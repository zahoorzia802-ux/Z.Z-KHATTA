export interface Country {
  name: string;
  code: string; // e.g. '+92'
  iso: string;  // e.g. 'PK'
  flag: string; // emoji flag
  placeholder: string;
  formatHint: string;
}

export const COUNTRIES: Country[] = [
  {
    name: 'Pakistan',
    code: '+92',
    iso: 'PK',
    flag: '🇵🇰',
    placeholder: '0300 1234567',
    formatHint: '03XXXXXXXXX or +923001234567',
  },
  {
    name: 'United Arab Emirates',
    code: '+971',
    iso: 'AE',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    formatHint: '5XXXXXXXX or 05XXXXXXXX',
  },
  {
    name: 'Saudi Arabia',
    code: '+966',
    iso: 'SA',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    formatHint: '5XXXXXXXX or 05XXXXXXXX',
  },
  {
    name: 'United Kingdom',
    code: '+44',
    iso: 'GB',
    flag: '🇬🇧',
    placeholder: '7123 456789',
    formatHint: '7XXXXXXXXX or 07XXXXXXXXX',
  },
  {
    name: 'United States',
    code: '+1',
    iso: 'US',
    flag: '🇺🇸',
    placeholder: '415 555 2671',
    formatHint: '10-digit mobile number',
  },
  {
    name: 'Canada',
    code: '+1',
    iso: 'CA',
    flag: '🇨🇦',
    placeholder: '416 555 0199',
    formatHint: '10-digit mobile number',
  },
  {
    name: 'Oman',
    code: '+968',
    iso: 'OM',
    flag: '🇴🇲',
    placeholder: '9123 4567',
    formatHint: '8-digit mobile number',
  },
  {
    name: 'Qatar',
    code: '+974',
    iso: 'QA',
    flag: '🇶🇦',
    placeholder: '5512 3456',
    formatHint: '8-digit mobile number',
  },
  {
    name: 'Kuwait',
    code: '+965',
    iso: 'KW',
    flag: '🇰🇼',
    placeholder: '5123 4567',
    formatHint: '8-digit mobile number',
  },
  {
    name: 'Bahrain',
    code: '+973',
    iso: 'BH',
    flag: '🇧🇭',
    placeholder: '3912 3456',
    formatHint: '8-digit mobile number',
  },
  {
    name: 'India',
    code: '+91',
    iso: 'IN',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    formatHint: '10-digit mobile number',
  },
  {
    name: 'Malaysia',
    code: '+60',
    iso: 'MY',
    flag: '🇲🇾',
    placeholder: '12 345 6789',
    formatHint: '9-10 digit mobile number',
  },
  {
    name: 'Turkey',
    code: '+90',
    iso: 'TR',
    flag: '🇹🇷',
    placeholder: '532 123 4567',
    formatHint: '10-digit mobile number',
  },
  {
    name: 'Australia',
    code: '+61',
    iso: 'AU',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    formatHint: '9-digit mobile number',
  },
  {
    name: 'Germany',
    code: '+49',
    iso: 'DE',
    flag: '🇩🇪',
    placeholder: '151 23456789',
    formatHint: '10-11 digit mobile number',
  },
  {
    name: 'South Africa',
    code: '+27',
    iso: 'ZA',
    flag: '🇿🇦',
    placeholder: '82 123 4567',
    formatHint: '9-digit mobile number',
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Pakistan (+92)

/**
 * Detect country from phone number string or fallback to Pakistan
 */
export function detectCountryFromPhone(phone: string, defaultIso = 'PK'): Country {
  if (!phone || typeof phone !== 'string') {
    return COUNTRIES.find((c) => c.iso === defaultIso) || DEFAULT_COUNTRY;
  }
  const clean = phone.trim().replace(/[\s-]/g, '');

  // Look for matching international prefix (sorted by longest code first)
  const sortedByCodeLength = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const country of sortedByCodeLength) {
    if (clean.startsWith(country.code)) {
      return country;
    }
  }

  // Pakistan local prefix check: starts with 03
  if (/^03\d/.test(clean)) {
    return DEFAULT_COUNTRY;
  }

  return COUNTRIES.find((c) => c.iso === defaultIso) || DEFAULT_COUNTRY;
}

export interface ValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validate and normalize a mobile number according to the selected country's rules:
 * - Removes spaces and hyphens before validation
 * - Strictly rejects letters and illegal characters
 * - Validates format, min/max length, and mobile prefix
 * - Prevents Pakistani numbers under non-PK country and vice versa
 * - Normalizes valid numbers to international format (e.g. +923001234567)
 */
export function validateAndNormalizePhone(
  rawInput: string,
  country: Country = DEFAULT_COUNTRY
): ValidationResult {
  const invalidMsg = '❌ Invalid mobile number. Please enter a valid number.';

  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Strictly disallow letters or symbols other than leading +
  if (/[a-zA-Z]/.test(rawInput)) {
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Strip spaces, hyphens, and brackets
  const stripped = rawInput.trim().replace(/[\s\-()]/g, '');

  if (!stripped) {
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: PAKISTAN (+92)
  if (country.iso === 'PK') {
    // Cannot start with another country's code
    if (stripped.startsWith('+') && !stripped.startsWith('+92')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }

    // 1. Local format: 03XXXXXXXXX (11 digits, must start with 03)
    if (/^03\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+92' + stripped.slice(1) };
    }

    // 2. Local without 0: 3XXXXXXXXX (10 digits, must start with 3)
    if (/^3\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+92' + stripped };
    }

    // 3. International with +: +923XXXXXXXXX (13 chars, starts with +923)
    if (/^\+923\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }

    // 4. International without +: 923XXXXXXXXX (12 digits, starts with 923)
    if (/^923\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+' + stripped };
    }

    // 5. International with 00: 00923XXXXXXXXX
    if (/^00923\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+' + stripped.slice(2) };
    }

    // Any other number is not a valid Pakistani mobile number
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Non-Pakistan countries:
  // Must NOT allow a Pakistani number to be saved under another country!
  if (/^(03\d{9}|\+923\d{9}|923\d{9}|00923\d{9})$/.test(stripped)) {
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: UAE (+971)
  if (country.iso === 'AE') {
    if (stripped.startsWith('+') && !stripped.startsWith('+971')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    // Mobile numbers in UAE start with 5 (9 national digits: 50, 52, 54, 55, 56, 58)
    if (/^\+9715\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }
    if (/^05\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: '+971' + stripped.slice(1) };
    }
    if (/^5\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: '+971' + stripped };
    }
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: Saudi Arabia (+966)
  if (country.iso === 'SA') {
    if (stripped.startsWith('+') && !stripped.startsWith('+966')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    // Mobile numbers in SA start with 5 (9 national digits)
    if (/^\+9665\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }
    if (/^05\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: '+966' + stripped.slice(1) };
    }
    if (/^5\d{8}$/.test(stripped)) {
      return { isValid: true, normalized: '+966' + stripped };
    }
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: United Kingdom (+44)
  if (country.iso === 'GB') {
    if (stripped.startsWith('+') && !stripped.startsWith('+44')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    // UK mobile numbers start with 7 (10 national digits)
    if (/^\+447\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }
    if (/^07\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+44' + stripped.slice(1) };
    }
    if (/^7\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+44' + stripped };
    }
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: United States / Canada (+1)
  if (country.iso === 'US' || country.iso === 'CA') {
    if (stripped.startsWith('+') && !stripped.startsWith('+1')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    // North American numbers: 10 digits, area code 2-9
    if (/^\+1[2-9]\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }
    if (/^1[2-9]\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+' + stripped };
    }
    if (/^[2-9]\d{9}$/.test(stripped)) {
      return { isValid: true, normalized: '+1' + stripped };
    }
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Country: Oman (+968)
  if (country.iso === 'OM') {
    if (stripped.startsWith('+') && !stripped.startsWith('+968')) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    if (/^\+968[79]\d{7}$/.test(stripped)) {
      return { isValid: true, normalized: stripped };
    }
    if (/^[79]\d{7}$/.test(stripped)) {
      return { isValid: true, normalized: '+968' + stripped };
    }
    return { isValid: false, normalized: '', error: invalidMsg };
  }

  // Generic valid international mobile validation for remaining countries
  const cCode = country.code.replace('+', '');
  if (stripped.startsWith('+')) {
    if (!stripped.startsWith(country.code)) {
      return { isValid: false, normalized: '', error: invalidMsg };
    }
    const national = stripped.slice(country.code.length);
    if (/^\d{7,12}$/.test(national)) {
      return { isValid: true, normalized: stripped };
    }
  } else {
    // If entered local number with leading zero
    let digits = stripped;
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    if (/^\d{7,12}$/.test(digits)) {
      return { isValid: true, normalized: `${country.code}${digits}` };
    }
  }

  return { isValid: false, normalized: '', error: invalidMsg };
}
