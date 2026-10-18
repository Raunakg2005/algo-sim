import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMongoClient } from "@/lib/mongodb"
import { feedbackSchema } from "@/lib/feedback-schema"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = feedbackSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 })
    }
    const body = parsed.data
    const client = await getMongoClient()
    const db = client.db()

    const feedback = {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      instituteName: body.instituteName,
      experiments: body.experiments,
      ratings: body.ratings,
      createdAt: new Date(),
    }

    const result = await db.collection("feedbacks").insertOne(feedback)

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db()

    const feedbacks = await db
      .collection("feedbacks")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ feedbacks })
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 })
  }
}
