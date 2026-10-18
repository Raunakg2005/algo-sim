import { describe, expect, it } from "vitest"
import { averageRating } from "@/lib/feedback-stats"

describe("admin average rating", () => {
  it("averages only the four Excellent..Poor questions", () => {
    const f = { ratings: { simulation: "Excellent", manuals: "Very Good", interpretability: "Good", experience: "Excellent", innovative: "Yes", readManual: "No" } }
    expect(averageRating([f])).toBeCloseTo(4.25)
  })
  it("returns null when there is nothing to average", () => {
    expect(averageRating([])).toBeNull()
  })
})
