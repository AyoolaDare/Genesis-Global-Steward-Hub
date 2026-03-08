import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, X, CheckCircle, AlertTriangle, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { personsApi, type BulkImportResult } from '@/api/persons'

/* ─── CSV template ─────────────────────────────────────── */
const TEMPLATE_HEADERS = [
  'first_name', 'last_name', 'phone', 'other_names',
  'email', 'gender', 'date_of_birth', 'source', 'address', 'landmark', 'state',
  'occupation', 'marital_status',
]

const TEMPLATE_EXAMPLE = [
  'John', 'Doe', '08012345678', 'Michael',
  'john@example.com', 'MALE', '1990-05-15', 'WALK_IN', '12 Church St', 'Near First Bank', 'Lagos',
  'Engineer', 'SINGLE',
]

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS.join(','), TEMPLATE_EXAMPLE.join(',')]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'member_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Result Panel ──────────────────────────────────────── */
function ResultPanel({ result }: { result: BulkImportResult }) {
  const hasErrors  = result.errors.length > 0
  const hasSkipped = result.skipped_details.length > 0

  return (
    <div>
      {/* Summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Created */}
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle size={20} color="var(--color-success)" />
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
              {result.created}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Created</div>
          </div>
        </div>

        {/* Skipped */}
        <div
          style={{
            background: 'var(--color-warning-bg, #fffbeb)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <SkipForward size={20} color="var(--color-warning)" />
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
              {result.skipped}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Skipped</div>
          </div>
        </div>

        {/* Errors */}
        <div
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={20} color="var(--color-danger)" />
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-danger)' }}>
              {result.errors.length}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Errors</div>
          </div>
        </div>
      </div>

      {/* Error detail table */}
      {hasErrors && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-danger)' }}>
            Rows with errors
          </h4>
          <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-alt)' }}>
                  {['Row', 'Name', 'Phone', 'Issue'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px', textAlign: 'left',
                        fontWeight: 600, color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e) => (
                  <tr key={e.row} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600 }}>{e.row}</td>
                    <td style={{ padding: '7px 12px' }}>
                      {e.data.first_name} {e.data.last_name}
                    </td>
                    <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)' }}>{e.data.phone || '—'}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--color-danger)' }}>
                      {e.errors.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skipped detail */}
      {hasSkipped && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-warning)' }}>
            Skipped (duplicate phone)
          </h4>
          <div style={{ overflowX: 'auto', maxHeight: 160, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-alt)' }}>
                  {['Row', 'Phone', 'Reason'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px', textAlign: 'left',
                        fontWeight: 600, color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.skipped_details.map((s) => (
                  <tr key={s.row} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600 }}>{s.row}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)' }}>{s.phone}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--color-warning)' }}>{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Modal ────────────────────────────────────────── */
interface Props {
  onClose: () => void
}

export default function CsvImportModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult]   = useState<BulkImportResult | null>(null)

  const mutation = useMutation({
    mutationFn: (f: File) => personsApi.bulkImport(f),
    onSuccess: (res) => {
      setResult(res.data)
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      if (res.data.created > 0) {
        toast.success(`${res.data.created} member${res.data.created !== 1 ? 's' : ''} imported`)
      } else {
        toast.error('No new members were imported')
      }
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Import failed. Please check your file and try again.')
    },
  })

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file')
      return
    }
    setFile(f)
    setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const removeFile = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal open onClose={onClose} title="Import Members from CSV" width={620}>
      {/* Instructions + template download */}
      <div
        style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>Required columns:</strong>{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
          first_name, last_name, phone
        </code>
        <br />
        <strong style={{ color: 'var(--color-text-primary)' }}>Optional:</strong>{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
          other_names, email, gender (MALE/FEMALE), date_of_birth (YYYY-MM-DD),
          source, address, landmark, state, occupation, marital_status
        </code>
        <br />
        Max <strong>500 rows</strong> per import. Duplicate phone numbers are skipped automatically.
      </div>

      <button
        type="button"
        onClick={downloadTemplate}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 14px', marginBottom: 20,
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', background: 'none',
          cursor: 'pointer', fontSize: 'var(--text-sm)',
          color: 'var(--color-text-body)',
        }}
      >
        <Download size={14} />
        Download CSV Template
      </button>

      {/* Drop zone */}
      {!result && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !file && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px 24px',
            textAlign: 'center',
            background: isDragging ? 'var(--color-primary-subtle)' : 'var(--color-surface-alt)',
            cursor: file ? 'default' : 'pointer',
            transition: 'border-color 150ms, background 150ms',
            marginBottom: 16,
          }}
        >
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div
                style={{
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 'var(--text-sm)',
                }}
              >
                <CheckCircle size={16} color="var(--color-success)" />
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{file.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile() }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', display: 'flex', padding: 4,
                }}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
              <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                Drag & drop your CSV here, or click to browse
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                .csv files only · max 5 MB · max 500 rows
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Result panel */}
      {result && <ResultPanel result={result} />}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        {result ? (
          <>
            <button
              type="button"
              onClick={removeFile}
              style={{
                height: 40, padding: '0 18px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none',
                cursor: 'pointer', fontSize: 'var(--text-sm)',
              }}
            >
              Import Another File
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40, padding: '0 24px',
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
              }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40, padding: '0 18px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none',
                cursor: 'pointer', fontSize: 'var(--text-sm)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || mutation.isPending}
              onClick={() => file && mutation.mutate(file)}
              style={{
                height: 40, padding: '0 24px',
                background: file && !mutation.isPending ? 'var(--color-primary)' : 'var(--color-border)',
                color: file && !mutation.isPending ? '#fff' : 'var(--color-text-muted)',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: file && !mutation.isPending ? 'pointer' : 'not-allowed',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {mutation.isPending ? (
                <>
                  <span
                    style={{
                      display: 'inline-block', width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Importing…
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Import Members
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Inline keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  )
}
