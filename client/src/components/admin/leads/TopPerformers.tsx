import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Medal,
  Award,
  Target,
  TrendingUp,
  Clock,
  Users,
  Star,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformerData {
  performers?: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string;
    totalLeads: number;
    conversions: number;
    conversionRate: number;
    avgResponseTime: number;
    avgDealSize: number;
    totalRevenue: number;
    score: number;
    rank: number;
    rankChange: number; // positive = improved, negative = declined
    badges: string[];
  }>;
  teamStats?: {
    avgConversionRate: number;
    totalRevenue: number;
    totalLeads: number;
    totalConversions: number;
    topPerformerName: string;
    mostImprovedName: string;
  };
}

interface TopPerformersProps {
  data?: PerformerData;
  detailed?: boolean;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return { icon: Trophy, color: 'text-yellow-500' };
  if (rank === 2) return { icon: Medal, color: 'text-gray-400' };
  if (rank === 3) return { icon: Award, color: 'text-orange-600' };
  return { icon: Target, color: 'text-muted-foreground' };
};

const getRankChangeIcon = (change: number) => {
  if (change > 0) return <ChevronUp className="h-3 w-3 text-green-500" />;
  if (change < 0) return <ChevronDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
};

const getBadgeStyle = (badge: string) => {
  const styles: Record<string, string> = {
    '🔥 Hot Streak': 'bg-orange-100 text-orange-800',
    '⭐ Top Closer': 'bg-green-100 text-green-800',
    '⚡ Fast Responder': 'bg-blue-100 text-blue-800',
    '💎 High Value': 'bg-purple-100 text-purple-800',
    '📈 Most Improved': 'bg-pink-100 text-pink-800',
  };
  return styles[badge] || 'bg-gray-100 text-gray-800';
};

export default function TopPerformers({ data, detailed = false }: TopPerformersProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPerformers = data.performers?.slice(0, detailed ? 10 : 5) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Ranking de desempenho da equipe de vendas
            </CardDescription>
          </div>
          {data.teamStats && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Taxa média da equipe</p>
              <p className="text-lg font-bold">
                {data.teamStats.avgConversionRate.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {topPerformers.length > 0 ? (
          <div className="space-y-3">
            {topPerformers.map((performer) => {
              const { icon: RankIcon, color: rankColor } = getRankIcon(performer.rank);

              return (
                <div
                  key={performer.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md",
                    performer.rank === 1 && "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    <div className="flex flex-col items-center">
                      <RankIcon className={cn("h-5 w-5", rankColor)} />
                      <span className="text-xs font-bold">#{performer.rank}</span>
                      <div className="mt-1">
                        {getRankChangeIcon(performer.rankChange)}
                      </div>
                    </div>

                    {/* Avatar and name */}
                    <Avatar>
                      <AvatarFallback>
                        {performer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">{performer.email}</p>
                      {/* Badges */}
                      {performer.badges && Array.isArray(performer.badges) && performer.badges.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {performer.badges.slice(0, 2).map((badge) => (
                            <span
                              key={badge}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                getBadgeStyle(badge)
                              )}
                            >
                              {badge}
                            </span>
                          ))}
                          {performer.badges.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{performer.badges.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Leads</p>
                      <p className="font-semibold">{performer.totalLeads}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversão</p>
                      <p className="font-semibold text-green-600">
                        {performer.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo</p>
                      <p className="font-semibold">
                        {performer.avgResponseTime.toFixed(0)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <Badge variant={performer.score >= 80 ? 'default' : 'secondary'}>
                        {performer.score}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Sem dados de performance disponíveis
          </div>
        )}

        {/* Team summary */}
        {data.teamStats && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Resumo da Equipe</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total de Leads</p>
                <p className="text-xl font-bold">{data.teamStats.totalLeads}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Conversões</p>
                <p className="text-xl font-bold text-green-600">
                  {data.teamStats.totalConversions}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">
                  R$ {data.teamStats.totalRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Top Performer</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  {data.teamStats.topPerformerName}
                </p>
              </div>
            </div>

            {/* Progress bars for detailed view */}
            {detailed && data.performers && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium">Comparação de Performance</h4>
                {data.performers.slice(0, 5).map((performer) => (
                  <div key={performer.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{performer.name}</span>
                      <span className="text-muted-foreground">
                        {performer.score} pontos
                      </span>
                    </div>
                    <Progress value={performer.score} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}