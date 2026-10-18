# Algo-Sim

Interactive, step-by-step visualizations for courses on data structures (DS) and the analysis of algorithms
(AOA). Algo-Sim runs on a single campus server and needs no internet connection once its Docker images are
built. Every simulation's step trace is produced by a pure engine and verified against an independent reference
implementation.

## Modules (31)

| Category | Modules |
| --- | --- |
| Sorting | insertion sort, selection sort |
| Divide and conquer | max-min, merge sort, quick sort (Lomuto), heap sort, Strassen's matrix multiplication |
| Greedy | fractional knapsack, job sequencing with deadlines, minimum spanning tree (Prim, Kruskal), Dijkstra |
| Dynamic programming | multistage graph, 0/1 knapsack, travelling salesman (Held-Karp), Bellman-Ford, Floyd-Warshall, matrix chain |
| Backtracking | sum of subsets, n-queens, graph colouring |
| Branch and bound | 0/1 knapsack, 15-puzzle (Manhattan distance) |
| Data structures | stack, linear queue, circular queue, deque, priority queue, singly / doubly / circular / circular doubly linked list |

Each module accepts custom input with validation, has play, pause, step and reset controls with a speed setting,
and shows a caption for every frame. Most modules also show the code with the current line highlighted.
Menu entries marked "Coming soon" (binary search trees, graph traversals, hashing, sets) are not implemented yet.

## How it is built

```
lib/engines/      one pure engine per module: input -> complete list of frames (no React, no randomness)
components/       React views: validate input, call the engine, play the frames back
tests/reference/  independent reference implementations (oracles)
tests/engines/    property-based tests (fast-check + Vitest): engine vs. oracle on random inputs
bench/            pre-computation benchmark of every engine
scripts/          account provisioning, browser audit, end-to-end sign-in check
```

## Run it

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md). In short:

```bash
cp .env.example .env              # set NEXTAUTH_URL, NEXTAUTH_SECRET, MONGO_ROOT_PASSWORD, ADMIN_EMAILS
docker compose up -d --build
docker compose exec app node scripts/create-users.mjs students.csv credentials-out.csv
```

For development:

```bash
npm ci
npm run dev
```

## Checks

```bash
npm run typecheck                                       # TypeScript, strict mode
npm test                                                # property-based tests of all 31 engines
npm run build                                           # production build
npx vitest run --config vitest.bench.config.ts          # engine benchmark -> bench/results.json
node scripts/offline-audit.mjs http://127.0.0.1:3000    # browser audit of every module (needs Edge or Chrome)
node scripts/e2e-auth.mjs http://127.0.0.1:3000 creds.csv   # sign-in, feedback and admin check
```

The browser audit opens every module in a fresh profile, runs it, and reports any request that leaves the
server, page and console errors, buttons without an accessible name, load timing and a screenshot.

## Licence

MIT, see [LICENSE](LICENSE).
