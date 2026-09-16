# Design System — SecureShare (Figma Source of Truth)

Extracted directly from Figma design `Utf9V1uZJW6efw4V9PnsC8/Untitled?node-id=0-1`.

---

## 1. Color Palette (Tokens)

### Primary & Accents
- **Primary Brand (Purple/Indigo):** `#5D5FEF` (`hsl(239, 82%, 65%)`)
- **Primary Brand Hover:** `#4F46E5`
- **Primary Surface / Active Tint:** `#EEF2FF` / `#F0F3FF`
- **Primary Inactive Icon / Text:** `#64748B`

### Neutrals
- **App Background:** `#F8FAFC`
- **Surface / Card Background:** `#FFFFFF`
- **Border Default:** `#E2E8F0`
- **Text Primary (Headings, Main Labels):** `#0F172A`
- **Text Secondary / Muted:** `#64748B`
- **Text Tertiary / Subtle Timestamps:** `#94A3B8`

### File Type Badges & Accents
- **PDF Badge:** Background `#FEE2E2`, Text `#EF4444`, Border `rgba(239, 68, 68, 0.2)`
- **PNG / Image Badge:** Background `#DCFCE7`, Text `#16A34A`, Border `rgba(22, 163, 74, 0.2)`
- **DOCX Badge:** Background `#DBEAFE`, Text `#2563EB`, Border `rgba(37, 99, 235, 0.2)`
- **XLSX Badge:** Background `#D1FAE5`, Text `#059669`, Border `rgba(5, 150, 105, 0.2)`

### Storage Breakdown Colors
- **Documents:** `#5D5FEF` (Purple)
- **Images:** `#10B981` (Green)
- **Videos:** `#F59E0B` (Amber)

---

## 2. Typography
- **Font Family:** `Inter`, system-ui, -apple-system, sans-serif
- **App Title / Headings:** `font-semibold` (600), `18px - 20px`, letter-spacing `-0.02em`
- **Section Titles (Folders, Recent Files):** `font-semibold` (600), `15px`, color `#0F172A`
- **Card Titles:** `font-medium` (500), `14px`, color `#0F172A`
- **Subtitles & Metadata:** `font-normal` (400), `12px - 13px`, color `#94A3B8`
- **Badges:** `font-semibold` (600), `10px - 11px`, uppercase

---

## 3. Spacing, Borders & Shadows
- **Card Border Radius:** `16px` (`rounded-2xl` for modals and main containers, `rounded-xl` for cards)
- **Button Radius:** `10px - 12px` (`rounded-xl`)
- **Pills / Chips:** `9999px` (`rounded-full`)
- **Card Border:** `1px solid #E2E8F0`
- **Active / Selected Card Border:** `2px solid #2563EB` (Blue outline)
- **Card Shadow:** `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)`
- **Modal Shadow:** `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`

---

## 4. Reusable Core Components
- `Sidebar`: Collapsible navigation with brand logo, "+ New Upload" primary button, active navigation items, and storage widget.
- `Header`: Search input with shortcut badge (`⌘K`), notification bell with unread badge, and user avatar.
- `Breadcrumbs`: `My Drive > Projects > 2026 Pitch Deck`.
- `FilterChips`: "All" (active black), "Documents", "Images", "PDFs".
- `FolderCard`: Icon, title, file count, modified date, 3-dots kebab menu.
- `FileCard`: Large preview thumbnail, file type pill, title, size, updated timestamp, 3-dots menu.
- `ShareModal`: Exact match of `secureshare-share-modal` with user invite, roles dropdown, public link toggle, and password/expiry controls.
- `MobileNavigation`: 5-tab bar (`Home`, `Shared`, `Search`, `Starred`, `Profile`).
