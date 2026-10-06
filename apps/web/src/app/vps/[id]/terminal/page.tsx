'use client';

import { use, useState } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { execVpsTerminal } from '@/modules/vps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal as TerminalIcon, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VpsTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [commandInput, setCommandInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'SSH Connection established using SSH key / password credential...',
    'Linux kernel 6.8.0 x86_64 PTY active',
  ]);

  if (isLoading || !cluster) {
    return (
      <DashboardShell>
        <div className="space-y-6 max-w-[1440px] mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setCommandInput('');
    setLogs((prev) => [...prev, `root@${cluster.ip}:~# ${cmd}`]);

    try {
      setExecuting(true);
      const res = await execVpsTerminal(id, cmd);
      if (res?.stdout) {
        setLogs((prev) => [...prev, res.stdout]);
      } else if (res?.stderr) {
        setLogs((prev) => [...prev, `[stderr] ${res.stderr}`]);
      } else {
        setLogs((prev) => [...prev, `[Command returned exit code ${res?.exitCode ?? 0}]`]);
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `[Error] ${err?.response?.data?.message || 'Execution error'}`]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ClusterNavHeader cluster={cluster} />

        <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
          {/* Terminal Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs text-slate-200">
                root@{cluster.ip}:{cluster.port || 22} (Live SSH Web Terminal)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogs([]);
                  toast.success('Terminal output cleared');
                }}
                className="h-7 text-xs text-slate-400 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto space-y-1 bg-slate-950/90 leading-relaxed select-text">
            {logs.map((line, idx) => (
              <div key={idx} className={line.startsWith('root@') ? 'text-slate-100 font-semibold' : 'text-emerald-400 whitespace-pre-wrap'}>
                {line}
              </div>
            ))}
          </div>

          {/* Command Input Box */}
          <form onSubmit={handleCommandSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-emerald-400 font-bold select-none">root@vps:~#</span>
            <input
              type="text"
              value={commandInput}
              disabled={executing}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type SSH command (e.g. htop, pm2 status, df -h)..."
              className="flex-1 bg-transparent border-none text-xs text-slate-100 font-mono focus:outline-none placeholder:text-slate-600"
            />
            {executing && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />}
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
