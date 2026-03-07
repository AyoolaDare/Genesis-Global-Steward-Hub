import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { personsApi } from '@/api/persons'
import Modal from '@/components/ui/Modal'

interface Props {
  primaryId:   string
  primaryName: string
  onClose:     () => void
}

export default function MergeDialog({ primaryId, primaryName, onClose }: Props) {
  const queryClient = useQueryClient()
  const [duplicateId, setDuplicateId] = useState('')
  const [phone, setPhone] = useState('')
  const [found, setFound] = useState<{ id: string; full_name: string } | null>(null)

  const lookupMutation = useMutation({
    mutationFn: () => personsApi.phoneLookup([phone]),
    onSuccess: (res) => {
      const result = res.data.results[0]?.person
      if (result) {
        if (result.id === primaryId) {
          toast.error('Cannot merge a person with themselves')
          return
        }
        setFound({ id: result.id, full_name: `${result.first_name} ${result.last_name}` })
        setDuplicateId(result.id)
      } else {
        toast.error('No person found with that phone number')
      }
    },
    onError: () => toast.error('Lookup failed'),
  })

  const mergeMutation = useMutation({
    mutationFn: () => personsApi.merge(primaryId, duplicateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      toast.success('Profiles merged successfully')
      onClose()
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Merge failed'),
  })

  return (
    <Modal open onClose={onClose} title="Merge Profiles" width={480}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 0 }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>{primaryName}</strong> will be kept as
        the primary profile. The duplicate will be soft-deleted after all records are transferred.
      </p>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
          Look up duplicate by phone
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="tel"
            className="input"
            placeholder="080XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => lookupMutation.mutate()}
            disabled={!phone || lookupMutation.isPending}
            style={{
              height: 40, padding: '0 16px',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
              whiteSpace: 'nowrap',
            }}
          >
            {lookupMutation.isPending ? 'Searching…' : 'Look Up'}
          </button>
        </div>
      </div>

      {found && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>
            Found: <strong>{found.full_name}</strong>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            This profile will be soft-deleted and its records moved to {primaryName}.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            height: 40, padding: '0 20px',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)',
          }}
        >
          Cancel
        </button>
        <button
          disabled={!found || mergeMutation.isPending}
          onClick={() => mergeMutation.mutate()}
          style={{
            height: 40, padding: '0 24px',
            background: found ? 'var(--color-danger)' : 'var(--color-border)',
            color: found ? '#fff' : 'var(--color-text-muted)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: found ? 'pointer' : 'not-allowed',
            fontWeight: 600, fontSize: 'var(--text-sm)',
          }}
        >
          {mergeMutation.isPending ? 'Merging…' : 'Merge & Delete Duplicate'}
        </button>
      </div>
    </Modal>
  )
}
