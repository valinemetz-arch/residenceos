// Auto-generated types from Prisma schema
// These ensure type safety across the application

export interface BudgetItemWithRelations {
  id: string;
  category: string;
  description: string;
  budgetedAmount: number;
  actualAmount: number | null;
  status: string;
  spaceId: string | null;
  assetId: string | null;
  systemId: string | null;
  vendor: string | null;
  dueDate: Date | null;
  paidDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpaceWithRelations {
  id: string;
  name: string;
  building: string;
  floor: string | null;
  squareFootage: number | null;
  description: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetWithRelations {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  finish: string | null;
  cost: number | null;
  vendor: string | null;
  purchaseDate: Date | null;
  installDate: Date | null;
  warrantyMonths: number | null;
  warrantyExpires: Date | null;
  manualUrl: string | null;
  replacementParts: string | null;
  spaceId: string;
  systemId: string | null;
  barcode: string | null;
  qrCode: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  completedDate: Date | null;
  spaceId: string | null;
  systemId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyWithRelations {
  id: string;
  title: string;
  description: string | null;
  coverageScope: string | null;
  startDate: Date;
  endDate: Date;
  months: number | null;
  assetId: string | null;
  spaceId: string | null;
  systemId: string | null;
  provider: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  claimProcess: string | null;
  serialNumber: string | null;
  status: string;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceWithRelations {
  id: string;
  title: string;
  description: string | null;
  interval: string;
  assetId: string;
  systemId: string | null;
  instructions: string | null;
  lastCompleted: Date | null;
  nextDue: Date | null;
  vendor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  url: string;
  caption: string | null;
  takeDate: Date;
  constructionPhase: string | null;
  spaceId: string | null;
  assetId: string | null;
  systemId: string | null;
  taskId: string | null;
  specificationId: string | null;
  milestoneId: string | null;
  maintenanceId: string | null;
  budgetItemId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  fileType: string | null;
  versionNumber: number;
  revisionDate: Date;
  spaceId: string | null;
  assetId: string | null;
  systemId: string | null;
  taskId: string | null;
  specificationId: string | null;
  milestoneId: string | null;
  maintenanceId: string | null;
  budgetItemId: string | null;
  description: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
