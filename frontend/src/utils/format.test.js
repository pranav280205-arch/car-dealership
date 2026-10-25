import { describe, expect, it } from 'vitest'
import { formatPrice, stockLabel, toSearchParams } from './format'

describe('formatPrice', () => {
  it('formats rupees with Indian digit grouping and no decimals', () => {
    expect(formatPrice(1850000)).toBe('₹18,50,000')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('₹0')
  })
})

describe('stockLabel', () => {
  it('says sold out at zero', () => {
    expect(stockLabel(0)).toBe('Sold out')
  })

  it('warns when only one or two are left', () => {
    expect(stockLabel(1)).toBe('Only 1 left')
    expect(stockLabel(2)).toBe('Only 2 left')
  })

  it('shows the count otherwise', () => {
    expect(stockLabel(7)).toBe('7 in stock')
  })
})

describe('toSearchParams', () => {
  it('drops empty filters so the URL stays clean', () => {
    const params = toSearchParams({ q: '', make: 'Tata', category: '', minPrice: '', maxPrice: '' })
    expect(params.toString()).toBe('make=Tata')
  })

  it('maps camelCase filters to the API names', () => {
    const params = toSearchParams({ minPrice: '500000', maxPrice: '900000', inStock: true })
    expect(params.get('min_price')).toBe('500000')
    expect(params.get('max_price')).toBe('900000')
    expect(params.get('in_stock')).toBe('true')
  })

  it('leaves in_stock out when it is off', () => {
    expect(toSearchParams({ inStock: false }).has('in_stock')).toBe(false)
  })
})
