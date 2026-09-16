# Figma Design Implementation Rules

You are working on this project where the UI/UX design has already been finalized in Figma.

## PRIMARY RULE

**Figma is the single source of truth for the UI design.**

Your job is to implement the existing Figma design in the application as accurately as possible.

Do NOT redesign, reinterpret, simplify, or invent UI elements unless explicitly asked to do so.

---

## 1. Before Writing Code

Before implementing or modifying any UI:

1. Inspect the relevant Figma design.
2. Understand the complete page layout.
3. Check existing project components.
4. Check `DESIGN_SYSTEM.md` if it exists.
5. Reuse existing components wherever possible.
6. Compare the Figma design with the current implementation before making changes.

Do not immediately start coding based only on a textual description.

---

## 2. Pixel-Accurate Implementation

Match the Figma design as closely as technically possible.

Pay attention to:

* Page layout
* Width and height
* Padding
* Margin
* Gap
* Font family
* Font size
* Font weight
* Line height
* Letter spacing
* Colors
* Backgrounds
* Borders
* Border radius
* Shadows
* Icons
* Images
* Button dimensions
* Input dimensions
* Table dimensions
* Sidebar width
* Header height
* Card sizes
* Alignment
* Positioning
* Responsive behavior

Do not approximate these values when the Figma design provides the exact values.

---

## 3. Do Not Invent Design

Never create your own:

* Colors
* Fonts
* Button styles
* Card styles
* Icons
* Spacing
* Border radius
* Shadows
* Layout patterns

if the design already defines them.

If something is unclear in Figma, inspect the surrounding components and existing design system before making a decision.

If it is still unclear, ask the user instead of redesigning it yourself.

---

## 4. Reuse Components

Before creating a new component, check whether an existing component already provides the same functionality.

For example:

* Button
* Input
* Select
* Dropdown
* Modal
* Table
* Pagination
* Tabs
* Card
* Badge
* Sidebar
* Navbar
* Form fields
* Date picker

Prefer:

```text
Existing component
        ↓
Reuse
        ↓
Customize only where required
```

Do not create duplicate components with slightly different styling.

---

## 5. Preserve Existing Design

Once a page has been implemented according to Figma, consider that design **locked**.

Do not change its visual design while working on another feature.

For example, if asked:

> "Add API integration to the Leads page"

you should modify the data/functionality without changing:

* layout
* colors
* typography
* spacing
* components
* responsive design

unless the API requirement genuinely requires a UI change.

---

## 6. Responsive Design

The Figma design may contain desktop, tablet and mobile layouts.

Implement the responsive behavior according to Figma.

Do not simply make the desktop layout shrink.

Check:

* Sidebar behavior
* Header behavior
* Cards
* Tables
* Forms
* Buttons
* Spacing
* Typography
* Mobile navigation

---

## 7. Visual Verification

After implementing a page:

1. Run the application.
2. Open the implemented page.
3. Compare it against Figma.
4. Identify visual differences.
5. Fix the differences.
6. Repeat until the implementation closely matches Figma.

Do not consider the task complete just because the page compiles successfully.

**Compilation success does NOT mean design success.**

---

## 8. Do Not Modify Unrelated Pages

When working on one page:

* Do not redesign other pages.
* Do not change global styles unnecessarily.
* Do not replace existing components unnecessarily.
* Do not change unrelated functionality.
* Do not perform large refactors unless requested.

Keep changes scoped to the requested task.

---

## 9. Design Consistency

The entire application must feel like one consistent product.

If the same component appears on multiple Figma screens, it should use the same implementation and styling.

Example:

```text
Figma Button
      ↓
Reusable Button component
      ↓
Used everywhere
```

Do not create:

```text
Button A
Button B
Button C
```

with slightly different styling when they represent the same Figma component.

---

## 10. When Given a Figma Screen

When provided a Figma screen or Figma reference, follow this process:

```text
Figma
  ↓
Analyze layout
  ↓
Identify components
  ↓
Check existing components
  ↓
Check design system
  ↓
Implement
  ↓
Run application
  ↓
Compare with Figma
  ↓
Fix visual differences
  ↓
Final verification
```

---

## 11. Important Priority Order

When deciding how something should look, use this priority:

1. **Figma design**
2. **Project design system**
3. **Existing reusable components**
4. **Existing project conventions**
5. **Your own implementation decision**

Never put your own design preference above the finalized Figma design.

---

## 12. Do Not Forget the Design

The design must not exist only in the conversation context.

Keep the important design rules inside the repository.

Use:

```text
DESIGN_SYSTEM.md
```

for global design rules.

Use:

```text
docs/design/
```

for page-specific Figma references and requirements.

Use:

```text
AGENTS.md
```

for these permanent implementation instructions.

Whenever you start a new UI task, read these files before making UI changes.

---

## FINAL RULE

**Do not make the UI "look similar."**

Implement the Figma design as accurately as possible.

If the Figma design says one thing and your personal assumption says another thing, **Figma wins.**

If you cannot determine the correct design from Figma or project documentation, ask before inventing a new design.
