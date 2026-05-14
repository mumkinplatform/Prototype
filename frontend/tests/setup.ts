// Shared frontend test setup — registers jest-dom matchers (toBeInTheDocument, etc.)
// and resets the DOM after every test so components from one test don't leak into the next.

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
