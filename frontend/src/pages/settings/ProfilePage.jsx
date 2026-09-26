import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { updateProfile } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../lib/constants';
import { displayName, initials } from '../../lib/utils';

export default function ProfilePage() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== (user?.name || '');

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(name);
      login({ ...user, ...updated }, token);
      toast.success('Profile updated');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your account details. To change your password, use “Forgot password” on the sign-in screen." />
      <Card className="max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-100 p-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white">{initials(user?.name)}</div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black tracking-tight text-slate-900">{displayName(user?.name)}</div>
            <div className="truncate text-sm text-slate-500">
              {user?.email} · {roleLabel(user?.role)}
            </div>
          </div>
        </div>
        <CardHeader title="Details" className="border-b-0 pb-0" />
        <form onSubmit={save} noValidate className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Full name" error={error}>
            {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
          </Field>
          <Field label="Email" hint="Your sign-in email can’t be changed here.">
            {(p) => <Input {...p} value={user?.email || ''} readOnly disabled />}
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" variant="primary" loading={saving} disabled={!changed || !name.trim()}>
              Save changes
            </Button>
          </div>
        </form>
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
