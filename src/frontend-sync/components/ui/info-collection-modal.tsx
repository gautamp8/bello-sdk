import { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

type InfoCollectionModalProps = {
  open: boolean;
  fields: string[];
  reason: string;
  theme: 'light' | 'dark';
  onSubmit: (data: Record<string, string>) => void;
  onDismiss: () => void;
};

const FIELD_CONFIG: Record<
  string,
  { label: string; type: string; placeholder: string }
> = {
  name: { label: 'Name', type: 'text', placeholder: 'Your name' },
  email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
  phone: { label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
  company: { label: 'Company', type: 'text', placeholder: 'Company name' },
};

export function InfoCollectionModal({
  open,
  fields,
  reason,
  theme,
  onSubmit,
  onDismiss,
}: InfoCollectionModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (field: string, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
      setValues({});
    },
    [values, onSubmit],
  );

  const handleDismiss = useCallback(() => {
    setValues({});
    onDismiss();
  }, [onDismiss]);

  if (!open) return null;

  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm rounded-xl border p-5 shadow-xl',
          isDark
            ? 'bg-gray-900 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900',
        )}
      >
        <h3
          className={cn(
            'text-base font-semibold mb-1',
            isDark ? 'text-white' : 'text-gray-900',
          )}
        >
          Share your details
        </h3>
        {reason && (
          <p
            className={cn(
              'text-xs mb-4',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            {reason}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {fields.map((field) => {
            const cfg = FIELD_CONFIG[field];
            if (!cfg) return null;
            return (
              <div key={field}>
                <label
                  htmlFor={`info-${field}`}
                  className={cn(
                    'block text-xs font-medium mb-1',
                    isDark ? 'text-gray-300' : 'text-gray-700',
                  )}
                >
                  {cfg.label}
                </label>
                <input
                  id={`info-${field}`}
                  type={cfg.type}
                  placeholder={cfg.placeholder}
                  value={values[field] ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500',
                  )}
                />
              </div>
            );
          })}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              Skip
            </button>
            <button
              type="submit"
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-gray-900 text-white hover:bg-gray-800',
              )}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
