import { describe, it, expect, beforeEach } from 'vitest';
import { validateQuery, triage, triageDemo, triageHealth } from './triage';

describe('Triage Service', () => {
  describe('validateQuery', () => {
    it('should validate a proper query with location', async () => {
      const result = await validateQuery({
        query: 'I want to open a cafe in Brisbane, what permits do I need?',
        address: 'Brisbane, QLD'
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty query', async () => {
      const result = await validateQuery({
        query: '',
        address: 'Sydney, NSW'
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Query is required and cannot be empty');
    });

    it('should reject very short query', async () => {
      const result = await validateQuery({
        query: 'help',
        address: 'Melbourne, VIC'
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Query is too short. Please provide more details about your legal question');
    });

    it('should reject very long query', async () => {
      const longQuery = 'a'.repeat(1001);
      const result = await validateQuery({
        query: longQuery,
        address: 'Perth, WA'
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Query is too long. Please keep it under 1000 characters');
    });

    it('should provide suggestions for improving queries', async () => {
      const result = await validateQuery({
        query: 'I need help with business stuff in some city'
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('Australian'))).toBe(true);
    });
  });

  describe('triage', () => {
    it('should process business registration query', async () => {
      const result = await triage({
        query: 'I want to start a new business in Sydney, what do I need to register?',
        address: 'Sydney, NSW',
        context: {
          location: 'Sydney, NSW',
          userPreferences: {
            detailLevel: 'detailed'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.query.raw).toContain('business');
      expect(result.jurisdictions.length).toBeGreaterThan(0);
      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.contacts.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.disclaimer).toContain('legal advice');
    });

    it('should process food business query', async () => {
      const result = await triage({
        query: 'I want to open a cafe in Melbourne, what permits are required?',
        address: 'Melbourne, VIC',
        context: {
          location: 'Melbourne, VIC'
        }
      });

      expect(result.success).toBe(true);
      expect(result.requirements.some(req => req.title.includes('Food'))).toBe(true);
      expect(result.requirements.some(req => req.title.includes('Business Registration'))).toBe(true);
      expect(result.estimatedComplexity).toMatch(/low|medium|high|very-high/);
    });

    it('should process building/development query', async () => {
      const result = await triage({
        query: 'I want to build a shed in my backyard in Brisbane',
        address: 'Brisbane, QLD'
      });

      expect(result.success).toBe(true);
      expect(result.requirements.some(req => req.title.includes('Development'))).toBe(true);
      expect(result.jurisdictions.some(j => j.level === 'local')).toBe(true);
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('should handle invalid input gracefully', async () => {
      await expect(triage({
        query: '',
        address: 'Invalid'
      })).rejects.toThrow('Validation failed');
    });

    it('should identify correct jurisdictions for Queensland', async () => {
      const result = await triage({
        query: 'I need to register a business in Gold Coast',
        address: 'Gold Coast, QLD'
      });

      expect(result.jurisdictions.some(j => j.name.includes('Queensland'))).toBe(true);
      expect(result.jurisdictions.some(j => j.level === 'federal')).toBe(true);
      expect(result.jurisdictions.some(j => j.level === 'state')).toBe(true);
    });

    it('should provide realistic cost estimates', async () => {
      const result = await triage({
        query: 'How much will it cost to start a restaurant in Perth?',
        address: 'Perth, WA'
      });

      expect(result.totalEstimatedCost).toBeDefined();
      expect(result.totalEstimatedCost).not.toBe('');
      expect(result.totalEstimatedTimeframe).toBeDefined();
    });

    it('should assess complexity appropriately', async () => {
      const simpleResult = await triage({
        query: 'Do I need to register my business name?',
        address: 'Sydney, NSW'
      });

      const complexResult = await triage({
        query: 'I want to open a large restaurant with liquor license, outdoor seating, and live entertainment in Melbourne CBD',
        address: 'Melbourne, VIC'
      });

      expect(['low', 'medium', 'high', 'very-high']).toContain(simpleResult.estimatedComplexity);
      expect(['low', 'medium', 'high', 'very-high']).toContain(complexResult.estimatedComplexity);
    });
  });

  describe('triageDemo', () => {
    it('should work with simplified interface', async () => {
      const result = await triageDemo({
        query: 'I want to open a cafe in Brisbane',
        address: 'Brisbane, QLD'
      });

      expect(result.success).toBe(true);
      expect(result.requirements.length).toBeGreaterThan(0);
    });

    it('should work without address', async () => {
      const result = await triageDemo({
        query: 'How do I register a business in Australia?'
      });

      expect(result.success).toBe(true);
      expect(result.jurisdictions.some(j => j.level === 'federal')).toBe(true);
    });
  });

  describe('triageHealth', () => {
    it('should return healthy status', async () => {
      const result = await triageHealth();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle queries with special characters', async () => {
      const result = await triage({
        query: 'I want to start a café & restaurant (with liquor) in Sydney\'s CBD!',
        address: 'Sydney, NSW'
      });

      expect(result.success).toBe(true);
      expect(result.query.processedKeywords.length).toBeGreaterThan(0);
    });

    it('should handle queries without location context', async () => {
      const result = await triage({
        query: 'What do I need to start a business in Australia?'
      });

      expect(result.success).toBe(true);
      expect(result.jurisdictions.some(j => j.level === 'federal')).toBe(true);
      expect(result.query.assumptions).toContain('Location assumed to be general Australia (specify location for more accurate advice)');
    });

    it('should provide appropriate warnings for complex matters', async () => {
      const result = await triage({
        query: 'I want to start a complex multinational business with multiple locations, franchising, and international trade',
        address: 'Sydney, NSW'
      });

      expect(result.warningsAndRisks.length).toBeGreaterThan(0);
      expect(result.warningsAndRisks.some(w => w.includes('complex') || w.includes('professional'))).toBe(true);
    });
  });

  describe('Data Quality', () => {
    it('should provide actionable next steps', async () => {
      const result = await triage({
        query: 'I want to open a small cafe in Adelaide',
        address: 'Adelaide, SA'
      });

      expect(result.nextSteps.length).toBeGreaterThan(0);
      result.nextSteps.forEach(step => {
        expect(step.length).toBeGreaterThan(10);
        expect(step).not.toContain('undefined');
      });
    });

    it('should provide valid contact information', async () => {
      const result = await triage({
        query: 'How do I register my business?',
        address: 'Brisbane, QLD'
      });

      expect(result.contacts.length).toBeGreaterThan(0);
      result.contacts.forEach(contact => {
        expect(contact.authority).toBeDefined();
        expect(contact.type).toBeDefined();
        expect(contact.url).toBeDefined();
        expect(contact.url).toMatch(/^https?:\/\//);
      });
    });

    it('should generate realistic timeframes', async () => {
      const result = await triage({
        query: 'How long does it take to get all approvals for a restaurant?',
        address: 'Melbourne, VIC'
      });

      expect(result.totalEstimatedTimeframe).toBeDefined();
      expect(result.totalEstimatedTimeframe).toMatch(/\d+.*?(day|week|month)/);
    });

    it('should maintain data consistency', async () => {
      const result = await triage({
        query: 'I want to start a food truck business in Darwin',
        address: 'Darwin, NT'
      });

      // Check that all requirements have valid structure
      result.requirements.forEach(req => {
        expect(req.title).toBeDefined();
        expect(req.authority).toBeDefined();
        expect(req.actions).toBeDefined();
        expect(Array.isArray(req.actions)).toBe(true);
        expect(req.mandatory).toBeDefined();
        
        req.actions.forEach(action => {
          expect(action.step).toBeGreaterThan(0);
          expect(action.desc).toBeDefined();
          expect(action.desc.length).toBeGreaterThan(5);
        });
      });

      // Check jurisdiction consistency
      result.jurisdictions.forEach(jurisdiction => {
        expect(jurisdiction.confidence).toBeGreaterThan(0);
        expect(jurisdiction.confidence).toBeLessThanOrEqual(1);
        expect(['local', 'state', 'federal', 'international']).toContain(jurisdiction.level);
      });
    });
  });
});