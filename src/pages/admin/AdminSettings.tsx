import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck, Bell, Settings as SettingsIcon, Database, Lock, Plus, Trash2 } from "lucide-react";

interface AdminEmail { id: string; email: string; added_at: string; }

const AdminSettings = () => {
  const { user, signOut } = useAuth();
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [notif, setNotif] = useState({ alerts: true, weekly: true, growth: false });
  const [platform, setPlatform] = useState({ defaultWait: 5, maxQueue: 100, maintenance: false, allowDemo: true });
  const [newPass, setNewPass] = useState("");

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("admin_emails").select("*").order("added_at", { ascending: true });
    if (data) setAdmins(data);
  };

  const addAdmin = async () => {
    if (!newEmail.includes("@")) { toast.error("Invalid email"); return; }
    const { error } = await supabase.from("admin_emails").insert({ email: newEmail.toLowerCase().trim() });
    if (error) toast.error(error.message); else { toast.success("Admin added"); setNewEmail(""); fetchAdmins(); }
  };

  const removeAdmin = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from admins?`)) return;
    const { error } = await supabase.from("admin_emails").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Admin removed"); fetchAdmins(); }
  };

  const changePassword = async () => {
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setNewPass(""); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure the Qblink platform and manage admin access</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card icon={<ShieldCheck className="w-5 h-5 text-primary" />} title="Admin Profile">
          <Field label="Email" value={user?.email || ""} disabled />
          <Field label="Role" value="Platform Administrator" disabled />
          <Field label="Account ID" value={user?.id || ""} disabled />
        </Card>

        <Card icon={<Lock className="w-5 h-5 text-primary" />} title="Security">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">New password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 6 characters" className="input" />
          </div>
          <button onClick={changePassword} className="bg-card border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">Update Password</button>
          <button onClick={signOut} className="bg-danger-soft text-danger py-2.5 rounded-xl text-sm font-semibold hover:bg-danger-soft">Sign Out</button>
        </Card>

        <Card icon={<ShieldCheck className="w-5 h-5 text-primary" />} title="Admin Access Control" wide>
          <p className="text-xs text-muted-foreground -mt-2">These emails have full admin access. Add or remove admins to update access.</p>
          <div className="flex gap-2">
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newadmin@example.com" className="input flex-1" />
            <button onClick={addAdmin} className="gradient-bg text-primary-foreground px-4 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
          </div>
          <div className="bg-muted/30 rounded-xl divide-y divide-border">
            {admins.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">No admins configured</p>}
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.email}</p>
                  <p className="text-xs text-muted-foreground">Added {new Date(a.added_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => removeAdmin(a.id, a.email)} className="p-1.5 rounded-lg hover:bg-danger-soft text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={<Bell className="w-5 h-5 text-primary" />} title="Notifications">
          <Toggle label="System alerts" desc="Critical errors, downtime, security issues" value={notif.alerts} onChange={v => setNotif({ ...notif, alerts: v })} />
          <Toggle label="Weekly digest" desc="Email summary every Monday" value={notif.weekly} onChange={v => setNotif({ ...notif, weekly: v })} />
          <Toggle label="Growth milestones" desc="When platform hits new highs" value={notif.growth} onChange={v => setNotif({ ...notif, growth: v })} />
        </Card>

        <Card icon={<SettingsIcon className="w-5 h-5 text-primary" />} title="Platform Defaults">
          <Field label="Default service time (min)" value={String(platform.defaultWait)} onChange={v => setPlatform({ ...platform, defaultWait: Number(v) || 5 })} />
          <Field label="Max queue size" value={String(platform.maxQueue)} onChange={v => setPlatform({ ...platform, maxQueue: Number(v) || 100 })} />
          <Toggle label="Maintenance mode" desc="Lock the app for everyone except admins" value={platform.maintenance} onChange={v => setPlatform({ ...platform, maintenance: v })} />
          <Toggle label="Show demo data fallback" desc="Blend demo entries when real data is sparse" value={platform.allowDemo} onChange={v => setPlatform({ ...platform, allowDemo: v })} />
        </Card>

        <Card icon={<Database className="w-5 h-5 text-primary" />} title="Data Export">
          <p className="text-sm text-muted-foreground">Download platform-wide CSV exports from each admin section (Businesses, Customers, Tokens).</p>
          <button onClick={() => toast.info("Use Export CSV on each admin page")} className="bg-card border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">
            Open exports
          </button>
        </Card>
      </div>

      <style>{`.input{width:100%;padding:0.625rem 0.875rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-size:0.875rem}.input:focus{outline:none;box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}.input:disabled{opacity:0.6;cursor:not-allowed}`}</style>
    </AdminLayout>
  );
};

const Card = ({ icon, title, children, wide }: { icon: React.ReactNode; title: string; children: React.ReactNode; wide?: boolean }) => (
  <div className={`bg-card rounded-2xl p-6 card-shadow ${wide ? "lg:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 mb-4">{icon}<h2 className="font-bold text-foreground">{title}</h2></div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, disabled }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean }) => (
  <div>
    <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
    <input value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="input" />
  </div>
);

const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors ${value ? "gradient-bg" : "bg-muted"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
    </button>
  </div>
);

export default AdminSettings;
