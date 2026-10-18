import { describe, expect, it } from "vitest"
import { feedbackSchema } from "@/lib/feedback-schema"

const valid = {
  instituteName: "K. J. Somaiya School of Engineering",
  experiments: [{ id: "1", discipline: "Computer Science and Engineering", lab: "Algorithms", experiment: "Sorting", algorithm: "Merge Sort" }],
  ratings: { simulation: "Excellent", manuals: "Good", interpretability: "Very Good", experience: "Fair", innovative: "Maybe", readManual: "No" },
}

describe("feedback validation", () => {
  it("accepts a submission built from the form's own options", () => {
    expect(feedbackSchema.safeParse(valid).success).toBe(true)
  })
  it("rejects missing, out-of-scale and oversized fields", () => {
    expect(feedbackSchema.safeParse({ ...valid, instituteName: " " }).success).toBe(false)
    expect(feedbackSchema.safeParse({ ...valid, ratings: { ...valid.ratings, simulation: "10/10" } }).success).toBe(false)
    expect(feedbackSchema.safeParse({ ...valid, experiments: [] }).success).toBe(false)
    expect(feedbackSchema.safeParse({ ...valid, instituteName: "x".repeat(201) }).success).toBe(false)
    expect(feedbackSchema.safeParse({ ...valid, ratings: { ...valid.ratings, $where: "1" } }).data?.ratings).not.toHaveProperty("$where")
  })
})
