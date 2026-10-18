import { z } from "zod"

// Server-side validation of feedback submissions (mirrors the options offered by app/feedback/page.tsx).
const quality = z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"])
const text = z.string().trim().max(200)

export const feedbackSchema = z.object({
  instituteName: text.min(1),
  experiments: z
    .array(z.object({ id: z.string().max(40).optional(), discipline: text, lab: text, experiment: text, algorithm: text.optional() }))
    .min(1)
    .max(20),
  ratings: z.object({
    simulation: quality,
    manuals: quality,
    interpretability: quality,
    experience: quality,
    innovative: z.enum(["Yes", "Maybe", "To some extent", "Don't know", "No"]),
    readManual: z.enum(["Yes", "No"]),
  }),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>
