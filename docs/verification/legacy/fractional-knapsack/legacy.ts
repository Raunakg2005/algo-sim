// Legacy harness: the original component as a state machine. runStep / resetSimulation / back button are
// verbatim; React state is modelled by plain variables (setX(v) assigns, setX(fn) applies fn), so the
// in-place mutation of item objects (selected[i].selected = true) is reproduced exactly.
export interface Item { id: string; name: string; weight: number; value: number; ratio: number; selected: boolean; fraction?: number }
export class Legacy {
  items: Item[]; knapsackCapacity: number; remainingCapacity: number; totalValue = 0
  currentStep = 0; isPlaying = false; allowFractions = true; sortedItems: Item[] = []; explanation = ""
  timerRef = { current: null as any }
  steps = [{ name: "Initial State" }, { name: "Sort Items" }, { name: "Select Items" }, { name: "Final Result" }]
  constructor(items: Item[], cap: number) {
    this.knapsackCapacity = cap; this.remainingCapacity = cap
    // initial useEffect: recompute ratios
    this.items = items.map((item) => ({ ...item, ratio: Number.parseFloat((item.value / item.weight).toFixed(2)) }))
  }
  set<K extends keyof this>(k: K, v: any) { (this as any)[k] = typeof v === "function" ? v((this as any)[k]) : v }
  // what the page shows
  view() { return { title: this.steps[this.currentStep]?.name ?? "Complete", explanation: this.explanation, list: this.currentStep === 0 ? this.items : this.sortedItems, knapsack: this.sortedItems.filter((i) => i.selected), remaining: this.remainingCapacity, totalValue: this.totalValue } }
  back() { this.set("currentStep", (prev: number) => Math.max(0, prev - 1)) }
  toggleFractions() { this.allowFractions = !this.allowFractions }
  runStep() {
    const self = this
    const setExplanation = (v: string) => self.set("explanation", v), setCurrentStep = (v: any) => self.set("currentStep", v)
    const setSortedItems = (v: any) => self.set("sortedItems", v), setRemainingCapacity = (v: any) => self.set("remainingCapacity", v)
    const setTotalValue = (v: any) => self.set("totalValue", v), setIsPlaying = (v: any) => self.set("isPlaying", v)
    const { currentStep, items, sortedItems, knapsackCapacity, allowFractions, totalValue, remainingCapacity } = this
    if (currentStep === 0) {
      setExplanation("These are our items with their weights, values, and value-to-weight ratios.")
      setCurrentStep(1)
    } else if (currentStep === 1) {
      const sorted = [...items].sort((a, b) => b.ratio - a.ratio)
      setSortedItems(sorted)
      setExplanation("Items are now sorted by value-to-weight ratio in descending order.")
      setCurrentStep(2)
    } else if (currentStep === 2) {
      let remaining = knapsackCapacity
      let value = 0
      const selected = [...sortedItems]

      for (let i = 0; i < selected.length; i++) {
        if (remaining >= selected[i].weight) {
          selected[i].selected = true
          selected[i].fraction = 1
          remaining -= selected[i].weight
          value += selected[i].value
          setExplanation(`Added ${selected[i].name} completely. Remaining capacity: ${remaining}.`)
        } else if (allowFractions && remaining > 0) {
          const fraction = remaining / selected[i].weight
          selected[i].selected = true
          selected[i].fraction = fraction
          value += selected[i].value * fraction
          remaining = 0
          setExplanation(`Added ${(fraction * 100).toFixed(1)}% of ${selected[i].name}. Knapsack is now full.`)
        } else {
          setExplanation(`Cannot add ${selected[i].name}. Not enough capacity left.`)
        }

        if (remaining === 0) break
      }

      setSortedItems(selected)
      setRemainingCapacity(remaining)
      setTotalValue(Number.parseFloat(value.toFixed(2)))
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setExplanation(`Final result: Total value: ${totalValue}. Remaining capacity: ${remainingCapacity}.`)
      setIsPlaying(false)
    }
  }
}
