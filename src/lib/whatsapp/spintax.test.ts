import { describe, it, expect } from 'vitest'
import { resolveSpintax } from './spintax'

describe('resolveSpintax', () => {
  it('returns string unchanged when no tokens present', () => {
    expect(resolveSpintax('Hello there!')).toBe('Hello there!')
  })

  it('resolves a single-option token', () => {
    expect(resolveSpintax('{Hello} there!')).toBe('Hello there!')
  })

  it('resolves a multi-option token to one of the options', () => {
    const result = resolveSpintax('{Hey|Hi|Hello} there!')
    expect(['Hey there!', 'Hi there!', 'Hello there!']).toContain(result)
  })

  it('resolves multiple independent tokens', () => {
    const result = resolveSpintax('{Hey|Hi} {you|friend}!')
    const valid = ['Hey you!', 'Hey friend!', 'Hi you!', 'Hi friend!']
    expect(valid).toContain(result)
  })

  it('handles empty string', () => {
    expect(resolveSpintax('')).toBe('')
  })
})
