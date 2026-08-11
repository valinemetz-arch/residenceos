# Bid Extraction & Asset Warranty Sync - Implementation Guide

## Overview

The bid extraction feature has been fully implemented in ResidenceOS, enabling contractors to upload bid documents (PDF or images) and automatically extract line items, match them to existing assets, and sync warranty information.

## Files Created

### 1. API Routes

#### `/app/api/assets/extract-from-bid/route.ts`
**Purpose**: Extracts bid items from uploaded PDF/image documents using Claude vision AI.

**Features**:
- Accepts multiple PDF and image files (JPG, PNG, WebP)
- Uses Claude 3.5 Sonnet for intelligent document analysis
- Extracts from each bid item:
  - Product description
  - Quantity
  - Unit price
  - Total cost
  - Vendor/supplier name
  - Warranty type and duration (in months)
- Implements fuzzy string matching to compare extracted items against existing assets
- Calculates confidence scores (0-100) for matches
- Filters matches to only show items with >= 50% similarity

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "description": "Kohler K-3978 Kitchen Faucet, Chrome",
        "quantity": 1,
        "unitPrice": 450.00,
        "totalCost": 450.00,
        "vendor": "Home Depot",
        "warrantyType": "5-year limited",
        "warrantyDuration": 60
      }
    ],
    "matches": [
      {
        "bidItemIndex": 0,
        "assetId": "asset123",
        "assetName": "Kitchen Faucet",
        "manufacturer": "Kohler",
        "model": null,
        "confidence": 85
      }
    ]
  }
}
```

#### `/app/api/assets/update-warranties/route.ts`
**Purpose**: Bulk updates existing assets with warranty information and creates new assets from unmatched bid items.

**Features**:
- Updates existing assets with:
  - Vendor information
  - Unit price (cost)
  - Warranty type and duration
- Creates new assets for unmatched bid items with:
  - Product description as asset name
  - Vendor and cost information
  - Warranty information pre-filled
  - Status set to "pending"
- All warranty records are created with:
  - Title: "{warranty type} - {year}"
  - Coverage scope: "Limited" or "Full" (auto-detected from warranty type)
  - Start date: current date
  - End date: calculated from duration in months
  - Status: "active"

**Request Format**:
```json
{
  "updates": [
    {
      "assetId": "asset123",
      "warrantyType": "5-year limited",
      "warrantyDuration": 60,
      "vendor": "Home Depot",
      "unitPrice": 450.00
    }
  ],
  "newAssets": [
    {
      "name": "Sub-Zero PRO 48 Refrigerator",
      "manufacturer": null,
      "model": null,
      "sku": null,
      "vendor": "Appliance Direct",
      "cost": 8500.00,
      "status": "pending",
      "notes": "Quantity: 1 | Total Cost: 8500.00",
      "spaceId": "space123",
      "systemId": null,
      "warrantyType": "5-year limited",
      "warrantyDuration": 60
    }
  ]
}
```

### 2. UI Component

#### `/app/components/tabs/BidExtractionTab.tsx`
**Purpose**: Provides a tabbed interface for bid extraction workflow.

**Two-Stage Workflow**:

**Stage 1: File Upload**
- Drag-and-drop zone for bid documents
- Support for PDF and image files (JPG, PNG, WebP)
- File size validation (max 10MB per file)
- Visual file list showing selected documents
- Progress indicator during AI analysis

**Stage 2: Review & Editing**
- Interactive table showing all extracted bid items with columns:
  - Description (editable)
  - Quantity (editable)
  - Unit Price (editable, currency format)
  - Warranty Type (editable)
  - Matched Asset (shows existing asset match if found, with confidence score)
  - Actions (edit/delete buttons)
- Inline editing capability for each field
- Ability to remove items before applying
- Space selector for new assets created from unmatched items
- "Add Warranty Info" button to apply all updates and create assets
- Back/Cancel buttons for navigation

**Features**:
- Real-time field validation
- Smart asset matching with confidence scores
- Automatic warranty duration conversion (years to months)
- Dark mode support with Tailwind CSS
- Toast notifications for success/error feedback
- Loading states and disabled button handling

### 3. Integration

#### Updated `/app/components/BulkAssetUploader.tsx`
**Changes**:
- Added `BidExtractionTab` import
- Added "bids" to the Tab type union
- Added new tab button "Extract Bids" to tab navigation
- Added conditional rendering for bids tab
- Bids tab is accessible from the "Add via AI" menu alongside:
  - Add Assets (from images/PDFs)
  - Create Spaces (from floor plans)
  - Extract Schedules (doors & windows)
  - Gap Analysis
  - **Extract Bids** (NEW)

## Workflow

### User Journey

1. **Access Feature**
   - Click "Add via AI" button in Assets page
   - Select "Extract Bids" tab

2. **Upload**
   - Drag & drop or click to select bid PDF/image files
   - System validates file type and size

3. **Analysis**
   - Click "Extract Bid Items" button
   - Claude vision AI analyzes each document
   - Extracts line items with full details
   - Matches items to existing assets using fuzzy matching
   - Shows confidence scores for matches
   - Toast notification shows summary (e.g., "Extracted 15 items, matched 10 to assets")

4. **Review & Edit**
   - Review extracted items in interactive table
   - Edit any incorrect extractions or quantities
   - See which items matched to existing assets
   - Edit matches if needed
   - Select default space for new unmatched assets
   - Option to delete items before proceeding

5. **Apply**
   - Click "Add Warranty Info" button
   - System updates matched assets with warranty info
   - Creates new assets for unmatched items
   - All warranty records are created with proper dates
   - Success notification shows counts
   - Modal closes and asset list refreshes

### Data Flow

```
Bid Upload (PDF/Image)
    ↓
