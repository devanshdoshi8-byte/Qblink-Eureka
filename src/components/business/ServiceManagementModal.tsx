import { useState } from "react";
import { Plus, Trash2, Check, X, Tag, Sparkles, Layers, Clock, AlertCircle } from "lucide-react";
import { ServiceDefinition, DEFAULT_SERVICE_PRESETS } from "@/lib/serviceDefinitions";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";

interface Props {
  initialServices?: ServiceDefinition[];
  category?: string;
  onSave: (services: ServiceDefinition[]) => Promise<void> | void;
  onClose: () => void;
}

export const ServiceManagementModal = ({
  initialServices = [],
  category = "clinic",
  onSave,
  onClose,
}: Props) => {
  const [services, setServices] = useState<ServiceDefinition[]>(initialServices);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDuration, setNewDuration] = useState<number>(10);
  const [newPriority, setNewPriority] = useState<"standard" | "express" | "urgent">("standard");

  const handleAddService = () => {
    if (!newName.trim()) {
      toast.error("Service name is required");
      return;
    }

    const created: ServiceDefinition = {
      id: `srv_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      estimatedDurationMinutes: Math.max(1, newDuration),
      priority: newPriority,
      isActive: true,
    };

    setServices((prev) => [...prev, created]);
    setNewName("");
    setNewDesc("");
    setNewDuration(10);
    hapticSuccess();
    toast.success(`Service "${created.name}" added`);
  };

  const handleRemove = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLoadPresets = () => {
    const key = category?.toLowerCase().includes("salon")
      ? "salon"
      : category?.toLowerCase().includes("retail")
      ? "retail"
      : "clinic";
    const presets = DEFAULT_SERVICE_PRESETS[key] || DEFAULT_SERVICE_PRESETS.clinic;
    setServices(presets);
    hapticSuccess();
    toast.success(`Loaded standard ${key} service presets`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.resolve(onSave(services));
      hapticSuccess();
      toast.success("Service definitions saved successfully!");
      onClose();
    } catch {
      toast.error("Failed to save service definitions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto card-shadow flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Multi-Service & Counter Routing</h2>
              <p className="text-xs text-muted-foreground">
                Configure distinct service types, durations, and priorities for customer selection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick Presets Banner */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-foreground font-medium">Want standard presets for your industry?</span>
            </div>
            <button
              onClick={handleLoadPresets}
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              Load {category || "Standard"} Presets
            </button>
          </div>

          {/* Existing Configured Services List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Configured Services ({services.length})
            </h3>
            {services.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
                No specific services configured. The queue operates as a standard single line.
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{srv.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            srv.priority === "express"
                              ? "bg-amber-500/10 text-amber-500"
                              : srv.priority === "urgent"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {srv.priority.toUpperCase()}
                        </span>
                      </div>
                      {srv.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{srv.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {srv.estimatedDurationMinutes} min
                      </div>
                      <button
                        onClick={() => handleRemove(srv.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Service Form */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Add New Service Type
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor Consultation, Express Haircut"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Est. Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Brief Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Routine checkup and vitals assessment"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Priority Tier:</span>
                <div className="flex bg-muted/60 p-1 rounded-xl gap-1">
                  {(["standard", "express", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        newPriority === p ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddService}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-md"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};
