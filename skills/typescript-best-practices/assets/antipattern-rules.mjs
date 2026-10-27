// Requires typescript-eslint with typed linting, strictNullChecks, and noUncheckedIndexedAccess.
const conditionOptions = {
  allowConstantLoopConditions: "only-allowed-literals",
};

export default {
  "@typescript-eslint/no-unnecessary-condition": [
    "error",
    { ...conditionOptions, checkTypePredicates: true },
  ],
  "@typescript-eslint/no-unnecessary-type-conversion": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
};

// Tests verify runtime values even when their declared types already agree.
export const testRules = {
  "@typescript-eslint/no-unnecessary-condition": [
    "error",
    { ...conditionOptions, checkTypePredicates: false },
  ],
};
