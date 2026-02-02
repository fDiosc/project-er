# ER Review System - User Guide

A comprehensive guide for using the ER Review System to manage, review, and track enhancement requests.

> [!NOTE]
> This guide covers the **GPT-5.2 Enhanced** version of the ER Review System.

*Last updated: 2026-02-02*

## 🏁 Getting Started

### First Login

1. **Access the Application**
   - Navigate to your deployment URL (e.g., `http://your-server-ip`)
   - You'll be redirected to the login page

2. **Login Credentials**
   - **Admin**: username `admin`, password `admin123`
   - **Reviewer**: username `reviewer`, password `review123`

3. **After Login**
   - You'll land on the main ER list page
   - The navigation bar shows Dashboard, Home (ER List), and Logout options

## 📋 Managing Enhancement Requests (ERs)

### The ER List View

The main page displays all ERs in an interactive table with:

#### **Table Features**
- **Search Bar**: Full-text search across ER subjects and descriptions
- **Company Filter**: Dropdown to filter by specific companies
- **Status Filter**: Filter by OPEN, IN_REVIEW, ACCEPT, ACCEPTED, REJECT, or REJECTED
- **Score Range Filter**: Set minimum and maximum score thresholds
- **Sorting**: Click column headers to sort (supports multiple columns)
- **Pagination**: Navigate through large datasets

#### **Table Columns**
- **Subject**: ER title (click to open details)
- **Company**: Associated company name
- **Status**: Current workflow status with color coding
- **Scores**: Individual dimension scores (Strategic, Impact, Technical, Resource, Market)
- **Total**: Calculated total score (0-25 range)
- **Actions**: Quick action buttons

### Viewing ER Details

**Click on any ER subject** to open the detailed view drawer with up to 6 tabs:

#### **1. Ticket Story Tab**
- **AI Executive Summary**: Concise summary provided by GPT-5.2 based on full ticket history.
- **Full Conversation Thread**: Chronological list of the initial request and all synced public Zendesk comments.
- **Backfill**: Ensuring history is complete even if the ticket was previously synced without it.
- **Metadata**: Priority, sentiment, and version details.
- **Dates**: Creation, requested, and last updated dates.
- **Ticket Links**: All external IDs link directly to Zendesk in new tabs.

#### **2. Cluster Vision Tab (Formerly Similarity)**
- **AI Consolidation**: For ERs part of a theme, see a unified view of requirements.
- **Functional Intersection**: List of core requirements identified across the group (formerly Technical Requirements).
- **Consolidated PRD**: Detailed analysis of how multiple ERs merge into a single product vision.
- **Approved Group Scores**: Suggested prioritization scores for the entire cluster, displayed at the bottom of the requirements.
- **Approve Consolidation**: Button to finalize the group and set relevant statuses.

#### **3. Scores Tab**
- **Interactive Sliders**: Adjust scores for each dimension (0-5 scale).
- **AI Suggested Scores**: Proposed scores visible directly below each slider based on AI analysis.
- **Apply AI Suggested Scores**: A prominent button in the header that instantly updates all five dimensions with the AI's recommendations.
- **Real-time Calculation**: Total score updates automatically as you adjust or apply values.
- **Score Dimensions**:
  - **Strategic**: Alignment with business strategy.
  - **Impact**: Expected business impact for the customer.
  - **Technical**: Technical complexity/feasibility.
  - **Resource**: Resource effort (Note: 5 = High Effort, contributes 0 to total).
  - **Market**: Market demand/opportunity.

#### **4. Comments Tab**
- **Add Comments**: Text area for new comments
- **Comment History**: All previous comments with timestamps
- **Author Attribution**: Shows who made each comment

#### **5. History Tab**
- **Audit Trail**: Complete change history
- **Action Types**: Creation, updates, score changes, status changes
- **Details**: What changed, when, and by whom

#### **6. Meta Tab**
- **Technical Details**: ER ID, external ID
- **Cluster ID**: The ID of the theme/cluster if this ER is consolidated.
- **Timestamps**: Created at, last updated
- **System Information**: Additional metadata

### Inline Editing

For quick updates without opening the detail drawer:

#### **Score Editing**
- **Click any score cell** to edit inline
- **Use slider or input field** to change value
- **Press Enter or click away** to save
- **ESC to cancel** changes

#### **Status Changes**
- **Click status cell** to open dropdown
- **Select new status** to update immediately
- **Color coding** shows status at a glance:
  - 🔵 OPEN (Blue)
  - 🟡 IN_REVIEW (Yellow) 
  - 🟢 ACCEPTED (Green - External Sync/Final)
  - ❇️ ACCEPT (Emerald - Cluster Approved)
  - 🔴 REJECTED (Red - External/Final)
  - 🥀 REJECT (Rose - Cluster Declined)

## 📊 Dashboard Analytics

Navigate to **Dashboard** from the main menu to view:

### 🌟 Intelligent Dashboard (New)
The Intelligent Dashboard is an AI-powered control center for your backlog.

