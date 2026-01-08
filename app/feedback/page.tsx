"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ExperimentRow = {
  id: string
  discipline: string
  lab: string
  experiment: string
  algorithm: string
}

const disciplines = [
  "Biotechnology and Biomedical Engineering",
  "Chemical Sciences",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronics and Communications",
  "Mechanical Engineering",
  "Physical Sciences",
]

const labs: Record<string, string[]> = {
  "Biotechnology and Biomedical Engineering": [
    "Bioinformatics and Computational Biology",
    "Biochemistry",
    "Molecular Biology",
  ],
  "Computer Science and Engineering": [
    "Data Structures",
    "Algorithms",
    "Database Management",
    "Operating Systems",
  ],
  "Electrical Engineering": ["Control Systems", "Power Systems", "Signal Processing"],
}

const experiments: Record<string, string[]> = {
  "Bioinformatics and Computational Biology": [
    "An introduction to Next Generation Sequencing (NGS)",
    "Sequence Alignment",
    "Protein Structure Prediction",
  ],
  "Data Structures": ["Linked List Operations", "Tree Traversals", "Graph Algorithms"],
  Algorithms: ["Sorting", "Divide and Conquer", "Greedy Technique", "Dynamic Programming", "Backtracking", "Branch and Bound"],
}

const algorithms: Record<string, string[]> = {
  "Sorting": ["Insertion Sort", "Selection Sort"],
  "Divide and Conquer": ["Minimum and Maximum", "Merge Sort", "Quick Sort", "Heap Sort", "Strassen's Matrix Multiplication"],
  "Greedy Technique": ["Knapsack Problem", "Job Scheduling with Deadlines", "Minimum Spanning Trees", "Single Source Shortest Path"],
  "Dynamic Programming": ["Multistage Graphs", "0/1 Knapsack", "Travelling Salesman Problem", "Single Source Shortest Path", "All Pairs Shortest Path", "Matrix Chain Multiplication"],
  "Backtracking": ["Sum of Subsets", "8-Queens Problem", "Graph Coloring"],
  "Branch and Bound": ["0/1 Knapsack", "15 Puzzle Problem"],
  "Linked List Operations": ["Singly Linked List", "Doubly Linked List", "Circular Linked List", "Circular Doubly Linked List"],
  "Tree Traversals": ["Binary Search Tree"],
  "Graph Algorithms": ["DFS", "BFS"],
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [instituteName, setInstituteName] = useState("")
  const [experimentRows, setExperimentRows] = useState<ExperimentRow[]>([
    { id: "1", discipline: "", lab: "", experiment: "", algorithm: "" },
  ])
  const [ratings, setRatings] = useState({
    simulation: "",
    manuals: "",
    interpretability: "",
    experience: "",
    innovative: "",
    readManual: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === "unauthenticated") {
    return null
  }

  const addExperimentRow = () => {
    setExperimentRows([
      ...experimentRows,
      { id: Date.now().toString(), discipline: "", lab: "", experiment: "", algorithm: "" },
    ])
  }

  const removeExperimentRow = (id: string) => {
    if (experimentRows.length > 1) {
      setExperimentRows(experimentRows.filter((row) => row.id !== id))
    }
  }

  const updateExperimentRow = (id: string, field: keyof ExperimentRow, value: string) => {
    setExperimentRows(
      experimentRows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value }
          if (field === "discipline") {
            updated.lab = ""
            updated.experiment = ""
            updated.algorithm = ""
          } else if (field === "lab") {
            updated.experiment = ""
            updated.algorithm = ""
          } else if (field === "experiment") {
            updated.algorithm = ""
          }
          return updated
        }
        return row
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!instituteName.trim()) {
      setError("Please enter your institute name")
      return
    }

    const hasValidExperiment = experimentRows.some(
      (row) => row.discipline && row.lab && row.experiment && row.algorithm,
    )

    if (!hasValidExperiment) {
      setError("Please select at least one complete experiment with algorithm")
      return
    }

    const hasAllRatings = Object.values(ratings).every((rating) => rating !== "")
    if (!hasAllRatings) {
      setError("Please answer all questions")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteName,
          experiments: experimentRows.filter((row) => row.discipline && row.lab && row.experiment),
          ratings,
        }),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => router.push("/dashboard"), 2000)
      } else {
        setError("Failed to submit feedback. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600">Your feedback has been submitted successfully.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Virtual Lab Feedback</h1>
          <p className="text-gray-600 mb-4">
            Logged in as: <span className="font-medium">{session?.user?.email}</span>
          </p>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="institute">Institute Name *</Label>
              <Input
                id="institute"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="Enter your institute name"
                required
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Experiments</h2>
              <Button type="button" onClick={addExperimentRow} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Experiment
              </Button>
            </div>

            <div className="space-y-4">
              {experimentRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                  <div className="md:col-span-1">
                    <Label className="text-xs mb-1 block">S.No: {index + 1}</Label>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Discipline</Label>
                    <Select
                      value={row.discipline}
                      onValueChange={(value) => updateExperimentRow(row.id, "discipline", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplines.map((disc) => (
                          <SelectItem key={disc} value={disc}>
                            {disc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Lab</Label>
                    <Select
                      value={row.lab}
                      onValueChange={(value) => updateExperimentRow(row.id, "lab", value)}
                      disabled={!row.discipline}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lab" />
                      </SelectTrigger>
                      <SelectContent>
                        {(labs[row.discipline] || []).map((lab) => (
                          <SelectItem key={lab} value={lab}>
                            {lab}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Experiment</Label>
                    <Select
                      value={row.experiment}
                      onValueChange={(value) => updateExperimentRow(row.id, "experiment", value)}
                      disabled={!row.lab}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Experiment" />
                      </SelectTrigger>
                      <SelectContent>
                        {(experiments[row.lab] || []).map((exp) => (
                          <SelectItem key={exp} value={exp}>
                            {exp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Algorithm/Topic</Label>
                    <div className="flex gap-2">
                      <Select
                        value={row.algorithm}
                        onValueChange={(value) => updateExperimentRow(row.id, "algorithm", value)}
                        disabled={!row.experiment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Algorithm" />
                        </SelectTrigger>
                        <SelectContent>
                          {(algorithms[row.experiment] || []).map((algo) => (
                            <SelectItem key={algo} value={algo}>
                              {algo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {experimentRows.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeExperimentRow(row.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Please indicate your agreement with the following statements:</h2>

            <div className="space-y-2">
              <Label>The degree to which the actual lab environment is simulated *</Label>
              <RadioGroup value={ratings.simulation} onValueChange={(v) => setRatings({ ...ratings, simulation: v })}>
                {["Excellent", "Very Good", "Good", "Fair", "Poor"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`sim-${option}`} />
                    <Label htmlFor={`sim-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>The manuals were found to be helpful *</Label>
              <RadioGroup value={ratings.manuals} onValueChange={(v) => setRatings({ ...ratings, manuals: v })}>
                {["Excellent", "Very Good", "Good", "Fair", "Poor"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`man-${option}`} />
                    <Label htmlFor={`man-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>The results of experiment were easily interpretable *</Label>
              <RadioGroup
                value={ratings.interpretability}
                onValueChange={(v) => setRatings({ ...ratings, interpretability: v })}
              >
                {["Excellent", "Very Good", "Good", "Fair", "Poor"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`int-${option}`} />
                    <Label htmlFor={`int-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Please tell your agreement with the following statements:</h2>

            <div className="space-y-2">
              <Label>What was your experience while performing the experiment in virtual lab? *</Label>
              <RadioGroup value={ratings.experience} onValueChange={(v) => setRatings({ ...ratings, experience: v })}>
                {["Excellent", "Very Good", "Good", "Fair", "Poor"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`exp-${option}`} />
                    <Label htmlFor={`exp-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>
                Do you think performing experiments through Virtual Labs gives scope for more innovative and creative
                research work? *
              </Label>
              <RadioGroup value={ratings.innovative} onValueChange={(v) => setRatings({ ...ratings, innovative: v })}>
                {["Yes", "Maybe", "To some extent", "Don't know", "No"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`inn-${option}`} />
                    <Label htmlFor={`inn-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Did you go through the manual / step by step method before performing the live experiments? *</Label>
              <RadioGroup value={ratings.readManual} onValueChange={(v) => setRatings({ ...ratings, readManual: v })}>
                {["Yes", "No"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`manual-${option}`} />
                    <Label htmlFor={`manual-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px]">
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
