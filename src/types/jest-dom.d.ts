// Bring @testing-library/jest-dom's custom matchers (toBeInTheDocument,
// toHaveClass, toHaveAttribute, …) into TypeScript's scope for test files.
// jest-dom is imported at runtime in jest.setup.js, but that JS file doesn't
// surface the type augmentation to the TS program, so we reference it here.
import '@testing-library/jest-dom'
