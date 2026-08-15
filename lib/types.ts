export interface SpaceBase {
  [key: string]: unknown;
  id?: string;
  name: string;
  building: string;
  floor: number | null;
  squareFootage: number | null;
  description: string | null;
  status: string;
  notes: string | null;
}

export interface SpaceWithCount extends SpaceBase {
  id: string;
  _count: {
    assets: number;
    tasks: number;
    photos: number;
  };
}

export interface AssetBase {
  [key: string]: unknown;
  id?: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  finish: string | null;
  cost: number | null;
  vendor: string | null;
  purchaseDate: string | null;
  installDate: string | null;
  warrantyMonths: number | null;
  spaceId: string;
  systemId: string | null;
  status: string;
  notes: string | null;
}

export interface AssetWithRelations extends AssetBase {
  id: string;
  space: { id: string; name: string };
  system: { id: string; name: string } | null;
  _count?: {
    photos: number;
    documents: number;
  };
}

export interface BudgetItemBase {
  [key: string]: unknown;
  id?: string;
  name: string;
  description: string | null;
  category: string;
  spaceId: string | null;
  budgetedAmount: number | null;
  actualAmount: number | null;
  status: string;
  notes: string | null;
}

export interface BudgetItemWithRelations extends BudgetItemBase {
  id: string;
  space: { id: string; name: string } | null;
}

export interface TaskBase {
  [key: string]: unknown;
  id?: string;
  title: string;
  description: string | null;
  spaceId: string | null;
  systemId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedToUserId: string | null;
  assignedToContractorId: string | null;
  notes: string | null;
}

export interface TaskWithRelations extends TaskBase {
  id: string;
  space: { id: string; name: string } | null;
  system: { id: string; name: string } | null;
  assignedToUser: { id: string; name: string | null; email: string; role: string } | null;
  assignedToContractor: { id: string; companyName: string; contactName: string | null; email: string } | null;
  assignedAt?: string | null;
}
