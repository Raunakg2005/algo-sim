// Average of the four Excellent..Poor questions of the feedback form (Yes/No style answers are not ratings).
export const RATING_SCALE: Record<string, number> = { Excellent: 5, "Very Good": 4, Good: 3, Fair: 2, Poor: 1 }
export const RATED_QUESTIONS = ["simulation", "manuals", "interpretability", "experience"] as const

export function averageRating(feedbacks: { ratings: Record<string, string> }[]): number | null {
  let total = 0
  let count = 0
  for (const f of feedbacks) {
    for (const q of RATED_QUESTIONS) {
      const v = RATING_SCALE[f.ratings?.[q]]
      if (v !== undefined) {
        total += v
        count++
      }
    }
  }
  return count > 0 ? total / count : null
}
