import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../lib/constants';
import { displayName, initials } from '../../lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your account details. Use “Forgot password” on the sign-in screen to change your password with an email code." />
      <Card className="max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-100 p-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white">{initials(user?.name)}</div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">{displayName(user?.name)}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>
        <CardHeader title="Role" description={roleLabel(user?.role)} className="border-b-0" />
        <div className="flex justify-end border-t border-slate-100 p-5">
          <Button
            variant="danger-ghost"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut />
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
