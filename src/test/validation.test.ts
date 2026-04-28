import { describe, it, expect } from 'vitest';
import { validateQuestionnaireForm, sanitizeInput } from '../utils/validation';

describe('validateQuestionnaireForm', () => {
  it('returns errors for empty fields', () => {
    const result = validateQuestionnaireForm({ medication: '', source: '', worked: 'yes', audioCaptured: false, imageCaptured: false });
    expect(result.medication).toBe('Medication name is required');
    expect(result.source).toBe('Purchase location is required');
  });

  it('returns errors for too-short fields', () => {
    const result = validateQuestionnaireForm({ medication: 'A', source: 'B', worked: 'yes', audioCaptured: false, imageCaptured: false });
    expect(result.medication).toBe('Medication name must be at least 2 characters');
    expect(result.source).toBe('Location must be at least 2 characters');
  });

  it('returns no errors for valid input', () => {
    const result = validateQuestionnaireForm({ medication: 'Coartem', source: 'MedPlus Pharmacy', worked: 'yes', audioCaptured: false, imageCaptured: false });
    expect(result.medication).toBeUndefined();
    expect(result.source).toBeUndefined();
  });
});

describe('sanitizeInput', () => {
  it('removes angle brackets and quotes', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
});