import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@winthiscard/shared';
import type { PaymentStatus } from '@winthiscard/database';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: { toString(): string };
  ticketCount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  competition: {
    title: string;
  };
}

interface RecentOrdersProps {
  orders: Order[];
}

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'secondary',
  SUCCEEDED: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
  CANCELLED: 'secondary',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No orders yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {order.user
                ? `${order.user.firstName} ${order.user.lastName}`
                : 'Deleted User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.competition.title} • {order.ticketCount} tickets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[order.paymentStatus]}>
              {order.paymentStatus}
            </Badge>
            <span className="font-medium">
              {formatPrice(Number(order.totalAmount))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
