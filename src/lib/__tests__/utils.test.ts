import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const showConditional = true
      const showHidden = false
      const result = cn('base-class', showConditional && 'conditional-class', showHidden && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    it('should handle null and undefined values', () => {
      const result = cn('base-class', null, undefined, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
    })

    it('should deduplicate classes', () => {
      const result = cn('text-red-500', 'text-blue-500')
      // Should use the last conflicting class (tailwind-merge behavior)
      expect(result).toContain('text-blue-500')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'primary': true
      })
      expect(result).toContain('active')
      expect(result).toContain('primary')
      expect(result).not.toContain('disabled')
    })
  })
})
