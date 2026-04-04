/**
 * Options affichées dans les listes « Opérateur » (RDC).
 * La détection automatique repose sur {@link ../phoneRdc.js}.
 */
export const RDC_PROVIDER_SELECT_OPTIONS = [
  { value: '', label: 'Détection automatique (RDC)' },
  { value: 'VODACOM_MPESA_COD', label: 'Vodacom M-Pesa' },
  { value: 'AIRTEL_OAPI_COD', label: 'Airtel Money' },
  { value: 'ORANGE_OAPI_COD', label: 'Orange Money' },
  { value: 'AFRICELL_OAPI_COD', label: 'Afrimoney (Africell)' },
]

export const PROVIDER_OPTIONS_BY_COUNTRY = {
  DRC: RDC_PROVIDER_SELECT_OPTIONS,
}

/** Alias pour les pages qui utilisaient `PROVIDER_OPTIONS`. */
export const PROVIDER_OPTIONS = PROVIDER_OPTIONS_BY_COUNTRY
