import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BusinessLayout from "@/components/business/BusinessLayout";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Bell, Lock, Trash2, Save, BellRing, Send, Eye, Globe, LogIn, Clock, Users as UsersIcon } from "lucide-react";
import InfoHint from "@/components/InfoHint";
import OperatingHoursCard from "@/components/business/OperatingHoursCard";

const CATEGORIES = ["Restaurant", "Clinic", "Hospital", "Salon", "Bank", "Government Service", "Hotel", "Service Center", "Other"];

const ALERT_META: Record<string, { label: string; message: string }> = {
  doctor_delay: { label: "Doctor Delay Alerts", message: "Doctor is running ~15 min behind. Feel free to arrive a bit later." },
  table_ready: { label: "Table Ready Alerts", message: "Your table is ready! Please head to the host stand." },
  service_time: { label: "Estimated Service Time", message: "Your stylist will be ready in about 10 minutes." },
  counter_ready: { label: "Counter Ready Alerts", message: "Please proceed to Counter 3 — it's your turn." },
  prescription_ready: { label: "Prescription Ready Alerts", message: "Your prescription is ready for pickup." },
  test_ready: { label: "Test Ready Alerts", message: "Your test room is ready — please head to Room 2." },
  fasting_reminder: { label: "Fasting Reminder", message: "Reminder: fasting required 8 hours before your test tomorrow." },
  billing_ready: { label: "Billing Ready Alerts", message: "Billing Counter 2 is ready for you." },
  technician_ready: { label: "Technician Ready Alerts", message: "Your technician is ready — please head to Bay 4." },
  job_status: { label: "Job Status Alerts", message: "Your service is 50% complete. Estimated ready in 30 min." },
};

const Settings = () => (
  <BusinessLayout>{(business) => <SettingsContent businessId={business.id} />}</BusinessLayout>
);

