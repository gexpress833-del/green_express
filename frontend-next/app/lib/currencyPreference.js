export const CURRENCY_PREFERENCE_KEY = 'green_express_preferred_currency'
export const CURRENCY_RATE_KEY = 'green_express_usd_cdf_rate'
export const DEFAULT_USD_CDF_RATE = 2800

export function normalizeCurrencyPreference(value) {
  const currency = String(value || '').toUpperCase()
  return currency === 'USD' ? 'USD' : 'CDF'
}

export function getStoredCurrencyPreference() {
  if (typeof window === 'undefined') return 'CDF'
  try {
    return normalizeCurrencyPreference(localStorage.getItem(CURRENCY_PREFERENCE_KEY))
  } catch {
    return 'CDF'
  }
}

export function setStoredCurrencyPreference(value) {
  const currency = normalizeCurrencyPreference(value)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CURRENCY_PREFERENCE_KEY, currency)
      window.dispatchEvent(new CustomEvent('green-express:currency-change', { detail: { currency } }))
    } catch {}
  }
  return currency
}

export function getStoredUsdCdfRate() {
  if (typeof window === 'undefined') return DEFAULT_USD_CDF_RATE
  try {
    const value = Number(localStorage.getItem(CURRENCY_RATE_KEY))
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_USD_CDF_RATE
  } catch {
    return DEFAULT_USD_CDF_RATE
  }
}

export function setStoredUsdCdfRate(value) {
  const rate = Number(value)
  const normalized = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_CDF_RATE
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CURRENCY_RATE_KEY, String(normalized))
      window.dispatchEvent(new CustomEvent('green-express:currency-rate-change', { detail: { rate: normalized } }))
    } catch {}
  }
  return normalized
}

export async function syncUsdCdfRate(apiRequest) {
  const response = await apiRequest('/api/currency/rate', { method: 'GET', skipSessionExpiredOn401: true })
  return setStoredUsdCdfRate(response?.usd_cdf_rate)
}

export function convertMenuPrice(menu, targetCurrency, usdCdfRate = null) {
  const sourceCurrency = normalizeCurrencyPreference(menu?.currency || 'CDF')
  const currency = normalizeCurrencyPreference(targetCurrency)
  const rate = Number(usdCdfRate) > 0 ? Number(usdCdfRate) : getStoredUsdCdfRate()
  const price = Number(menu?.price)
  if (Number.isNaN(price)) {
    return { price: 0, currency, originalPrice: 0, originalCurrency: sourceCurrency, converted: false, rate }
  }
  if (sourceCurrency === currency) {
    return { price, currency, originalPrice: price, originalCurrency: sourceCurrency, converted: false, rate }
  }
  if (sourceCurrency === 'USD' && currency === 'CDF') {
    return { price: Math.round(price * rate), currency, originalPrice: price, originalCurrency: sourceCurrency, converted: true, rate }
  }
  if (sourceCurrency === 'CDF' && currency === 'USD') {
    return { price: Math.round((price / rate) * 100) / 100, currency, originalPrice: price, originalCurrency: sourceCurrency, converted: true, rate }
  }
  return { price, currency: sourceCurrency, originalPrice: price, originalCurrency: sourceCurrency, converted: false, rate }
}
