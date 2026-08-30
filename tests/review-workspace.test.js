/**
 * TDD for ReviewWorkspace version handling.
 *
 * Bug (browser console): TypeError: Cannot read properties of undefined
 * (reading 'id') at ReviewWorkspacePage — when a project has no video
 * versions, `review.versions[0]` is undefined and the page dereferences it.
 *
 * Contract under test: pickVersion() must return a safe value (never
 * undefined-without-null) so the page can render its empty state.
 */
const { pickVersion } = require('../src/utils/reviewVersions')

describe('pickVersion (ReviewWorkspace empty-versions crash)', () => {
  const versions = [
    { id: 'v1:fileA', label: 'v1', url: 'http://x/1' },
    { id: 'v2:fileB', label: 'v2', url: 'http://x/2' },
  ]

  test('returns the version matching versionId', () => {
    expect(pickVersion(versions, 'v2:fileB').id).toBe('v2:fileB')
  })

  test('falls back to the first version when versionId does not match', () => {
    expect(pickVersion(versions, 'nonexistent').id).toBe('v1:fileA')
  })

  test('EMPTY LIST: returns null instead of undefined (page must not dereference .id and crash)', () => {
    // RED: current implementation returns versions[0] === undefined here,
    // and ReviewWorkspacePage reads version.id → TypeError.
    // Desired: explicit null so the page can branch to its empty state.
    expect(pickVersion([], '')).toBeNull()
  })

  test('page code must not crash when picking from an empty list', () => {
    const picked = pickVersion([], '')
    // Mirrors ReviewWorkspacePage usage: key={version.id}, src={version.url},
    // {version.label} — must be safe when nothing is picked.
    expect(() => {
      if (picked) {
        void picked.id
        void picked.url
        void picked.label
      }
    }).not.toThrow()
    expect(picked).toBeNull()
  })
})