const SettingsContent = ({ businessId }: { businessId: string }) => {
  const { user, signOut } = useAuth();
  const [biz, setBiz] = useState({ name: "", category: "Restaurant", description: "", address: "" });
  const [notif, setNotif] = useState({ email: true, push: true, sms: false });
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string>("");
  const [testing, setTesting] = useState<string | null>(null);
  const [visibility, setVisibility] = useState({
    discovery_enabled: true,
    remote_joining_enabled: true,
    show_live_queue_info: true,
  });
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => { fetchBiz(); }, [businessId]);

  const fetchBiz = async () => {
    const { data } = await supabase.from("businesses").select("*").eq("id", businessId).single();
    if (data) {
      // Real record only — never seed the owner's form with sample content.
      setBiz({
        name: data.name || "",
        category: data.category || "",
        description: data.description || "",
        address: data.address || "",
      });
      const ds: any = (data as any).default_settings ?? {};
      setAlerts(Array.isArray(ds.alerts) ? ds.alerts : []);
      setIndustry(data.category || "");
      const d: any = data;
      setVisibility({
        discovery_enabled: d.discovery_enabled ?? true,
        remote_joining_enabled: d.remote_joining_enabled ?? true,
        show_live_queue_info: d.show_live_queue_info ?? true,
      });
    }
  };

  const updateVisibility = async (patch: Partial<typeof visibility>) => {
    const next = { ...visibility, ...patch };
    setVisibility(next);
    setSavingVisibility(true);
    const { error } = await supabase.from("businesses").update(patch as any).eq("id", businessId);
    setSavingVisibility(false);
    if (error) toast.error("Failed to update visibility");
  };

  const sendTestAlert = async (key: string) => {
    const meta = ALERT_META[key];
    if (!meta) return;
    setTesting(key);
    try {
      if ("Notification" in window) {
        let perm = Notification.permission;
        if (perm === "default") perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification(`${meta.label} — Test`, { body: meta.message, icon: "/icon-192.png" });
        }
      }
      if ("vibrate" in navigator) navigator.vibrate?.([80, 40, 80]);
      toast.success(`Test sent: ${meta.label}`, { description: meta.message });
    } catch {
      toast.error("Could not send test alert");
    } finally {
      setTimeout(() => setTesting(null), 600);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("businesses").update(biz).eq("id", businessId);
    if (error) toast.error("Failed to save"); else toast.success("Profile updated");
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setNewPass(""); }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure? This will delete your business and all queue data permanently.")) return;
    await supabase.from("businesses").delete().eq("id", businessId);
    await signOut();
    toast.success("Account deleted");
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your business profile and preferences</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Business Profile */}
        <Card icon={<Building2 className="w-5 h-5 text-primary" />} title="Business Profile">
          <Input label="Business Name" value={biz.name} onChange={v => setBiz({ ...biz, name: v })} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <input value={user?.email || ""} disabled className="input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
            <select value={biz.category} onChange={e => setBiz({ ...biz, category: e.target.value })} className="input">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Address" value={biz.address} onChange={v => setBiz({ ...biz, address: v })} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <textarea value={biz.description} onChange={e => setBiz({ ...biz, description: e.target.value })} rows={3} className="input resize-none" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </Card>

        {/* Opening Hours */}
        <OperatingHoursCard businessId={businessId} />

        {/* Notifications */}
        <Card icon={<Bell className="w-5 h-5 text-primary" />} title="Notifications">
          <Toggle label="Email Alerts" desc="Get notified about queue activity by email" value={notif.email} onChange={v => setNotif({ ...notif, email: v })} />
          <Toggle label="Push Notifications" desc="Real-time alerts in your browser" value={notif.push} onChange={v => setNotif({ ...notif, push: v })} />
          <Toggle label="SMS Notifications" desc="Text alerts for critical events" value={notif.sms} onChange={v => setNotif({ ...notif, sms: v })} />
        </Card>

        {/* Industry Alerts */}
        <Card icon={<BellRing className="w-5 h-5 text-primary" />} title="Industry Alerts">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No industry-specific alerts enabled{industry ? ` for ${industry}` : ""}.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground -mt-1">
                Auto-enabled by your industry. Send a test to verify they work on this device.
              </p>
              {alerts.map((key) => {
                const meta = ALERT_META[key] ?? { label: key, message: "Test alert" };
                return (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{meta.label} <span className="text-xs font-normal text-primary">ON</span></p>
                      <p className="text-xs text-muted-foreground truncate">{meta.message}</p>
                    </div>
                    <button
                      onClick={() => sendTestAlert(key)}
                      disabled={testing === key}
                      aria-label={`Send test alert for ${meta.label}`}
                      className="inline-flex items-center gap-1.5 shrink-0 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {testing === key ? "Sending…" : "Send test"}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </Card>

        {/* Customer Visibility & Access */}
        <Card icon={<Eye className="w-5 h-5 text-primary" />} title="Customer Visibility & Access">
          <p className="text-xs text-muted-foreground -mt-1">
            Control how customers experience your business on Qblink. Each setting is independent.
            {savingVisibility && <span className="ml-2 text-primary">Saving…</span>}
          </p>

          <VisibilityRow
            icon={<Globe className="w-4 h-4 text-primary" />}
            label="Customer Discovery"
            value={visibility.discovery_enabled}
            onChange={(v) => updateVisibility({ discovery_enabled: v })}
            hintTitle="What is Customer Discovery?"
            hintDescription="When enabled, your business appears on the Qblink customer platform so nearby customers can discover you, view your business profile, and check your live queue status."
            hintExample="Off: your business is hidden from discovery. Your QR code and dashboard keep working."
            benefits={["Increase visibility", "Reach nearby customers", "Help customers plan visits", "Increase walk-ins"]}
          />

          <VisibilityRow
            icon={<LogIn className="w-4 h-4 text-primary" />}
            label="Remote Queue Joining"
            value={visibility.remote_joining_enabled}
            onChange={(v) => updateVisibility({ remote_joining_enabled: v })}
            hintTitle="What is Remote Queue Joining?"
            hintDescription="When enabled, customers can join your queue remotely through Qblink before arriving."
            hintExample="Off: customers must arrive in person to join. The join button is replaced with a Visit Business action."
            benefits={["Reduce waiting-room crowding", "Fewer reception interruptions", "Better customer experience", "Customers arrive closer to their turn"]}
          />

          <VisibilityRow
            icon={<Clock className="w-4 h-4 text-primary" />}
            label="Show Live Queue Information"
            value={visibility.show_live_queue_info}
            onChange={(v) => updateVisibility({ show_live_queue_info: v })}
            hintTitle="What is Live Queue Information?"
            hintDescription="Allow customers to view your current waiting time and queue status before visiting."
            hintExample="Off: live wait time and queue length are hidden. Customers see 'Queue status available upon arrival'."
            benefits={["Builds trust", "Reduces uncertainty", "Helps customers choose the best time to visit"]}
          />

          <VisibilityPreview visibility={visibility} businessName={biz.name || "Your business"} />
        </Card>

        {/* Security */}
        <Card icon={<Lock className="w-5 h-5 text-primary" />} title="Security">
          <Input label="New Password" type="password" value={newPass} onChange={setNewPass} placeholder="At least 6 characters" />
          <button onClick={changePassword} className="bg-card border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
            Update Password
          </button>
        </Card>

        {/* Danger Zone */}
        <Card icon={<Trash2 className="w-5 h-5 text-danger" />} title="Danger Zone" danger>
          <p className="text-sm text-muted-foreground">Permanently delete your business account, all queues and customer data. This cannot be undone.</p>
          <button onClick={deleteAccount} className="bg-danger-soft text-danger hover:bg-danger-soft py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Delete Account
          </button>
        </Card>
      </div>

      <style>{`.input{width:100%;padding:0.625rem 0.875rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-size:0.875rem}.input:focus{outline:none;box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}`}</style>
    </div>
  );
};

const Card = ({ icon, title, children, danger }: { icon: React.ReactNode; title: string; children: React.ReactNode; danger?: boolean }) => (
  <div className={`bg-card rounded-2xl p-6 card-shadow ${danger ? "border border-danger/30" : ""}`}>
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="font-bold text-foreground">{title}</h2>
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div>
    <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input" />
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

const VisibilityRow = ({
  icon,
  label,
  value,
  onChange,
  hintTitle,
  hintDescription,
  hintExample,
  benefits,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hintTitle: string;
  hintDescription: string;
  hintExample?: string;
  benefits: string[];
}) => (
  <div className="rounded-xl border border-border bg-background/50 p-3">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <p className="text-sm font-semibold text-foreground truncate">{label}</p>
        <InfoHint title={hintTitle} description={hintDescription} example={hintExample} ariaLabel={`What is ${label}?`} />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {value ? "ON" : "OFF"}
        </span>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? "gradient-bg" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </div>
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground pl-6">
      {benefits.map((b) => (
        <li key={b} className="truncate">• {b}</li>
      ))}
    </ul>
  </div>
);

const VisibilityPreview = ({
  visibility,
  businessName,
}: {
  visibility: { discovery_enabled: boolean; remote_joining_enabled: boolean; show_live_queue_info: boolean };
  businessName: string;
}) => {
  const { discovery_enabled, remote_joining_enabled, show_live_queue_info } = visibility;

  return (
    <div className="mt-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Customer preview</p>
        <span className="text-[10px] text-muted-foreground">Live</span>
      </div>

      {!discovery_enabled ? (
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center transition-all duration-300">
          <Globe className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">This business will not appear on the Qblink customer platform.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border p-4 transition-all duration-300">
          <p className="text-sm font-bold text-foreground mb-3">{businessName}</p>

          {show_live_queue_info ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground tracking-wider">
                  <Clock className="w-3 h-3" /> Waiting time
                </div>
                <p className="text-lg font-bold text-foreground mt-0.5">~12 min</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground tracking-wider">
                  <UsersIcon className="w-3 h-3" /> People waiting
                </div>
                <p className="text-lg font-bold text-foreground mt-0.5">7</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/40 p-3 mb-3 text-center text-xs text-muted-foreground">
              Queue status available upon arrival.
            </div>
          )}

          {remote_joining_enabled ? (
            <button className="w-full gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">
              Join Queue
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center py-2 rounded-lg bg-muted/40">
                Remote joining is currently unavailable.
              </div>
              <button className="w-full bg-card border border-primary/40 text-primary py-2.5 rounded-xl text-sm font-semibold">
                Visit Business
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
