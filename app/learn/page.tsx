"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  GraduationCap,
  Lightbulb,
  Target,
  CheckCircle2,
  Lock,
  Play,
  Trophy,
  Zap,
  Code2,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function LearnPage() {
  const [completedLessons, setCompletedLessons] = useState<number[]>([1, 2])

  const lessons = [
    {
      id: 1,
      title: "Introduction to Prompt Engineering",
      description: "Learn the basics of crafting effective prompts",
      duration: "10 min",
      difficulty: "Beginner",
      locked: false,
    },
    {
      id: 2,
      title: "Being Specific and Clear",
      description: "Master the art of clarity in your instructions",
      duration: "15 min",
      difficulty: "Beginner",
      locked: false,
    },
    {
      id: 3,
      title: "Context and Constraints",
      description: "Provide the right context for better outputs",
      duration: "20 min",
      difficulty: "Intermediate",
      locked: false,
    },
    {
      id: 4,
      title: "Few-Shot Learning",
      description: "Use examples to guide AI behavior",
      duration: "25 min",
      difficulty: "Intermediate",
      locked: false,
    },
    {
      id: 5,
      title: "Chain of Thought",
      description: "Break down complex reasoning tasks",
      duration: "30 min",
      difficulty: "Advanced",
      locked: true,
    },
    {
      id: 6,
      title: "Role-Based Prompting",
      description: "Assign personas for specialized outputs",
      duration: "20 min",
      difficulty: "Advanced",
      locked: true,
    },
  ]

  const techniques = [
    {
      name: "Be Specific",
      description: "Clearly define what you want the AI to do",
      example: 'Instead of "Write about dogs", try "Write a 200-word article about Golden Retrievers as family pets"',
      icon: Target,
    },
    {
      name: "Provide Context",
      description: "Give background information to guide the AI",
      example: 'Add context like "You are a marketing expert writing for millennials interested in sustainability"',
      icon: MessageSquare,
    },
    {
      name: "Use Examples",
      description: "Show the AI what you want with examples",
      example: "Provide 2-3 examples of the desired output format or style",
      icon: Code2,
    },
    {
      name: "Set Constraints",
      description: "Define boundaries and requirements",
      example: 'Specify "Use simple language, avoid jargon, keep under 500 words"',
      icon: Zap,
    },
  ]

  const challenges = [
    {
      id: 1,
      title: "First Prompt Challenge",
      description: "Write a prompt that generates a product description",
      points: 100,
      completed: true,
    },
    {
      id: 2,
      title: "Context Master",
      description: "Create a prompt with rich context for better results",
      points: 150,
      completed: true,
    },
    {
      id: 3,
      title: "Example Expert",
      description: "Use few-shot learning to guide AI output",
      points: 200,
      completed: false,
    },
    {
      id: 4,
      title: "Advanced Reasoning",
      description: "Implement chain-of-thought prompting",
      points: 300,
      completed: false,
    },
  ]

  const progressPercentage = (completedLessons.length / lessons.length) * 100

  return (
    <>
      <Navigation />

      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Learning Hub</h1>
                <p className="text-muted-foreground">Master prompt engineering from beginner to expert</p>
              </div>
              <Button className="bg-gradient-to-r from-primary to-accent">
                <Trophy className="w-4 h-4 mr-2" />
                View Achievements
              </Button>
            </div>

            {/* Progress overview */}
            <Card className="p-6 glass-effect border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedLessons.length} of {lessons.length} lessons completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </Card>
          </div>

          <Tabs defaultValue="lessons" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="techniques" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Techniques
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Challenges
              </TabsTrigger>
            </TabsList>

            {/* Lessons tab */}
            <TabsContent value="lessons" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id)
                  const isLocked = lesson.locked

                  return (
                    <Card
                      key={lesson.id}
                      className={`p-6 glass-effect transition-all hover:scale-105 ${
                        isLocked
                          ? "border-border/20 opacity-60"
                          : isCompleted
                            ? "border-success/40"
                            : "border-primary/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isLocked
                              ? "bg-muted"
                              : isCompleted
                                ? "bg-success/20"
                                : "bg-gradient-to-br from-primary to-accent"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-success" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-primary-foreground" />
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            lesson.difficulty === "Beginner"
                              ? "bg-success/20 text-success"
                              : lesson.difficulty === "Intermediate"
                                ? "bg-primary/20 text-primary"
                                : "bg-accent/20 text-accent"
                          }`}
                        >
                          {lesson.difficulty}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lesson.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                        <Button size="sm" disabled={isLocked} variant={isCompleted ? "outline" : "default"}>
                          {isLocked ? (
                            "Locked"
                          ) : isCompleted ? (
                            "Review"
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Techniques tab */}
            <TabsContent value="techniques" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {techniques.map((technique, index) => {
                  const Icon = technique.icon
                  return (
                    <Card
                      key={index}
                      className="p-6 glass-effect border-primary/20 hover:border-primary/40 transition-all animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{technique.name}</h3>
                          <p className="text-sm text-muted-foreground">{technique.description}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <span className="text-xs font-semibold text-accent">Example</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{technique.example}</p>
                      </div>

                      <Button variant="outline" className="w-full mt-4 bg-transparent">
                        Try in Playground
                      </Button>
                    </Card>
                  )
                })}
              </div>

              {/* Best practices section */}
              <Card className="p-6 glass-effect border-accent/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  Best Practices
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Start with clear objectives</div>
                        <div className="text-sm text-muted-foreground">
                          Define exactly what you want before writing your prompt
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Iterate and refine</div>
                        <div className="text-sm text-muted-foreground">
                          Test multiple versions to find what works best
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Use structured formats</div>
                        <div className="text-sm text-muted-foreground">
                          Organize your prompt with clear sections and bullet points
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Provide relevant context</div>
                        <div className="text-sm text-muted-foreground">
                          Include background information that helps the AI understand
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Specify output format</div>
                        <div className="text-sm text-muted-foreground">
                          Tell the AI how you want the response structured
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Test edge cases</div>
                        <div className="text-sm text-muted-foreground">
                          Verify your prompt works in different scenarios
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Challenges tab */}
            <TabsContent value="challenges" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {challenges.map((challenge, index) => (
                  <Card
                    key={challenge.id}
                    className={`p-6 glass-effect transition-all hover:scale-105 ${
                      challenge.completed ? "border-success/40" : "border-primary/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          challenge.completed ? "bg-success/20" : "bg-gradient-to-br from-primary to-accent"
                        }`}
                      >
                        {challenge.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-success" />
                        ) : (
                          <Target className="w-6 h-6 text-primary-foreground" />
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        {challenge.points} pts
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

                    <Button
                      className={`w-full ${
                        challenge.completed
                          ? "bg-success/20 text-success hover:bg-success/30"
                          : "bg-gradient-to-r from-primary to-accent"
                      }`}
                    >
                      {challenge.completed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Challenge
                        </>
                      )}
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Daily challenge */}
              <Card className="p-6 glass-effect border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 bg-accent/20 text-accent">
                      Daily Challenge
                    </Badge>
                    <h3 className="font-semibold text-xl mb-2">Marketing Email Master</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a compelling marketing email prompt that generates a high-converting message for a new
                      product launch. Bonus points for including personalization elements!
                    </p>
                    <div className="flex items-center gap-4">
                      <Button className="bg-gradient-to-r from-accent to-primary">
                        <Play className="w-4 h-4 mr-2" />
                        Accept Challenge
                      </Button>
                      <span className="text-sm text-muted-foreground">Expires in 18h 42m</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
