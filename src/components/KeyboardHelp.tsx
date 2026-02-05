import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  { key: '/', description: 'Search playlists' },
  { key: '1-0', description: 'Toggle playlists 1-10' },
  { key: 'Enter', description: 'Next song' },
  { key: 'Space', description: 'Pause / Resume' },
  { key: 'N', description: 'New playlist' },
  { key: 'Esc', description: 'Clear search' },
  { key: '?', description: 'Show this help' },
]

export function KeyboardHelp({ open, onOpenChange }: KeyboardHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono min-w-[4rem] text-center">
                {key}
              </kbd>
              <span className="text-gray-300">{description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
