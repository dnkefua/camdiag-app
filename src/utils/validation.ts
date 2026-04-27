import type { FormErrors, FormData } from '../types';

export const validateQuestionnaireForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.medication.trim()) {
    errors.medication = 'Medication name is required';
  } else if (data.medication.trim().length < 2) {
    errors.medication = 'Medication name must be at least 2 characters';
  }

  if (!data.source.trim()) {
    errors.source = 'Purchase location is required';
  } else if (data.source.trim().length < 2) {
    errors.source = 'Location must be at least 2 characters';
  }

  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};