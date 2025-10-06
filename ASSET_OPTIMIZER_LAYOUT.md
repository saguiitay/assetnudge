# Asset Optimizer - Page Layout and Structure

## Overview

The Asset Optimizer page has been enhanced with a comprehensive layout that addresses all the requirements:

1. ✅ Asset Editor for entering/importing asset details
2. ✅ Asset Grade display with real-time updates
3. ✅ AI Generation capabilities for creating new asset details
4. ✅ Similar Assets discovery for exemplar references

## Layout Structure

### Desktop Layout (XL screens and above)
```
┌─────────────────────────────────────────────────────────────┐
│                    Header & Breadcrumbs                     │
├─────────────────────────────────────────────────────────────┤
│ Left Column (Input & Generation) │ Right Column (Results)   │
│ ┌─────────────────────────────┐   │ ┌─────────────────────┐  │
│ │   Asset Editor              │   │ │   Asset Grade       │  │
│ │   - Import from URL         │   │ │   - Overall Score   │  │
│ │   - Manual Entry Forms      │   │ │   - Breakdown       │  │
│ │   - Real-time Validation    │   │ │   - Recommendations │  │
│ └─────────────────────────────┘   │ └─────────────────────┘  │
│ ┌─────────────────────────────┐   │ ┌─────────────────────┐  │
│ │   AI Asset Generator        │   │ │   Similar Assets    │  │
│ │   - Generate All Details    │   │ │   - Exemplar Cards  │  │
│ │   - Selective Generation    │   │ │   - Relevance Score │  │
│ │   - Field-specific Options  │   │ │   - Performance     │  │
│ └─────────────────────────────┘   │ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile/Tablet Layout (Below XL)
```
┌─────────────────────────────────────┐
│            Header                   │
├─────────────────────────────────────┤
│ Tabbed Interface:                   │
│ [Input] [Generate] [Results] [Similar] │
├─────────────────────────────────────┤
│                                     │
│       Active Tab Content            │
│                                     │
└─────────────────────────────────────┘
```

## Key Features Implemented

### 1. Enhanced Asset Editor
- **Import from Unity Asset Store URLs**: Automatic data population
- **Manual Entry Forms**: Comprehensive field validation
- **Real-time Updates**: Asset changes trigger automatic re-grading
- **HTML Support**: Long descriptions with allowed HTML tags
- **Tag Management**: Dynamic tag addition/removal

### 2. AI Asset Generator (NEW)
- **Generate All Details**: One-click enhancement of all fields
- **Selective Generation**: Choose specific fields to generate
- **Field Options**: Title, description, tags, category, pricing
- **Preview System**: See generated content before applying
- **Smart Integration**: Builds on existing asset data

### 3. Real-time Asset Grading
- **Automatic Updates**: Grade recalculates when asset details change
- **Detailed Breakdown**: Score breakdown by category
- **Actionable Recommendations**: Specific improvement suggestions
- **Performance Tracking**: Historical grading timestamps

### 4. Similar Assets Discovery (NEW)
- **Automatic Search**: Finds similar assets when asset is loaded
- **Relevance Scoring**: Shows match percentage and reasons
- **Rich Asset Cards**: Ratings, downloads, pricing, tags
- **External Links**: Direct links to asset store pages
- **Mock Data**: Currently uses generated examples (ready for API integration)

## User Experience Flow

### Initial Load
1. User sees empty state with placeholders
2. Clear call-to-action to import or create asset

### Asset Import/Creation
1. User imports from URL or fills manual forms
2. Asset data populates across all components
3. Grade automatically calculates
4. Similar assets search begins automatically
5. Generation options become available

### Enhancement Workflow
1. User reviews initial grade and recommendations
2. Uses AI generator to improve specific fields
3. Grade updates in real-time as changes are made
4. References similar assets for inspiration
5. Iterates until satisfied with results

## Technical Implementation

### State Management
- **Centralized Asset State**: Single source of truth in main page
- **Real-time Updates**: Uses keys to force component re-renders
- **Auto-synchronization**: All components stay in sync

### Responsive Design
- **Desktop**: Two-column layout with full visibility
- **Mobile**: Tabbed interface with auto-navigation
- **Adaptive**: Seamless experience across screen sizes

### API Integration Ready
- **Mock Data**: Currently uses generated examples
- **Extensible**: Easy to replace with real API calls
- **Error Handling**: Comprehensive error states and retry mechanisms

## Future Enhancements

### Backend Integration
- Connect AssetGenerator to `/optimize` endpoint
- Connect SimilarAssets to similarity search API
- Add real-time grade updates via WebSocket

### Advanced Features
- Asset history and version tracking
- Collaborative editing
- Export to multiple formats
- A/B testing for asset variants

## Component Structure

```
page.tsx (Main Layout)
├── AssetEditor (Import & Manual Entry)
├── AssetGenerator (AI Enhancement)
├── AssetGrade (Real-time Scoring)
└── SimilarAssets (Discovery & Reference)
```

Each component is self-contained, reusable, and communicates through well-defined props and callbacks.