Claude Vision Extraction
    ↓
Extracted Items + Metadata
    ↓
Fuzzy Matching (against existing assets)
    ↓
Matches + Confidence Scores
    ↓
User Review & Edit
    ↓
Apply Updates
    ├─ Update existing assets with warranty info
    └─ Create new assets for unmatched items
    ↓
Refresh Asset List
```

## Technical Details

### Fuzzy Matching Algorithm
- Uses Levenshtein distance for similarity calculation
- Checks for substring containment
- Returns confidence score 0-100
- Only matches with >= 50% confidence are shown

### Warranty Data Storage
- Creates Warranty records in database linked to Asset
- Calculates end date from duration in months
- Automatically detects "Limited" vs "Full" coverage from warranty description
- Stores start date as current date (when applied)

### Claude Integration
- Uses `claude-3-5-sonnet-20241022` model for analysis
- Supports both PDF text extraction and image vision
- Structured JSON output ensures consistent parsing
- Handles mixed content (PDFs + images in same upload)

### Database Operations
- Uses Prisma ORM for all database operations
- Atomic transactions prevent partial updates
- Proper error handling and cleanup

## Usage Examples

### Example 1: Contractor uploads kitchen renovation bid
1. Uploads bid PDF with 20 line items
2. System extracts all items with descriptions, prices, and warranty info
3. Matches 15 items to existing kitchen/plumbing assets (60-95% confidence)
4. Shows 5 unmatched items (new appliances not in system)
5. Contractor reviews and approves
6. System creates 5 new assets and updates 15 existing ones with warranty data
7. All warranty records are created with proper expiration dates

### Example 2: Quick warranty sync
1. Uploads vendor quote image
2. System extracts vendor info and warranty details
3. Matches to kitchen faucet asset (85% confidence)
4. Updates asset with cost and warranty info
5. Warranty record shows 5-year expiration from today

## Error Handling

- Invalid file types → Toast error with clear message
- Files > 10MB → Toast error with file size limit
- API key not configured → Returns 500 error with setup instructions
- PDF parsing failures → Gracefully continues with next file
- Failed matches → Items still processed as unmatched
- JSON parsing errors → Logs error, returns empty array

## Future Enhancements

- Bulk edit capabilities (e.g., apply warranty to all selected items)
- Import from contractor portals (API integration)
- Warranty expiration alerts
- Cost comparison and budget tracking
- Multi-vendor comparison view
- Historical bid tracking

## Testing Recommendations

1. **File Upload Tests**
   - Valid PDFs and images
   - Mixed file types
   - Files at 10MB limit
   - Invalid file types

2. **Extraction Tests**
   - Bids with warranty info
   - Bids without warranty info
   - Partially readable PDFs
   - Images with poor quality

3. **Matching Tests**
   - Items matching existing assets at various confidence levels
   - No matching items
   - Multiple matches (should use highest confidence)

4. **Warranty Creation Tests**
   - Limited vs Full coverage detection
   - Duration calculation in months
   - Expiration date calculation
   - Existing warranty updates

## Dependencies

- Anthropic SDK (`@anthropic-ai/sdk`) - already installed
- pdfjs-dist - for PDF text extraction (already installed)
- Prisma - for database operations (already installed)
- Tailwind CSS - for styling (already installed)
- Lucide React - for icons (already installed)

## Environment Requirements

- `ANTHROPIC_API_KEY` environment variable must be set
- Valid Claude API key with vision capabilities
- Database with Warranty and Asset tables

## File Paths Summary

```
app/
├── api/
│   └── assets/
│       ├── extract-from-bid/
│       │   └── route.ts          (NEW)
│       └── update-warranties/
│           └── route.ts          (NEW)
└── components/
    ├── tabs/
    │   └── BidExtractionTab.tsx   (NEW)
    └── BulkAssetUploader.tsx      (UPDATED)
```

## Notes

- The feature integrates seamlessly with existing asset management
- All warranty records are linked to assets for easy tracking
- Extraction uses vision AI for high accuracy with real bid documents
- Fuzzy matching prevents duplicates while catching variations in product names
- Warranty duration is intelligently converted from years to months