- **AI Chat Panel**: Ask questions directly to your data. "What's the overall sentiment for Company X?" or "Compare the resource effort of our top 5 high-impact ERs."
- **Artifact Renderer**: AI-generated reports, strategic analyses, and consolidated PRDs are displayed here in a clean, interactive format.
- **Deep Context**: The AI has access to your full synced history, providing insights that go beyond simple metadata.

### **Key Performance Indicators (KPIs)**
- **Total ERs**: Complete count across all statuses
- **Status Breakdown**: Open, In Review, Accepted, Rejected counts
- **Completion Rate**: Percentage of ERs completed (Accepted + Rejected)
- **Average Scores**: Overall and current month averages

### **Visual Charts**
- **Status Distribution**: Pie chart showing ER status proportions
- **Company Performance**: Bar chart ranking companies by metrics
- **Score Analysis**: Distribution of scores across all dimensions
- **Trend Analysis**: Progress over time with line charts
- **Source Breakdown**: Comparison of ERs originating from CSV vs Zendesk.

### **Company Insights**
- **Company Rankings**: Performance metrics by company
- **Acceptance Rates**: Percentage of ERs accepted per company
- **Average Scores**: Score performance by company

## 📁 Data Import/Export

### CSV Import

**Import bulk ER data from CSV files:**

1. **Click "Import CSV"** button on the main table
2. **Select CSV file** from your computer
3. **Review mapping** of CSV columns to ER fields
4. **Confirm import** to process the data

#### **Supported CSV Fields**
- **Required**: Subject, Company
- **Optional**: Description, Overview, Status
- **Scores**: Strategic, Impact, Technical, Resource, Market
- **Metadata**: Priority, Sentiment, Requested Date, Committed Version

#### **Import Process**
- **Automatic Company Creation**: New companies created as needed
- **Duplicate Handling**: Checks for existing ERs by external ID
- **Data Validation**: Ensures scores are 0-5, valid statuses
- **Error Reporting**: Shows any issues found during import

#### **Import Results**
- **Success Count**: Number of ERs successfully imported
- **Skipped Count**: Duplicates or invalid entries skipped
- **Error Details**: Specific issues with row numbers

### CSV Export

**Export filtered ER data:**

1. **Apply desired filters** on the main table
2. **Click "Export CSV"** button
3. **Download automatically starts** with filtered data

#### **Export Includes**
- All visible columns from the table
- Respects current filters and search
- Complete ER information including scores and metadata

## ⚙️ Scoring System

### Understanding the Scoring

Each ER is evaluated across **5 dimensions** using a **0-5 point scale**:

#### **Scoring Dimensions**
- **Strategic (0-5)**: How well does this align with business strategy?
- **Impact (0-5)**: What's the expected business impact?
- **Technical (0-5)**: How technically feasible is this?
- **Resource (0-5)**: How many resources will this require? (5 = high resources)
- **Market (0-5)**: How much market demand exists?

#### **Total Score Calculation**
```
Total = Strategic + Impact + Market + Technical + (5 - Resource)
```

**Note**: Resource is inverted - high resource requirements (5) contribute less to total score.

#### **Score Interpretation**
- **0-10**: Low priority, may defer
- **11-15**: Medium priority, consider for future releases
- **16-20**: High priority, plan for upcoming releases  
- **21-25**: Critical priority, immediate attention needed

## 🔄 Workflow Management

### ER Lifecycle

ERs follow a structured workflow:

#### **Status Flow**
1. **OPEN**: Newly submitted or reorganized ERs
2. **IN_REVIEW**: Currently being evaluated
3. **ACCEPT**: Approved via Cluster/Theme consolidation
4. **ACCEPTED**: Final approval, typically synced from Zendesk
5. **REJECT**: Declined via Cluster/Theme consolidation
6. **REJECTED**: Final rejection, typically synced from Zendesk

#### **Cluster Distinction**
- **ACCEPT/REJECT**: Use these for internal triage and cluster-based decisions. 
- **ACCEPTED/REJECTED**: These are reserved for statuses that are driven by external systems (Zendesk sync) or final manual confirmations that don't go through the cluster triage process.

#### **Best Practices**
- **Review Process**: Move ERs to IN_REVIEW when actively evaluating
- **Score Before Decision**: Ensure all dimensions are scored
- **Add Comments**: Document reasoning for status changes
- **Regular Updates**: Keep stakeholders informed of progress

### Team Collaboration

#### **Comments System**
- **Document Decisions**: Explain why ERs were accepted/rejected
- **Track Questions**: Ask for clarification or additional info
- **Share Insights**: Provide technical or business context
- **Maintain History**: All comments preserved for future reference

#### **Audit Trail**
- **Complete History**: Every change is tracked automatically
- **User Attribution**: See who made what changes when
- **Change Details**: Understand what specifically changed
- **Compliance**: Maintain records for auditing purposes

## 🔍 Advanced Filtering

### Search Capabilities

