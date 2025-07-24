// Example utility functions tests
describe('Utility Functions', () => {
  describe('formatDate', () => {
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    it('should format date correctly', () => {
      const testDate = new Date('2024-01-15')
      const formatted = formatDate(testDate)
      
      expect(formatted).toBe('January 15, 2024')
    })

    it('should handle edge cases', () => {
      const newYear = new Date('2024-01-01')
      const formatted = formatDate(newYear)
      
      expect(formatted).toBe('January 1, 2024')
    })
  })

  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('valid+email@test.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@invalid.com')).toBe(false)
      expect(validateEmail('invalid@.com')).toBe(false)
    })
  })
}) 