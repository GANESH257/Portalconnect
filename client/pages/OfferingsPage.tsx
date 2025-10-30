import { useEffect, useMemo, useState } from "react";
import { SERVICE_PACKAGES, Service, ServiceLineItem } from "./packages";

type Proposal = {
  id: string;
  name: string;
  services: Service[];
  totalSetup: number;
  totalMonthly: number;
  status: "draft" | "sent" | "accepted" | "rejected";
};

const STORAGE_KEY = 'cp_proposals_v1';

export default function OfferingsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalName, setProposalName] = useState<string>("Custom Proposal");
  const [itemsByPackage, setItemsByPackage] = useState<Record<string, ServiceLineItem[]>>({});

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setProposals(JSON.parse(raw)); } catch {}
    try { const rawItems = localStorage.getItem('cp_package_items_v1'); if (rawItems) setItemsByPackage(JSON.parse(rawItems)); } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals)); } catch {}
  }, [proposals]);

  useEffect(() => {
    try { localStorage.setItem('cp_package_items_v1', JSON.stringify(itemsByPackage)); } catch {}
  }, [itemsByPackage]);

  const selectedServices = useMemo(() => SERVICE_PACKAGES.filter(s => selectedIds.includes(s.id)), [selectedIds]);
  const totals = useMemo(() => ({
    setup: selectedServices.reduce((sum, s) => sum + s.setup, 0),
    monthly: selectedServices.reduce((sum, s) => sum + s.monthly, 0)
  }), [selectedServices]);

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addItem = (pkgId: string) => {
    setItemsByPackage(prev => ({
      ...prev,
      [pkgId]: [...(prev[pkgId] || []), { description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateItem = (pkgId: string, idx: number, patch: Partial<ServiceLineItem>) => {
    setItemsByPackage(prev => {
      const items = [...(prev[pkgId] || [])];
      items[idx] = { ...items[idx], ...patch } as ServiceLineItem;
      return { ...prev, [pkgId]: items };
    });
  };

  const removeItem = (pkgId: string, idx: number) => {
    setItemsByPackage(prev => {
      const items = [...(prev[pkgId] || [])];
      items.splice(idx, 1);
      return { ...prev, [pkgId]: items };
    });
  };

  const generateProposal = () => {
    if (selectedServices.length === 0) return;
    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      name: proposalName || 'Custom Proposal',
      services: selectedServices.map(s => ({ ...s, items: itemsByPackage[s.id] || [] })),
      totalSetup: totals.setup,
      totalMonthly: totals.monthly,
      status: 'draft'
    };
    setProposals(prev => [proposal, ...prev]);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Select Services</h1>
        <div className="text-sm text-muted-foreground">Build a package from offerings</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_PACKAGES.map(s => (
          <div key={s.id} className="border rounded-md p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              <div className="text-sm">
                <div className="font-medium">{s.name}</div>
                {s.description && <div className="text-xs text-muted-foreground mb-1">{s.description}</div>}
                <div className="text-xs text-muted-foreground">${s.setup.toLocaleString()}.00 setup + ${s.monthly.toLocaleString()}.00/mo</div>
              </div>
            </label>

            <div className="mt-3">
              <div className="text-sm font-medium mb-2">Service Line Items</div>
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-[12px] text-muted-foreground px-1 pb-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price ($)</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="space-y-2">
                {(itemsByPackage[s.id] || []).map((it, i) => (
                  <div key={i}>
                    {/* Stacked on small screens */}
                    <div className="md:hidden space-y-2">
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="Service description"
                        aria-label="Item description"
                        value={it.description}
                        onChange={(e) => updateItem(s.id, i, { description: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="w-24 border rounded-md px-3 py-2 text-sm"
                          aria-label="Quantity"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItem(s.id, i, { quantity: Math.max(1, parseInt(e.target.value || '1')) })}
                        />
                        <input
                          type="number"
                          className="w-36 border rounded-md px-3 py-2 text-sm"
                          aria-label="Unit price"
                          min={0}
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(s.id, i, { unitPrice: Math.max(0, parseFloat(e.target.value || '0')) })}
                        />
                    <div className="ml-auto text-sm leading-9 whitespace-nowrap pr-2">${(it.quantity * it.unitPrice).toFixed(2)}</div>
                    <button className="text-xs text-red-600 ml-2 whitespace-nowrap" onClick={() => removeItem(s.id, i)}>Delete</button>
                      </div>
                    </div>

                    {/* Grid on medium+ screens */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                      <input
                        className="col-span-6 border rounded-md px-3 py-2 text-sm"
                        placeholder="Service description"
                        aria-label="Item description"
                        value={it.description}
                        onChange={(e) => updateItem(s.id, i, { description: e.target.value })}
                      />
                      <input
                        type="number"
                        className="col-span-2 border rounded-md px-3 py-2 text-sm min-w-[6rem]"
                        aria-label="Quantity"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => updateItem(s.id, i, { quantity: Math.max(1, parseInt(e.target.value || '1')) })}
                      />
                      <input
                        type="number"
                        className="col-span-2 border rounded-md px-3 py-2 text-sm min-w-[8rem]"
                        aria-label="Unit price"
                        min={0}
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(s.id, i, { unitPrice: Math.max(0, parseFloat(e.target.value || '0')) })}
                      />
                      <div className="col-span-1 text-sm text-right whitespace-nowrap pr-2">${(it.quantity * it.unitPrice).toFixed(2)}</div>
                      <button className="col-span-1 text-xs text-red-600 text-right whitespace-nowrap" onClick={() => removeItem(s.id, i)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <button className="px-3 py-1 border rounded-md text-xs" onClick={() => addItem(s.id)}>+ Add Item</button>
                <div>
                  Total from Line Items: <span className="font-semibold">${((itemsByPackage[s.id] || []).reduce((sum, x) => sum + x.quantity * x.unitPrice, 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-md">
        <div className="text-sm">
          <div>Total Setup: <span className="font-semibold">${totals.setup.toLocaleString()}.00</span></div>
          <div>Total Monthly: <span className="font-semibold">${totals.monthly.toLocaleString()}.00/mo</span></div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Proposal name"
            value={proposalName}
            onChange={(e) => setProposalName(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
            disabled={selectedIds.length === 0}
            onClick={generateProposal}
          >
            Generate Proposal
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Active Proposals</div>
        {proposals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No proposals yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposals.map(p => (
              <div key={p.id} className="border rounded-md p-4">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground mb-2">Status: {p.status}</div>
                <div className="text-xs mb-2">
                  {p.services.map(s => (
                    <div key={s.id} className="mb-2">
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        <span>${s.setup.toLocaleString()} + ${s.monthly.toLocaleString()}/mo</span>
                      </div>
                      {(s.items || []).length > 0 && (
                        <div className="mt-1 ml-2">
                          <div className="text-[11px] text-muted-foreground mb-1">Line Items</div>
                          {(s.items || []).map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-[12px]">
                              <span>{it.description || 'Item'}</span>
                              <span>{it.quantity} x ${it.unitPrice.toFixed(2)} = ${(it.quantity * it.unitPrice).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium">
                  Total: ${p.totalSetup.toLocaleString()} + ${p.totalMonthly.toLocaleString()}/mo
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


