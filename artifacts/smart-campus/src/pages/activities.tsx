import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useListActivities } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, MessageSquare, Briefcase, BrainCircuit, ExternalLink, ActivitySquare } from 'lucide-react';

export default function Activities() {
  const [category, setCategory] = useState<string>('all');
  
  const { data: activities, isLoading } = useListActivities(
    category !== 'all' ? { category } : undefined,
    { query: { queryKey: ['/api/activities', category !== 'all' ? { category } : undefined] } }
  );

  const categories = [
    { id: 'all', name: 'All Activities', icon: ActivitySquare },
    { id: 'Coding Practice', name: 'Coding', icon: Code },
    { id: 'Aptitude Questions', name: 'Aptitude', icon: BrainCircuit },
    { id: 'Communication Skills', name: 'Communication', icon: MessageSquare },
    { id: 'Resume Building', name: 'Career Prep', icon: Briefcase },
    { id: 'AI Learning', name: 'AI/ML', icon: BookOpen },
  ];

  const getDifficultyColor = (diff: string | null | undefined) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Free Time Activities</h2>
        <p className="text-muted-foreground">Productive tasks recommended during free hours or cancelled classes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <Button 
              key={c.id} 
              variant={category === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.id)}
              className="rounded-full"
            >
              <Icon className="w-4 h-4 mr-2" />
              {c.name}
            </Button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted/50" />
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activities?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border rounded-xl border-dashed">
          <ActivitySquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No activities found</h3>
          <p>Check back later for new recommendations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities?.map((activity) => (
            <Card key={activity.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-normal text-xs uppercase tracking-wider">
                    {activity.category}
                  </Badge>
                  {activity.difficulty && (
                    <Badge variant="secondary" className={`font-normal ${getDifficultyColor(activity.difficulty)} border-none`}>
                      {activity.difficulty}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{activity.title}</CardTitle>
                {activity.estimatedMinutes && (
                  <CardDescription>~{activity.estimatedMinutes} minutes</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {activity.description}
                </p>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                {activity.resourceUrl ? (
                  <Button variant="ghost" className="w-full justify-between" asChild>
                    <a href={activity.resourceUrl} target="_blank" rel="noopener noreferrer">
                      Access Resource <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                    No link provided
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
