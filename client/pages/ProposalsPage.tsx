import { useEffect, useMemo, useState } from "react";
import { SERVICE_PACKAGES, Service } from "./packages";

type Prospect = {
  id: string;
  name: string;
  category?: string;
  location?: string;
};

type Proposal = {
  id: string;
  prospectName: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  services: Service[];
  totalSetup: number;
  totalMonthly: number;
};

// Persist proposals across pages
const STORAGE_KEY = 'cp_proposals_v1';

export default function ProposalsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  // Single package selection (scrollable searchable list)
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [itemsByPackage, setItemsByPackage] = useState<Record<string, { description: string; quantity: number; unitPrice: number }[]>>({});
  const [packageSearch, setPackageSearch] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setProposals(JSON.parse(raw)); } catch {}
    try { const rawItems = localStorage.getItem('cp_package_items_v1'); if (rawItems) setItemsByPackage(JSON.parse(rawItems)); } catch {}
    const fetchProspects = async () => {
      try {
        setLoadingProspects(true);
        const token = localStorage.getItem('token');
        const res = await fetch("/api/serp/prospects", {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: "include"
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const mapped: Prospect[] = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            location: p.location,
          }));
          setProspects(mapped);
          if (mapped.length > 0 && !selectedProspectId) setSelectedProspectId(mapped[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoadingProspects(false);
      }
    };
    fetchProspects();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals)); } catch {}
  }, [proposals]);

  const packagesWithItems = useMemo(
    () => SERVICE_PACKAGES.map(s => ({ ...s, items: itemsByPackage[s.id] || [] })),
    [itemsByPackage]
  );

  const filteredPackagesForSearch = useMemo(
    () => packagesWithItems.filter(p => (p.name || "").toLowerCase().includes(packageSearch.toLowerCase())),
    [packagesWithItems, packageSearch]
  );

  const customPackagesFromStorage = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('cp_custom_packages_v1') || '[]'); } catch { return []; }
  }, []);

  const proposalDerivedPackages = useMemo(() => {
    // Surface services from previously generated proposals as selectable custom entries
    const pkgs: any[] = [];
    for (const p of proposals) {
      for (const s of p.services || []) {
        pkgs.push({
          ...s,
          id: `proposal-${p.id}-${s.id}`,
          name: `Custom: ${p.prospectName || 'Proposal'} • ${s.name}`
        });
      }
    }
    return pkgs;
  }, [proposals]);

  const combinedPackages = useMemo(
    () => [...packagesWithItems, ...customPackagesFromStorage, ...proposalDerivedPackages],
    [packagesWithItems, customPackagesFromStorage, proposalDerivedPackages]
  );

  const selectedPackage = useMemo(
    () => combinedPackages.find(p => p.id === selectedPackageId),
    [combinedPackages, selectedPackageId]
  );

  const generateProposal = () => {
    const prospect = prospects.find(p => p.id === selectedProspectId);
    if (!prospect || !selectedPackage) return;
    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      prospectName: prospect.name,
      status: "draft",
      services: [selectedPackage],
      totalSetup: selectedPackage.setup,
      totalMonthly: selectedPackage.monthly,
    };
    setProposals(prev => [proposal, ...prev]);
  };

  const generatePdf = () => {
    const prospect = prospects.find(p => p.id === selectedProspectId);
    const pkg = packagesWithItems.find(p => p.id === selectedPackageId);
    if (!prospect || !pkg) return;
    const html = `<!doctype html>
    <html><head><meta charset="utf-8" />
    <title>Proposal - ${prospect.name}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 16px 0 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
      .totals { margin-top: 12px; }
    </style>
    </head><body>
      <h1>Proposal</h1>
      <div><strong>Client:</strong> ${prospect.name}${prospect.location ? ` • ${prospect.location}` : ""}</div>
      <div><strong>Category:</strong> ${prospect.category || ""}</div>
      <h2>Selected Package</h2>
      <div><strong>${pkg.name}</strong></div>
      <div>${pkg.description || ""}</div>
      <div style="margin-top:6px">Setup: $${pkg.setup.toLocaleString()} • Monthly: $${pkg.monthly.toLocaleString()}/mo</div>
      ${(pkg.items && pkg.items.length) ? `
      <h2>Line Items</h2>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>
      ${pkg.items.map(it => `<tr><td>${it.description || ''}</td><td>${it.quantity}</td><td>$${it.unitPrice.toFixed(2)}</td><td>$${(it.quantity*it.unitPrice).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>` : ''}
      <div class="totals"><strong>Total Setup:</strong> $${pkg.setup.toLocaleString()} • <strong>Total Monthly:</strong> $${pkg.monthly.toLocaleString()}/mo</div>
      <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 300); };</script>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const generatePdfFromProposal = (p: Proposal) => {
    if (!p) return;
    const pkg = (p.services && p.services[0]) ? p.services[0] : undefined;
    const html = `<!doctype html>
    <html><head><meta charset=\"utf-8\" />
    <title>Proposal - ${p.prospectName}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 16px 0 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
      .totals { margin-top: 12px; }
    </style>
    </head><body>
      <h1>Proposal</h1>
      <div><strong>Client:</strong> ${p.prospectName}</div>
      ${pkg ? `
      <h2>Selected Package</h2>
      <div><strong>${pkg.name}</strong></div>
      <div>${pkg.description || ''}</div>
      <div style=\"margin-top:6px\">Setup: $${pkg.setup.toLocaleString()} • Monthly: $${pkg.monthly.toLocaleString()}/mo</div>
      ${(pkg.items && pkg.items.length) ? `
      <h2>Line Items</h2>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>
      ${pkg.items.map((it:any) => `<tr><td>${it.description || ''}</td><td>${it.quantity}</td><td>$${Number(it.unitPrice).toFixed(2)}</td><td>$${(Number(it.quantity)*Number(it.unitPrice)).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>` : ''}
      <div class=\"totals\"><strong>Total Setup:</strong> $${p.totalSetup.toLocaleString()} • <strong>Total Monthly:</strong> $${p.totalMonthly.toLocaleString()}/mo</div>
      ` : ''}
      <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 300); };</script>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Proposal Generator</h1>
        <div className="text-sm text-muted-foreground">Create New Proposal</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border rounded-md p-4">
          <div className="text-sm font-medium mb-3">Select Prospect</div>
          {loadingProspects ? (
            <div className="text-sm text-muted-foreground">Loading prospects…</div>
          ) : (
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedProspectId}
              onChange={(e) => setSelectedProspectId(e.target.value)}
            >
              {prospects.length === 0 && <option value="">No prospects available</option>}
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="lg:col-span-2 border rounded-md p-4">
          <div className="text-sm font-medium mb-2">Select Package</div>
          <div className="mb-2">
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={packageSearch} onChange={(e)=>setPackageSearch(e.target.value)} placeholder="Search packages (default + custom)" />
          </div>
          <div className="max-h-80 overflow-auto space-y-2">
            {combinedPackages
              .filter(s => (s.name || '').toLowerCase().includes(packageSearch.toLowerCase()))
              .map(s => (
              <label key={s.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent cursor-pointer">
                <input
                  type="radio"
                  name="package"
                  className="mt-1"
                  checked={selectedPackageId === s.id}
                  onChange={() => setSelectedPackageId(s.id)}
                />
                <div className="text-sm">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ${s.setup.toLocaleString()}.00 setup + ${s.monthly.toLocaleString()}.00/mo
                  </div>
                  {(s.items || []).length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-1">{(s.items || []).length} line item(s) configured</div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t">
            <div className="text-sm">
              <div>Total Setup: <span className="font-semibold">${selectedPackage ? selectedPackage.setup.toLocaleString() : 0}.00</span></div>
              <div>Total Monthly: <span className="font-semibold">${selectedPackage ? selectedPackage.monthly.toLocaleString() : 0}.00/mo</span></div>
            </div>
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
              onClick={generateProposal}
              disabled={!selectedProspectId || !selectedPackage}
            >
              Generate Proposal
            </button>
          </div>

          {/* Inline Active Proposals (moved inside the right panel per request) */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Active Proposals</div>
            {proposals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No proposals yet.</div>
            ) : (
              <div className="space-y-3">
                {proposals.map(p => (
                  <div key={p.id} className="border rounded-md p-4">
                    <div className="text-sm font-semibold">Proposal for {p.prospectName}</div>
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Total: ${p.totalSetup.toLocaleString()} + ${p.totalMonthly.toLocaleString()}/mo
                      </div>
                      <button className="px-3 py-1 rounded-md border text-xs" onClick={() => generatePdfFromProposal(p)}>Download PDF</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Generator - choose ONE package via searchable list */}
      <div className="border rounded-md p-4">
        <div className="text-sm font-medium mb-3">Generate PDF</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Search Package</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={packageSearch} onChange={(e)=>setPackageSearch(e.target.value)} placeholder="Type to search by name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Select Package</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={selectedPackageId} onChange={(e)=>setSelectedPackageId(e.target.value)}>
              <option value="">Choose…</option>
              {filteredPackagesForSearch.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60" onClick={generatePdf} disabled={!selectedProspectId || !selectedPackageId}>Download PDF</button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Uses client details from the left and the selected package (including your custom line items).</div>
      </div>

      {/* Active Proposals moved inline above */}
    </div>
  );
}


