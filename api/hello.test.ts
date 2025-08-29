import { describe, it, expect } from 'vitest';
import { hello } from './hello';

describe('Hello API', () => {
  it('should return a valid hello response', async () => {
    const result = await hello();

    expect(result).toBeDefined();
    expect(result.message).toBe('Hello from LegalEase API!');
    expect(result.timestamp).toBeDefined();
    expect(result.version).toBeDefined();
    
    // Validate timestamp format (ISO 8601)
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    
    // Validate version format (semantic versioning)
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should return current timestamp', async () => {
    const before = new Date().getTime();
    const result = await hello();
    const after = new Date().getTime();
    
    const resultTime = new Date(result.timestamp).getTime();
    
    expect(resultTime).toBeGreaterThanOrEqual(before);
    expect(resultTime).toBeLessThanOrEqual(after);
  });

  it('should return consistent version', async () => {
    const result1 = await hello();
    const result2 = await hello();
    
    expect(result1.version).toBe(result2.version);
  });

  it('should include required fields', async () => {
    const result = await hello();
    
    expect(typeof result.message).toBe('string');
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.version).toBe('string');
    
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.timestamp.length).toBeGreaterThan(0);
    expect(result.version.length).toBeGreaterThan(0);
  });
});