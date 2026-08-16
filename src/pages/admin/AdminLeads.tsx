import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Mail, Phone, Building2, Inbox, Filter, Eye, X, Calendar, Hash, Save, StickyNote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonListRow } from "@/components/skeletons/DashboardSkeletons";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business: string | null;
  industry: string | null;
  message: string | null;
  notes: string | null;
  submission_type: string;
  created_at: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "demo" | "early_access">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setNoteDraft(selectedLead?.notes || "");
  }, [selectedLead]);

  const saveNotes = async () => {
    if (!selectedLead) return;
    setSavingNote(true);
    const { error } = await supabase
      .from("contact_submissions")
      .update({ notes: noteDraft.trim() || null })
      .eq("id", selectedLead.id);
    setSavingNote(false);
    if (error) {
      toast({ title: "Failed to save notes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes saved" });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: noteDraft.trim() || null } : l));
      setSelectedLead(prev => prev ? { ...prev, notes: noteDraft.trim() || null } : prev);
    }
  };

  const filtered = filter === "all" ? leads : leads.filter(l => l.submission_type === filter);
  const demoCount = leads.filter(l => l.submission_type === "demo").length;
  const earlyCount = leads.filter(l => l.submission_type === "early_access").length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leads & Demo Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">All contact-form submissions from the landing page.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(["all", "demo", "early_access"] as const).map(k => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  filter === k ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {k === "all" ? `All (${leads.length})` : k === "demo" ? `Demo (${demoCount})` : `Early Access (${earlyCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonListRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6">
            <EmptyState
              icon={Inbox}
              title="No leads in this view"
              description="Demo and contact submissions from across the site land here in real time. Nothing matches your current filter yet."
              cta={{ label: "View landing page", to: "/" }}
              tip="Share your live link or QR code on social — leads from the demo form drop straight into this inbox."
            />
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(lead => (
              <div key={lead.id} className="bg-card border border-border rounded-2xl p-5 card-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{lead.name}</h3>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        lead.submission_type === "demo"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent-foreground"
                      }`}>
                        {lead.submission_type === "demo" ? "Demo" : "Early Access"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString()} · Ref #{lead.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Mail className="w-4 h-4 text-muted-foreground" /> {lead.email}
                  </a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {lead.phone}
                    </a>
                  )}
                  {lead.business && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-4 h-4 text-muted-foreground" /> {lead.business}
                    </div>
                  )}
                  {lead.industry && (
                    <div className="text-muted-foreground">Industry: <span className="text-foreground capitalize">{lead.industry}</span></div>
                  )}
                </div>

                {lead.message && (
                  <div className="mt-3 pt-3 border-t border-border text-sm text-foreground whitespace-pre-wrap">
                    {lead.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-16 md:pt-24"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLead(null);
          }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg card-shadow max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Lead Details</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type & Source */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                  selectedLead.submission_type === "demo"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent-foreground"
                }`}>
                  {selectedLead.submission_type === "demo" ? "Demo Request" : "Early Access Signup"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Source: Landing Page Contact Form</span>
              </div>

              {/* Name & Ref */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Full Name</label>
                <p className="text-foreground font-semibold">{selectedLead.name}</p>
              </div>

              {/* Contact */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</label>
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                    <Mail className="w-4 h-4 text-muted-foreground" /> {selectedLead.email}
                  </a>
                </div>
                {selectedLead.phone && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Phone</label>
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {selectedLead.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Business Info */}
              {(selectedLead.business || selectedLead.industry) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedLead.business && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Business Name</label>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> {selectedLead.business}
                      </div>
                    </div>
                  )}
                  {selectedLead.industry && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Industry</label>
                      <p className="text-sm text-foreground capitalize">{selectedLead.industry}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {selectedLead.message && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Message</label>
                  <div className="bg-muted/50 border border-border rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2 pt-3 border-t border-border">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Admin Notes
                </label>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Record context, next steps, follow-up status..."
                  className="w-full min-h-[80px] bg-muted/50 border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={saveNotes}
                    disabled={savingNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> {savingNote ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Submission Time
                  </label>
                  <p className="text-sm text-foreground">{new Date(selectedLead.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Reference ID
                  </label>
                  <p className="text-sm text-foreground font-mono">{selectedLead.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeads;