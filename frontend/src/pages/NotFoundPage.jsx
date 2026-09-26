import { Compass } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/Skeleton';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState icon={Compass} title="Page not found" action={<ButtonLink to="/dashboard">Back to dashboard</ButtonLink>}>
        That address doesn’t match any page in StockSense.
      </EmptyState>
    </Card>
  );
}
