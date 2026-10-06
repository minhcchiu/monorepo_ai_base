'use client';

import { useState } from 'react';
import { Server, Terminal, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddVpsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVpsDialog({ open, onOpenChange }: AddVpsDialogProps) {
  const [identifier, setIdentifier] = useState('');
  const [hostIp, setHostIp] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('root');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sshCommand = 'curl -sSL https://cloudpulse.io/install-node.sh | bash -s -- --token=cp_node_auth_981273';

  const handleCopy = () => {
    navigator.clipboard.writeText(sshCommand);
    setCopied(true);
    toast.success('SSH Command copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !hostIp) {
      toast.error('Please fill in required fields (Identifier and IP address)');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`VPS node "${identifier}" connected successfully!`);
      onOpenChange(false);
      setIdentifier('');
      setHostIp('');
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Connect New VPS</DialogTitle>
              <DialogDescription>
                Connect your server via SSH to enable CloudPulse telemetry monitoring.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>
              VPS Display Identifier <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. Production Worker SG-02"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>
                Host / IPv4 <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={hostIp}
                onChange={(e) => setHostIp(e.target.value)}
                placeholder="103.56.xxx.xxx"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SSH Port</Label>
              <Input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="22"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>SSH Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root"
              className="font-mono"
            />
          </div>

          {/* Quick Command Box */}
          <div className="rounded-lg bg-slate-900 p-3.5 text-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Quick Installation One-Liner
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-[11px] text-emerald-300 break-all select-all">
              {sshCommand}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
            >
              {isSubmitting ? 'Connecting...' : '+ Add VPS to Fleet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