#### **Text Search**
- **Global Search**: Searches across subject, description, and overview
- **Partial Matches**: Finds ERs containing search terms
- **Case Insensitive**: Search works regardless of capitalization

#### **Filter Combinations**
- **Company + Status**: Find all open ERs for specific company
- **Score Range + Company**: High-scoring ERs from key customers
- **Status + Search**: In-review ERs containing specific keywords
- **Multiple Filters**: Combine any filters for precise results

### Sorting Options

#### **Available Sort Fields**
- **Subject**: Alphabetical by ER title
- **Company**: Group by company name
- **Status**: Group by workflow status
- **Total Score**: Rank by calculated score
- **Created Date**: Newest or oldest first
- **Updated Date**: Most recently modified

#### **Multi-Column Sorting**
- **Hold Shift + Click**: Sort by multiple columns
- **Priority Order**: First sort takes precedence
- **Visual Indicators**: Arrows show sort direction

## 📱 Mobile Usage

### Mobile-Friendly Features

#### **Responsive Design**
- **Adaptive Layout**: Optimizes for smaller screens
- **Touch Interactions**: Tap-friendly buttons and controls
- **Readable Text**: Appropriate font sizes for mobile
- **Swipe Gestures**: Natural mobile navigation

#### **Mobile Table**
- **Column Priority**: Most important columns show first
- **Horizontal Scroll**: Access all data when needed
- **Compact Mode**: Reduced spacing for more content
- **Touch Selection**: Easy row and cell selection

## 🎨 Customization

### Theme Options

#### **Dark/Light Mode**
- **Automatic Detection**: Follows system preference
- **Manual Toggle**: Switch themes in user settings
- **Consistent Colors**: All charts and components adapt

### User Preferences

#### **Table Settings**
- **Rows Per Page**: Choose 10, 25, 50, or 100 rows
- **Column Visibility**: Show/hide specific columns
- **Default Filters**: Save commonly used filter sets

## 🚨 Troubleshooting

### Common Issues

#### **Login Problems**
- **Verify Credentials**: Check username and password
- **Clear Browser Cache**: Remove stored tokens
- **Check Network**: Ensure server connectivity

#### **Data Loading Issues**
- **Slow Performance**: Reduce page size or add filters
- **Missing Data**: Check if ERs meet current filter criteria
- **Refresh Page**: Reload to get latest data

#### **Import/Export Problems**
- **CSV Format**: Ensure proper column headers
- **File Size**: Large files may timeout
- **Data Validation**: Check for invalid scores or statuses

### Getting Help

#### **Error Messages**
- **Read Carefully**: Error messages provide specific guidance
- **Check Browser Console**: May show additional technical details
- **Network Tab**: Verify API requests are successful

#### **Support Channels**
- **Documentation**: Check README.md and API.md
- **System Logs**: Administrator can review server logs
- **Issue Tracking**: Report bugs with detailed reproduction steps

## 📈 Best Practices

### For Administrators

#### **Data Management**
- **Regular Backups**: Export data periodically
- **Clean Import**: Validate CSV data before importing
- **Monitor Performance**: Watch for slow queries or large datasets
- **User Training**: Ensure team understands scoring system

### For Reviewers

#### **Consistent Scoring**
- **Use Full Range**: Don't avoid high or low scores
- **Document Reasoning**: Add comments explaining scores
- **Regular Reviews**: Revisit scores as requirements change
- **Team Alignment**: Discuss scoring criteria with colleagues

#### **Efficient Workflow**
- **Batch Processing**: Review similar ERs together
- **Use Filters**: Focus on specific companies or priorities
- **Keyboard Shortcuts**: Learn navigation shortcuts
- **Regular Updates**: Keep ER statuses current

### Data Quality

#### **Maintaining Clean Data**
- **Consistent Naming**: Standardize company names
- **Complete Information**: Fill in all relevant fields
- **Regular Cleanup**: Remove duplicates or invalid entries
- **Validation Rules**: Follow scoring guidelines

---

## 🔄 Zendesk Integration

The Zendesk sync is a powerful one-way integration that keeps your ER backlog in sync with customer support tickets.

### **Sync Options**
- **Auto-reject Missing**: ERs no longer present in the synced Zendesk view will be moved to `REJECTED`.
- **Auto-accept Mapped**: Automatically move tickets to `ACCEPTED` if specific Zendesk custom fields match (e.g., "Dev on Track").
- **Run AI Analysis**: Trigger a GPT-5.2 analysis of the **entire conversation history** during the sync. This generates the initial summary and suggests scores.

### **The "Conversation Story"**
Every Zendesk-synced ER features a full chronological thread of public comments, ensuring you have the complete context for prioritization without leaving the app.

---

## 📞 Support

For additional help:
1. **Check Documentation**: README.md and API.md files
2. **Review Error Messages**: Often contain specific guidance
3. **Contact Administrator**: For system-level issues
4. **Report Bugs**: With detailed reproduction steps

---

*Last updated: 2026-02-02*