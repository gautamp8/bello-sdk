import { useState, useCallback } from 'react';

type InfoCollectionModalProps = {
  open: boolean;
  fields: string[];
  reason: string;
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

  return (
    <div className="bello-info-overlay">
      {/* Backdrop */}
      <div className="bello-info-backdrop" onClick={handleDismiss} />

      {/* Modal */}
      <div className="bello-info-modal">
        <div className="bello-info-title">Share your details</div>
        {reason && <div className="bello-info-reason">{reason}</div>}

        <form onSubmit={handleSubmit} className="bello-info-form">
          {fields.map((field) => {
            const cfg = FIELD_CONFIG[field];
            if (!cfg) return null;
            return (
              <div key={field}>
                <label htmlFor={`info-${field}`} className="bello-info-label">
                  {cfg.label}
                </label>
                <input
                  id={`info-${field}`}
                  type={cfg.type}
                  placeholder={cfg.placeholder}
                  value={values[field] ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="bello-info-input"
                />
              </div>
            );
          })}

          <div className="bello-info-actions">
            <button
              type="button"
              onClick={handleDismiss}
              className="bello-info-btn bello-info-btn-skip"
            >
              Skip
            </button>
            <button
              type="submit"
              className="bello-info-btn bello-info-btn-submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
