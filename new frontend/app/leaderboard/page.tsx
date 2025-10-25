"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Crown, TrendingUp, Zap, Target } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function LeaderboardPage() {
  const topPlayers = [
    { rank: 1, name: "PromptMaster", points: 15420, wins: 142, winRate: 89, trend: "up" },
    { rank: 2, name: "AIWhisperer", points: 14230, wins: 128, winRate: 85, trend: "up" },
    { rank: 3, name: "CodeCraft", points: 13890, wins: 121, winRate: 82, trend: "same" },
    { rank: 4, name: "PromptNinja", points: 12450, wins: 115, winRate: 80, trend: "down" },
    { rank: 5, name: "AIArtisan", points: 11920, wins: 108, winRate: 78, trend: "up" },
    { rank: 6, name: "PromptGuru", points: 11340, wins: 102, winRate: 76, trend: "up" },
    { rank: 7, name: "DataDruid", points: 10890, wins: 98, winRate: 74, trend: "same" },
    { rank: 8, name: "AIAlchemist", points: 10230, wins: 92, winRate: 72, trend: "down" },
    { rank: 9, name: "PromptSage", points: 9870, wins: 88, winRate: 70, trend: "up" },
    { rank: 10, name: "CodeMystic", points: 9450, wins: 84, winRate: 68, trend: "same" },
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />
    return <span className="text-muted-foreground font-semibold">#{rank}</span>
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />
    if (trend === "down") return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />
    return <div className="w-4 h-4" />
  }

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
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">Top prompt engineers from around the world</p>
          </div>

          {/* Top 3 podium */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {topPlayers.slice(0, 3).map((player, index) => (
              <Card
                key={player.rank}
                className={`p-6 glass-effect text-center ${
                  player.rank === 1
                    ? "border-yellow-500/50 md:order-2 md:scale-110"
                    : player.rank === 2
                      ? "border-gray-400/50 md:order-1"
                      : "border-amber-700/50 md:order-3"
                }`}
              >
                <div className="flex justify-center mb-4">{getRankIcon(player.rank)}</div>
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg mb-2">{player.name}</h3>
                <div className="text-3xl font-bold text-primary mb-4">{player.points.toLocaleString()}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Wins</div>
                    <div className="font-semibold">{player.wins}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Win Rate</div>
                    <div className="font-semibold">{player.winRate}%</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-3">
              {topPlayers.map((player, index) => (
                <Card
                  key={player.rank}
                  className="p-4 glass-effect border-primary/20 hover:border-primary/40 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex items-center justify-center">{getRankIcon(player.rank)}</div>

                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                        {player.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-muted-foreground">{player.wins} wins</div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                        <Badge variant="secondary" className="gap-1">
                          <Target className="w-3 h-3" />
                          {player.winRate}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Trend</div>
                        {getTrendIcon(player.trend)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{player.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="weekly">
              <Card className="p-12 glass-effect border-primary/20 text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Weekly Rankings</h3>
                <p className="text-muted-foreground">Weekly leaderboard resets every Monday</p>
              </Card>
            </TabsContent>

            <TabsContent value="friends">
              <Card className="p-12 glass-effect border-primary/20 text-center">
                <Trophy className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Friends Leaderboard</h3>
                <p className="text-muted-foreground">Connect with friends to see their rankings</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
