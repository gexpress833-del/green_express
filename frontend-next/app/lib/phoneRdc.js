/**
 * Détection opérateur Mobile Money RDC — mêmes préfixes que le backend (PhoneRDCService).
 */

const OPERATOR_PREFIXES = {
  vodacom: ['81', '82', '83'],
  airtel: ['97', '98', '99'],
  orange: ['84', '85', '89'],
}

const OPERATOR_LABELS = {
  vodacom: 'Vodacom M-Pesa',
  airtel: 'Airtel Money',
  orange: 'Orange Money',
}

/** Chiffres uniquement, normalisés en 243XXXXXXXXXX (12 chiffres) comme côté serveur. */
export function normalizeDigitsTo243(input) {
  let d = String(input || '').replace(/\D/g, '')
  if (d.startsWith('0')) d = '243' + d.slice(1)
  if (d.length === 9) d = '243' + d
  if (d.startsWith('243') && d.length > 12) d = d.slice(0, 12)
  return d
}

/**
 * @returns {{ operator: string, label: string } | null}
 */
export function detectOperatorFrom243Digits(digits243) {
  if (!digits243 || !/^243(8|9)\d{8}$/.test(digits243)) return null
  const prefix = digits243.slice(3, 5)
  for (const [op, prefs] of Object.entries(OPERATOR_PREFIXES)) {
    if (prefs.includes(prefix)) {
      return { operator: op, label: OPERATOR_LABELS[op] || op }
    }
  }
  return null
}

/**
 * @param {string} rawPhone - saisie utilisateur (+243…, 08…, etc.)
 * @returns {{ digits243: string, detected: { operator: string, label: string } | null, complete: boolean }}
 */
export function analyzeRdcMobileMoneyPhone(rawPhone) {
  const digits243 = normalizeDigitsTo243(rawPhone)
  const complete = /^243(8|9)\d{8}$/.test(digits243)
  const detected = complete ? detectOperatorFrom243Digits(digits243) : null
  return { digits243, detected, complete }
}
