import { describe, it, expect } from 'vitest'
import { maskPhone } from './utils'

describe('maskPhone', () => {
  it('masks last 4 digits of a plain number', () => {
    expect(maskPhone('919900000000')).toBe('91990000****')
  })

  it('masks last 4 digits preserving + prefix', () => {
    expect(maskPhone('+919900000000')).toBe('+91990000****')
  })

  it('returns **** for string of 4 chars', () => {
    expect(maskPhone('1234')).toBe('****')
  })

  it('returns **** for string shorter than 4 chars', () => {
    expect(maskPhone('12')).toBe('****')
  })

  it('returns **** for empty string', () => {
    expect(maskPhone('')).toBe('****')
  })

  it('handles exactly 5 chars', () => {
    expect(maskPhone('12345')).toBe('1****')
  })
})
