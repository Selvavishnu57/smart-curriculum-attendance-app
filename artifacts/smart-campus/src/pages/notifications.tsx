import React from 'react';
import { useAuth } from '@/lib/auth';
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@workspace/api-client-react';
import { Bell, CheckCircle2, AlertTriangle, Calendar, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const { data: notificationsData, isLoading } = useListNotifications(
    { unreadOnly: unreadOnly ? true : undefined },
    { query: { enabled: !!user, queryKey: ['/api/notifications', { unreadOnly: unreadOnly ? true : undefined }] } }
  );

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_attendance': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'timetable_change': return <Calendar className="h-5 w-5 text-primary" />;
      case 'assignment': return <BookOpen className="h-5 w-5 text-chart-4" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }
    });
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }
    });
  };

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with your campus alerts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={unreadOnly ? "secondary" : "outline"} 
            onClick={() => setUnreadOnly(!unreadOnly)}
            size="sm"
          >
            {unreadOnly ? "Show All" : "Unread Only"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={!notifications.some((n: any) => !n.isRead)}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>You're all caught up!</p>
              <p className="text-sm">No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex gap-4 transition-colors ${!notif.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                >
                  <div className="mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className={`text-sm ${!notif.isRead ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="pl-4 flex items-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleMarkAsRead(notif.id)} title="Mark as read">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
