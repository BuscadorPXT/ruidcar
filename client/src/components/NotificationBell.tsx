import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useLocation } from 'wouter';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationBell() {
  const [, setLocation] = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'workshop_pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'workshop_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'workshop_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'workshop_pending':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'workshop_approved':
        return 'bg-green-50 hover:bg-green-100';
      case 'workshop_rejected':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar se houver URL
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    relative p-3 rounded-md cursor-pointer transition-colors
                    ${getNotificationColor(notification.type)}
                    ${!notification.read ? 'border-l-4 border-primary' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(
                          new Date(notification.timestamp),
                          { addSuffix: true, locale: ptBR }
                        )}
                        {notification.actionUrl && (
                          <>
                            <span>•</span>
                            <span className="text-primary flex items-center gap-1">
                              Ver detalhes
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center text-sm"
              onClick={() => {
                setLocation('/notifications');
                setIsOpen(false);
              }}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}