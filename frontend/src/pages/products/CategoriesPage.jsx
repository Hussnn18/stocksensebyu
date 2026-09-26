import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Field';
import { EmptyState, Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { isManager } from '../../lib/constants';

export default function CategoriesPage() {
  const toast = useToast();
  const { data: categories } = useAsync(getCategories);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const canManage = isManager(useAuth().user);

  const add = async (event) => {
    event.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const created = await createCategory(name);
      toast.success(`Category “${created.name}” added`);
      setName('');
    } catch (error) {
      setAddError(error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Group products so you can filter the catalog and the dashboard by category." />

      <div className={canManage ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]' : 'max-w-3xl'}>
        <Card>
          <CardHeader title="All categories" description={categories ? `${categories.length} categories` : 'Loading…'} />
          {!categories ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState icon={Tags} title="No categories yet">
              Add your first one on the right.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} canManage={canManage} onDelete={() => setDeleting(c)} />
              ))}
            </ul>
          )}
        </Card>

        {canManage && (
        <Card className="h-fit">
          <CardHeader title="Add category" />
          <form onSubmit={add} noValidate className="space-y-3 p-5">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAddError(null);
              }}
              placeholder="e.g. Electrical"
              aria-label="Category name"
              aria-invalid={addError ? true : undefined}
            />
            {addError && <p className="text-xs font-medium text-rose-600">{addError}</p>}
            <Button type="submit" variant="primary" loading={adding} disabled={!name.trim()} className="w-full">
              <Plus />
              Add category
            </Button>
          </form>
        </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        body={
          deleting?.product_count
            ? `${deleting.product_count} product${deleting.product_count === 1 ? '' : 's'} will become uncategorized. Their stock is not affected.`
            : 'No products use this category.'
        }
        confirmLabel="Delete category"
        tone="danger"
        onConfirm={async () => {
          await deleteCategory(deleting.id);
          toast.success(`Category “${deleting.name}” deleted`);
        }}
      />
    </div>
  );
}

function CategoryRow({ category, canManage, onDelete }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.name);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (value.trim() === category.name) return setEditing(false);
    setSaving(true);
    try {
      await updateCategory(category.id, value);
      toast.success('Category renamed');
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form onSubmit={save} className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            aria-label="Category name"
            aria-invalid={error ? true : undefined}
            autoFocus
          />
          <Button type="submit" variant="primary" size="icon" aria-label="Save" loading={saving}>
            {!saving && <Check />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cancel" onClick={() => setEditing(false)}>
            <X />
          </Button>
        </form>
        {error && <p className="mt-1.5 px-1 text-xs font-medium text-rose-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Tags className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-900">{category.name}</div>
        <Link to={`/products?category=${category.id}`} className="text-xs text-slate-500 hover:text-blue-600">
          {category.product_count} product{category.product_count === 1 ? '' : 's'}
        </Link>
      </div>
      {canManage && (
      <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Rename ${category.name}`}
        onClick={() => {
          setValue(category.name);
          setEditing(true);
        }}
      >
        <Pencil />
      </Button>
      <Button variant="danger-ghost" size="icon-sm" aria-label={`Delete ${category.name}`} onClick={onDelete}>
        <Trash2 />
      </Button>
      </>
      )}
    </li>
  );
}
