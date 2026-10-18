# Verification records

- `reports/<module>.md`: for each of the 31 modules, what was tested (properties, number of random cases),
  the defects found in the original code (counts, input distribution, minimal counterexamples), and the fixes.
- `legacy/<module>/`: the harnesses that ran the original code of each module (taken from the version-control
  history, with React state replaced by plain variables) on random inputs, with their raw results.

The tests that guard the fixed engines are in `tests/engines/` and `tests/reference/`; run them with `npm test`.
