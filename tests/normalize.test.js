const { normalizeProjectType } = require('../src/utils/normalize');

describe('normalizeProjectType', () => {
  test('normalizes backend "content" to frontend "Content Production"', () => {
    expect(normalizeProjectType('content')).toBe('Content Production');
  });

  test('passes through known frontend enum values unchanged', () => {
    expect(normalizeProjectType('New Concept')).toBe('New Concept');
    expect(normalizeProjectType('Experiment')).toBe('Experiment');
    expect(normalizeProjectType('Revision')).toBe('Revision');
    expect(normalizeProjectType('Content Production')).toBe('Content Production');
  });

  test('falls back to "Content Production" for unknown types', () => {
    expect(normalizeProjectType('unknown_type')).toBe('Content Production');
    expect(normalizeProjectType(undefined)).toBe('Content Production');
    expect(normalizeProjectType(null)).toBe('Content Production');
  });
});
