import { describe, it, expect } from 'vitest';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

describe('i18n locale files', () => {
  it('en and fr have the same keys', () => {
    const enKeys = Object.keys(en).sort();
    const frKeys = Object.keys(fr).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it('en has no empty values', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `Key "${key}" has empty value in en.json`).toBeTruthy();
    }
  });

  it('fr has no empty values', () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(value, `Key "${key}" has empty value in fr.json`).toBeTruthy();
    }
  });

  it('critical keys exist in both locales', () => {
    const criticalKeys = [
      'hub_title', 'new_scan', 'drugs', 'settings', 'scan',
      'analysis_title', 'disclaimer_text', 'disclaimer_consult',
      'find_clinic', 'back', 'home', 'offline_mode',
    ];
    for (const key of criticalKeys) {
      expect(en[key as keyof typeof en]).toBeDefined();
      expect(fr[key as keyof typeof fr]).toBeDefined();
    }
  });
});