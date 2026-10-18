"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import NavBar from "@/components/navbar"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { averageRating } from "@/lib/feedback-stats"

type Feedback = {
  _id: string
  userName: string
  userEmail: string
  instituteName: string
  experiments: Array<{
    discipline: string
    lab: string
    experiment: string
    algorithm: string
  }>
  ratings: {
    simulation: string
    manuals: string
    interpretability: string
    experience: string
    innovative: string
    readManual: string
  }
  createdAt: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session && !session.user?.isAdmin) {
      router.push("/dashboard")
    } else if (session?.user?.isAdmin) {
      fetchFeedbacks()
    }
  }, [session, status, router])

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch("/api/feedback")
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks)
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  const getStats = () => {
    const totalFeedbacks = feedbacks.length
    const uniqueInstitutes = new Set(feedbacks.map((f) => f.instituteName)).size
    const uniqueUsers = new Set(feedbacks.map((f) => f.userEmail)).size

    // Total experiments count
    const totalExperiments = feedbacks.reduce((sum, f) => sum + f.experiments.length, 0)

    // Discipline distribution
    const disciplineCounts: Record<string, number> = {}
    const labCounts: Record<string, number> = {}
    const experimentCounts: Record<string, number> = {}
    const algorithmCounts: Record<string, number> = {}

    feedbacks.forEach((feedback) => {
      feedback.experiments.forEach((exp) => {
        disciplineCounts[exp.discipline] = (disciplineCounts[exp.discipline] || 0) + 1
        labCounts[exp.lab] = (labCounts[exp.lab] || 0) + 1
        experimentCounts[exp.experiment] = (experimentCounts[exp.experiment] || 0) + 1
        if (exp.algorithm) {
          algorithmCounts[exp.algorithm] = (algorithmCounts[exp.algorithm] || 0) + 1
        }
      })
    })

    const ratingCounts: Record<string, Record<string, number>> = {
      simulation: {},
      manuals: {},
      interpretability: {},
      experience: {},
      innovative: {},
      readManual: {},
    }

    feedbacks.forEach((feedback) => {
      Object.entries(feedback.ratings).forEach(([key, value]) => {
        if (key in ratingCounts) {
          ratingCounts[key][value] = (ratingCounts[key][value] || 0) + 1
        }
      })
    })

    // average of the four Excellent..Poor questions only (see lib/feedback-stats.ts)
    const average = averageRating(feedbacks)
    const avgRating = average === null ? 0 : average.toFixed(1)

    return {
      totalFeedbacks,
      uniqueInstitutes,
      uniqueUsers,
      totalExperiments,
      ratingCounts,
      disciplineCounts,
      labCounts,
      experimentCounts,
      algorithmCounts,
      avgRating,
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="p-4 max-w-7xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Logged in as: <span className="font-medium">{session?.user?.email}</span>
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Feedbacks</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalFeedbacks}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Unique Users</h3>
            <p className="text-3xl font-bold text-green-600">{stats.uniqueUsers}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Institutes</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.uniqueInstitutes}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Rating</h3>
            <p className="text-3xl font-bold text-orange-600">
              {stats.avgRating}/5
            </p>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedbacks">All Feedbacks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Disciplines</h3>
                <div className="space-y-2">
                  {Object.entries(stats.disciplineCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([discipline, count]) => (
                      <div key={discipline} className="flex justify-between items-center">
                        <span className="text-sm">{discipline}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Algorithms</h3>
                <div className="space-y-2">
                  {Object.entries(stats.algorithmCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([algorithm, count]) => (
                      <div key={algorithm} className="flex justify-between items-center">
                        <span className="text-sm">{algorithm}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Labs</h3>
                <div className="space-y-2">
                  {Object.entries(stats.labCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([lab, count]) => (
                      <div key={lab} className="flex justify-between items-center">
                        <span className="text-sm">{lab}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Experiments</h3>
                <div className="space-y-2">
                  {Object.entries(stats.experimentCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([experiment, count]) => (
                      <div key={experiment} className="flex justify-between items-center">
                        <span className="text-sm text-ellipsis overflow-hidden">{experiment}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedbacks">
            <Card className="p-6">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Institute</TableHead>
                      <TableHead>Experiments</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((feedback) => (
                      <TableRow key={feedback._id}>
                        <TableCell className="text-sm">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{feedback.userName}</div>
                            <div className="text-gray-500">{feedback.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{feedback.instituteName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {feedback.experiments.slice(0, 2).map((exp, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {exp.experiment}
                              </Badge>
                            ))}
                            {feedback.experiments.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{feedback.experiments.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              feedback.ratings.experience === "Excellent"
                                ? "default"
                                : feedback.ratings.experience === "Very Good"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {feedback.ratings.experience}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => setSelectedFeedback(feedback)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Rating Distribution Pie Charts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Rating Distribution Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.entries(stats.ratingCounts).map(([category, counts]) => {
                    const chartData = Object.entries(counts).map(([rating, count]) => ({
                      name: rating,
                      value: count,
                      percentage: ((count / feedbacks.length) * 100).toFixed(1),
                    }))

                    const COLORS = {
                      Excellent: "#10b981",
                      "Very Good": "#3b82f6",
                      Good: "#f59e0b",
                      Fair: "#f97316",
                      Poor: "#ef4444",
                      Yes: "#10b981",
                      No: "#ef4444",
                    }

                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium capitalize text-center">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Top Algorithms Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Top 10 Algorithms Usage</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(stats.algorithmCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([name, count]) => ({ name, count }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Labs by Usage</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(stats.labCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([name, count]) => ({ name, count }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Discipline Distribution Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Discipline Distribution</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.disciplineCounts).map(([name, value]) => ({
                          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                          fullName: name,
                          value,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => entry.percent ? `${entry.name}: ${(entry.percent * 100).toFixed(0)}%` : entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(stats.disciplineCounts).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'][index % 8]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Experiments</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={Object.entries(stats.experimentCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([name, count]) => ({
                          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                          count,
                        }))}
                      layout="horizontal"
                      margin={{ top: 5, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Feedback Timeline */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Feedback Submission Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={(() => {
                      const timelineData: Record<string, number> = {}
                      feedbacks.forEach((f) => {
                        const date = new Date(f.createdAt).toLocaleDateString()
                        timelineData[date] = (timelineData[date] || 0) + 1
                      })
                      return Object.entries(timelineData)
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([date, count]) => ({ date, count }))
                    })()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Institute Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Feedback by Institute</h3>
                <div className="space-y-3">
                  {Object.entries(
                    feedbacks.reduce((acc, f) => {
                      acc[f.instituteName] = (acc[f.instituteName] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([institute, count]) => (
                      <div key={institute} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{institute}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-48 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                              style={{ width: `${(count / feedbacks.length) * 100}%` }}
                            />
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
              <DialogDescription>
                Submitted on {selectedFeedback && new Date(selectedFeedback.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            {selectedFeedback && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">User Name</h4>
                    <p>{selectedFeedback.userName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Email</h4>
                    <p>{selectedFeedback.userEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Institute Name</h4>
                    <p>{selectedFeedback.instituteName}</p>
                  </div>
                </div>

                {/* Experiments */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Experiments Performed</h4>
                  <div className="space-y-3">
                    {selectedFeedback.experiments.map((exp, i) => (
                      <Card key={i} className="p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Discipline:</span> {exp.discipline}
                          </div>
                          <div>
                            <span className="font-medium">Lab:</span> {exp.lab}
                          </div>
                          <div>
                            <span className="font-medium">Experiment:</span> {exp.experiment}
                          </div>
                          <div>
                            <span className="font-medium">Algorithm:</span> {exp.algorithm || "N/A"}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Ratings</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Simulation Quality</span>
                      <Badge>{selectedFeedback.ratings.simulation}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Manuals Helpfulness</span>
                      <Badge>{selectedFeedback.ratings.manuals}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Result Interpretability</span>
                      <Badge>{selectedFeedback.ratings.interpretability}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Overall Experience</span>
                      <Badge>{selectedFeedback.ratings.experience}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Innovation Level</span>
                      <Badge>{selectedFeedback.ratings.innovative}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Read Manual Before?</span>
                      <Badge>{selectedFeedback.ratings.readManual}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
