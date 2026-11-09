export const derivePricing = (feeText) => {
  const fee = String(feeText ?? '').trim()
  const isFree = !fee || /^free$/i.test(fee) || fee === '0'
  return {
    fee: isFree ? (fee || 'Free') : fee,
    isFree,
  }
}

export const linesToList = (text) =>
  text ? String(text).split('\n').map((s) => s.trim()).filter(Boolean) : []
