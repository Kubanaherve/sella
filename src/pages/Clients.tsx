import { useState, useEffect } from "react";
import { UserPlus, Phone, User, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ListPageSkeleton } from "@/components/ListPageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteClient,
  findOrCreateClient,
  listClients,
  updateClientContact,
} from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { WriteGate } from "@/components/WriteGate";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

const ClientsPage = () => {
  const { canWrite } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fetchClients = async () => {
    try {
      const data = await listClients();
      setClients(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          created_at: c.created_at,
        }))
      );
    } catch (error) {
      console.error("Fetch clients error:", error);
      toast.error("Habaye ikosa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSave = async () => {
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure to edit clients");
      return;
    }
    if (!name.trim()) {
      toast.error("Andika izina ry'umukiriya");
      return;
    }

    setIsSaving(true);
    try {
      // Check if client already exists
      const existingClient = clients.find(
        c => c.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existingClient) {
        // Update existing client's phone if provided
        if (phone.trim()) {
          await updateClientContact(existingClient.id, { phone: phone.trim() });
        }
        toast.success("Umukiriya yahinduwe neza ✨");
      } else {
        await findOrCreateClient(name.trim(), phone.trim() || null);
        toast.success("Umukiriya yongeweho neza ✨");
      }

      setName("");
      setPhone("");
      fetchClients();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Habaye ikosa");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure to delete");
      return;
    }
    try {
      await deleteClient(clientId);
      toast.success("Umukiriya yasibwe");
      fetchClients();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Habaye ikosa"
      );
    }
  };

  return (
    <div className="sella-page">
      <PageHeader
        title="Abakiriya"
        subtitle="Andika no kubika amakuru y'abakiriya"
        backTo="/more"
      />

      <main className="sella-page-body space-y-6">
        {!canWrite && <WriteGate actionLabel="Kongeraho cyangwa guhindura abakiriya" />}
        {/* Add Client Form */}
        <div className="sella-list-card p-4 sm:p-5 animate-fade-in">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            Ongeraho Umukiriya
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                <User size={14} className="inline mr-1" />
                Izina ry'umukiriya *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Andika izina..."
                className="bg-white/70 dark:bg-white/5 border-border dark:border-white/10 input-glow text-base h-11"
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
                <Phone size={14} className="inline mr-1" />
                Numero ya Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07X XXX XXXX"
                className="bg-white/70 dark:bg-white/5 border-border dark:border-white/10 input-glow text-base h-11"
                inputMode="tel"
                autoComplete="off"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="w-full h-11 text-base bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  Emeza
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Abakiriya bose ({clients.length})
          </h2>

          {isLoading ? (
            <ListPageSkeleton rows={4} />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={User}
              title="Nta mukiriya uhari"
              description="Ongeraho umukiriya wa mbere hejuru kugira ngo utangire."
            />
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="sella-list-card p-3.5 flex items-center justify-between animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <User size={18} className="text-primary dark:text-[#5AC8FA]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{client.name}</p>
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="text-xs text-primary dark:text-[#5AC8FA] flex items-center gap-1"
                        >
                          <Phone size={10} />
                          {client.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Siba"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientsPage;
