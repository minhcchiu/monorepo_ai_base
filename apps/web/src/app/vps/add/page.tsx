'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Server,
  ChevronRight,
  Lock,
  Terminal,
  Copy,
  Check,
  Key,
  ShieldCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createVpsNode, testVpsConnection } from '@/modules/vps/api';

export default function AddVpsPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('api-core-cluster-02');
  const [hostIp, setHostIp] = useState('103.178.234.88');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [sshKey, setSshKey] = useState('');
  const [authMethod, setAuthMethod] = useState<'key' | 'pass'>('key');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const installCommand = 'curl -sSL https://cloudpulse.io/install-node.sh | bash -s -- --token=cp_node_auth_981273';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    toast.success('Script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!hostIp) {
      toast.error('Please enter IP Address');
      return;
    }
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await testVpsConnection({
        ip: hostIp,
        port: port ? Number(port) : 22,
        username,
        password: authMethod === 'pass' ? password : undefined,
        sshKey: authMethod === 'key' ? sshKey : undefined,
      });
      setTestResult(res);
      if (res?.success) {
        toast.success('SSH Connection Verified Successfully!');
      } else {
        toast.warning(res?.message || 'SSH Connection Failed (Timeout / Unreachable)');
      }
    } catch (err: any) {
      toast.error('SSH Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !hostIp) {
      toast.error('Please enter required VPS details');
      return;
    }

    try {
      setIsConnecting(true);
      const res = await createVpsNode({
        name: identifier,
        ip: hostIp,
        port: port ? Number(port) : 22,
        username,
        password: authMethod === 'pass' ? password : undefined,
        sshKey: authMethod === 'key' ? sshKey : undefined,
        environment: 'prod',
      });
      if (res?.connectionSuccess) {
        toast.success(`VPS node "${identifier}" verified & connected successfully!`);
      } else {
        toast.warning(`VPS node "${identifier}" added to DB as Offline (Connection failed/unreachable)`);
      }
      router.push('/vps');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to connect VPS node');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/vps" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <Server className="w-3.5 h-3.5" />
              <span>VPS Instances</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-semibold">Connect New VPS</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Connect New VPS</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Connect your server via SSH. CloudPulse automatically inspects OS telemetry, Node.js runtimes, PM2 daemons, and hardware baselines in real time.
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold">Step 1</div>
                <div className="text-sm font-semibold text-slate-900">Server Connection</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-sm shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Step 2 • Live</div>
                <div className="text-sm font-semibold text-slate-900">Verification & Diagnostics</div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Step 3</div>
                <div className="text-sm font-semibold text-slate-900">Environment & Tags</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form & Helper Section */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    01
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">Target Machine Credentials</h2>
                </div>
                <span className="text-xs text-emerald-700 font-mono flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                  <Lock className="w-3.5 h-3.5" />
                  e2ee encrypted vault
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>VPS Display Identifier</Label>
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. prod-sg-node-01"
                    className="h-10 text-xs"
                  />
                  <span className="text-[11px] text-slate-500">
                    Internal alias used across your telemetry panels and alert monitors
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>IP Address / FQDN Host</Label>
                    <Input
                      value={hostIp}
                      onChange={(e) => setHostIp(e.target.value)}
                      placeholder="103.178.234.88"
                      className="h-10 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SSH Port</Label>
                    <Input
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="22"
                      className="h-10 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>SSH Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="root"
                    className="h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Authentication Method</Label>
                  <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-100">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('key')}
                      className={`h-8 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        authMethod === 'key' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>SSH Private Key</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('pass')}
                      className={`h-8 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        authMethod === 'pass' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Root Password</span>
                    </button>
                  </div>

                  {authMethod === 'key' ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={5}
                        value={sshKey}
                        onChange={(e) => setSshKey(e.target.value)}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn...&#10;-----END OPENSSH PRIVATE KEY-----"
                        className="w-full rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-xs focus:outline-none leading-relaxed resize-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <Label>Root Password</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter SSH password"
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-semibold">{testResult.message}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="h-10 px-4 text-xs gap-1.5"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Connection</span>
              </Button>
              <Button
                type="submit"
                disabled={isConnecting}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5"
              >
                {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>+ Add VPS to Fleet</span>
              </Button>
            </div>
          </div>

          {/* Right Script Helper Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-sm">Alternative One-Liner Agent</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="hover:text-white flex items-center gap-1 text-xs text-slate-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy Script'}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Run this command on your VPS shell if you prefer passwordless key injection to register the node directly into your fleet.
              </p>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
                {installCommand}
              </div>

              <div className="pt-2 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Supports Ubuntu 20.04+, Debian 11+, CentOS 8+, AlmaLinux</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Auto-detects PM2, Docker, Nginx, PostgreSQL, Redis</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
