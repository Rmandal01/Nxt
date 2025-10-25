"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Play, RotateCcw, Copy, Download, Settings, Zap, Code2, Eye } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("")
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [model, setModel] = useState("gemini-2.0-flash-exp")
  const [temperature, setTemperature] = useState("0.7")

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setOutput("")

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const jsonStr = line.substring(2)
              try {
                const parsed = JSON.parse(jsonStr)
                if (parsed.content) {
                  fullText += parsed.content
                  setOutput(fullText)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating response:', error)
      setOutput('Error: Failed to generate response. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setPrompt("")
    setOutput("")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
  }

  const promptTemplates = [
    {
      name: "Marketing Email",
      prompt:
        "Write a compelling marketing email for [product] that highlights [key benefits] and includes a clear call-to-action. Target audience: [audience]. Tone: [tone].",
    },
    {
      name: "Code Explanation",
      prompt:
        "Explain the following code in simple terms, breaking down what each part does and why it's important: [code snippet]",
    },
    {
      name: "Creative Story",
      prompt:
        "Write a short story about [topic] in the style of [author/genre]. Include: [specific elements]. Length: [word count].",
    },
    {
      name: "Data Analysis",
      prompt:
        "Analyze the following data and provide insights: [data]. Focus on: [specific aspects]. Present findings in [format].",
    },
  ]

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Prompt Testing Playground</h1>
                <p className="text-muted-foreground">Experiment and refine your prompts before battle</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left sidebar - Templates and tips */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {/* Model settings */}
              <Card className="p-6 glass-effect border-primary/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Model Settings
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Model</label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="bg-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Latest)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Temperature</label>
                    <Select value={temperature} onValueChange={setTemperature}>
                      <SelectTrigger className="bg-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.3">0.3 (Focused)</SelectItem>
                        <SelectItem value="0.7">0.7 (Balanced)</SelectItem>
                        <SelectItem value="1.0">1.0 (Creative)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Prompt templates */}
              <Card className="p-6 glass-effect border-accent/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-accent" />
                  Quick Templates
                </h3>
                <div className="space-y-2">
                  {promptTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(template.prompt)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm"
                    >
                      <div className="font-medium mb-1">{template.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Quick tips */}
              <Card className="p-6 glass-effect border-success/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-success" />
                  Testing Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-success">•</span>
                    <span>Test multiple variations of your prompt</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">•</span>
                    <span>Compare outputs with different temperatures</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">•</span>
                    <span>Iterate based on what works best</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">•</span>
                    <span>Save your best prompts for battles</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Main area - Editor and output */}
            <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="split" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Split View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-6">
                  {/* Prompt input */}
                  <Card className="p-6 glass-effect border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Your Prompt</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {prompt.length} chars
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your prompt here... Try to be specific and clear about what you want."
                      className="min-h-[300px] bg-secondary/30 border-border/50 focus:border-primary transition-colors resize-none font-mono"
                    />
                    <div className="mt-4">
                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Generate Output
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* Output display */}
                  {output && (
                    <Card className="p-6 glass-effect border-accent/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">AI Output</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCopy}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30 min-h-[200px] text-foreground leading-relaxed">
                        {output}
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="split" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Prompt side */}
                    <Card className="p-6 glass-effect border-primary/20">
                      <h3 className="font-semibold mb-4">Prompt</h3>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt..."
                        className="min-h-[400px] bg-secondary/30 border-border/50 focus:border-primary transition-colors resize-none font-mono text-sm"
                      />
                      <div className="mt-4">
                        <Button
                          onClick={handleGenerate}
                          disabled={!prompt.trim() || isGenerating}
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                        >
                          {isGenerating ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                    </Card>

                    {/* Output side */}
                    <Card className="p-6 glass-effect border-accent/20">
                      <h3 className="font-semibold mb-4">Output</h3>
                      <div className="p-4 rounded-lg bg-secondary/30 min-h-[400px] text-foreground leading-relaxed text-sm">
                        {output || "Output will appear here after generation..."}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Prompt analysis */}
              <Card className="p-6 glass-effect border-primary/20">
                <h3 className="font-semibold mb-4">Prompt Analysis</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-primary mb-1">{prompt.length > 100 ? "Good" : "Low"}</div>
                    <div className="text-sm text-muted-foreground">Detail Level</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-accent mb-1">{prompt.includes("[") ? "Yes" : "No"}</div>
                    <div className="text-sm text-muted-foreground">Has Placeholders</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-success mb-1">{prompt.split(".").length - 1}</div>
                    <div className="text-sm text-muted-foreground">Instructions</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
