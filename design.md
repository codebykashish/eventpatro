# Eventify Design Specification

## 1. Purpose and Design Principles

Eventify is a university event management website for Sunway College. It allows students to discover campus programs, register for events, apply for selective programs, and track their participation.

This document is the complete design specification for the website. Implement the described design without requiring screenshots or external visual references.

The design should be:
- Clean, professional, and college-specific.
- Visually engaging but not crowded.
- Easy to scan, with a clear content hierarchy.
- Spacious, with large photographs used intentionally.
- Consistent across public, student, and administrator pages.
- Realistic to implement using React and CSS.

Do not invent new design directions or add unnecessary marketing sections. When a detail is unspecified, choose the simplest option consistent with these guidelines.

## 2. Brand Identity and Colors

The college's burgundy theme is the primary visual identity.

| Design token | Value | Usage |
|---|---|---|
| Primary burgundy | `#881421` | Logo, primary buttons, important actions |
| Secondary red | `#C12A37` | Highlights, selected states, secondary emphasis |
| Page background | `#FAF5F3` | Main warm off-white background |
| Card background | `#FFFDFC` | Event cards and forms |
| Main text | `#2C2023` | Headings and body text |
| Muted text | `#74696B` | Supporting descriptions and metadata |
| Border | `#E9DCDD` | Subtle dividers and card borders |
| Pale blush | `#F7E4E5` | Icon backgrounds and subtle section decoration |

These are the starting design tokens. Keep the overall appearance consistent with the burgundy college identity.

### Color rules

- Use `#881421` as the dominant brand color.
- Use `#C12A37` selectively, not as a competing primary color.
- Use warm off-white backgrounds rather than pure white across the entire website.
- Use pale blush for small decorative areas, not large saturated blocks.
- Use white or warm off-white text on dark burgundy backgrounds.
- Maintain readable text contrast.
- Blue and purple must not become additional brand colors.
- Avoid rainbow coloring, neon colors, and harsh gradients.

A dark burgundy overlay over a campus photograph is allowed to make white hero text readable.

## 3. Typography

Use a readable, professional sans-serif font with a warm, modern appearance.

- Use one consistent primary font throughout the website.
- Do not use Inter, Geist, or Space Grotesk.
- Use large, bold headings for major sections.
- Use medium-weight headings for event cards and subsections.
- Use regular-weight body text with comfortable line spacing.
- Use small uppercase labels sparingly above section headings.
- Use font size, weight, and spacing to create hierarchy rather than decorative effects.

Do not use overly decorative fonts for normal interface text.

## 4. Icons

Use Lucide icons throughout the application.

Examples:
- `landmark` for the college or brand mark, where appropriate.
- `calendar-days` for events and dates.
- `search` for search.
- `map-pin` for venues.
- `users-round` for participation.
- `chart-no-axes-combined` for growth.
- `user-round` for profile.
- `settings` for settings.
- `log-out` for logout.
- `menu` and `panel-left` for navigation controls.

Use consistent icon sizing and stroke weight. Do not use emojis as interface icons.

## 5. Global Layout

Use a centered content container with consistent horizontal margins.

On desktop:
- Keep the navigation and footer aligned with the main content.
- Allow the hero image to span the full viewport width.
- Give major sections generous vertical spacing.
- Keep cards aligned to a consistent grid.
- Avoid squeezing content to fit more information into one screen.

On tablet and mobile:
- Reduce horizontal padding gradually.
- Stack multi-column layouts when necessary.
- Keep text and controls readable.
- Prevent horizontal scrolling.
- Make buttons and navigation usable with touch.

Use restrained corner rounding and subtle borders. Heavy shadows are unnecessary.

---

# 6. Public Landing Page

The landing page is the public homepage. Visitors can view it without an account or without being logged in.

The page should introduce Eventify, establish its connection to Sunway College, preview upcoming events, explain the platform's value, and encourage visitors to sign up.

The page order is:

1. Navigation header.
2. Full-width campus hero.
3. Event search and browsing actions.
4. Upcoming events.
5. Why Eventify?
6. Signup call-to-action.
7. Footer.

Do not add extra sections unless explicitly approved.

## 6.1 Navigation Header

Create a slim horizontal navigation bar with a warm off-white background.

**Left side**
- A simple college-inspired landmark logo in burgundy.
- The Eventify wordmark in burgundy.

**Center**
- Home.
- Events.
- About.

**Right side**
- Search icon.
- Login link.
- Burgundy Sign Up button.

Keep the header height compact and the spacing balanced. The Sign Up button is the main visual action.

The navigation should remain visible and easy to use without taking too much vertical space. On smaller screens, collapse the links into a mobile menu.

The logo and wordmark should be simple and consistent. Do not use decorative script lettering.

## 6.2 Hero Section

The hero is the main visual focus of the landing page.

### Layout

- Full browser width.
- Approximately 380 to 460 pixels tall on a typical desktop screen.
- Large campus photograph covering the entire hero.
- Main text positioned on the left, occupying approximately 40% to 45% of the content width.
- Campus building clearly visible on the right.
- Dark burgundy overlay concentrated on the left and fading toward the right.
- A subtly curved or angled lower edge is optional, but it must not complicate the implementation.

The image should show a recognizable university campus or campus-like building. Use a suitable, optimized photograph rather than an abstract background.

### Text hierarchy

Place the following content on the left:

Small uppercase eyebrow:

`CONNECT · EXPLORE · PARTICIPATE`

Large two-line heading:

**Your Campus.**

**Our Events.**

The second line may use a lighter red such as `#C12A37` or a soft blush shade to create emphasis.

Supporting text:

“Discover workshops, seminars and programs that help you learn, grow and belong.”

Primary button:

`Explore Events →`

The heading should be the strongest text element. Keep the description to approximately two or three short lines.

### Image rotation

The hero may rotate between two or three campus or student-life photographs.

- Use subtle transitions.
- Keep the heading and call-to-action in the same position between slides.
- Show small carousel indicators near the lower edge.
- Previous and next controls are optional.
- Do not use fast animation or distracting effects.

If a carousel is too complex for the current development phase, implement one high-quality static hero image first.

---

## 6.3 Search and Browse Area

Place this section directly below the hero.

Use a centered horizontal layout with generous whitespace.

It contains:
- A search icon.
- A search input with the placeholder `Explore upcoming events...`.
- A burgundy Search button.
- A small visual separator or the word `or`.
- A secondary pale-blush button labeled `Browse Events`, with a calendar icon.

The search bar should be wide enough for a short query and should not stretch across the entire page.

This area should feel like a simple discovery tool, not a large search dashboard.

Public visitors may search the publicly available event preview. When an action requires an account, prompt them to log in or sign up.

## 6.4 Upcoming Events

Place the Upcoming Events section below the search area.

### Section heading

Left aligned:
- A short burgundy accent line.
- Heading: `Upcoming Events`
- Supporting sentence: `Be part of something exciting on campus.`

On the right, aligned with the heading, place a `View All →` link.

### Event card layout

Display three event cards in a single row on a typical desktop screen.

Each card includes:
1. A large landscape event poster or image at the top.
2. A small category label overlapping or sitting just below the image edge.
3. Event title.
4. Date and time, with a Lucide calendar icon.
5. Venue, with a Lucide map-pin icon.
6. A compact arrow action to open the event details.

Keep the cards visually consistent:
- Equal widths.
- Matching image aspect ratios.
- Consistent internal padding.
- Subtle borders.
- Soft corner rounding.
- Minimal or no shadow.

The image should be a prominent part of the card. The title should be easy to scan, and metadata should remain smaller but readable.

On tablets, reduce the number of cards per row if necessary. On mobile, stack cards vertically or use a simple horizontal list only if it remains easy to use.

Use real event data once the backend is connected. Do not retain fictional event details in the finished application.

---

# 7. Why Eventify? Section

This section explains the purpose and value of Eventify. It must be a spacious, image-led section rather than a compact row of small icons.

## 7.1 Section Introduction

At the top, align the content to the left.

Use this hierarchy:

1. A short horizontal burgundy line.
2. Small uppercase label: `WHY EVENTIFY?`
3. Large heading: `More Events. More Opportunities.`
4. A short explanatory paragraph.

Suggested paragraph:

“Eventify brings campus programs into one place. Discover workshops, seminars, cultural festivals and competitions, then keep track of the opportunities you take part in throughout your college experience.”

The heading should be large and prominent. The paragraph should have a comfortable maximum width of approximately 800 pixels and use muted charcoal text.

Do not center the entire section or place the introduction inside a card.

## 7.2 Main Three-Column Layout

Under the introduction, create **three spacious columns of equal visual importance**.

On desktop, the three columns sit side by side in one horizontal row.

Each column occupies roughly one-third of the available content width. Use generous horizontal gaps. Thin, pale vertical dividers may separate the columns, but they must not dominate the design.

**Every column follows exactly this order:**

1. A pale-blush circular icon background.
2. A burgundy Lucide icon inside the circle.
3. A heading.
4. A short description.
5. A large landscape photograph.

The icon and text must be above the image. The image must not sit beside the text.

### Column 1: Discover Events

**Icon:** `calendar-days`

**Heading:** `Discover Events`

**Description:**

“Explore campus workshops, seminars, cultural festivals and competitions in one place. Find programs that match your interests.”

**Image:** A university campus building, college grounds, or a campus event venue.

### Column 2: Participate

**Icon:** `users-round`

**Heading:** `Participate`

**Description:**

“Register for open events, apply for selective programs, and stay informed about the activities you want to join.”

**Image:** Students participating in a campus program, collaborating, or engaging in a university activity.

### Column 3: Grow

**Icon:** `chart-no-axes-combined`

**Heading:** `Grow`

**Description:**

“Build skills, meet people with shared interests, and make the most of the opportunities available during college.”

**Image:** A student working on a project, studying in a campus environment, or preparing for an academic or extracurricular activity.

## 7.3 Column Dimensions and Spacing

This section must not be compressed to fit into a short strip.

Use these desktop guidelines:
- Three equal-width columns.
- A circular icon background approximately 88 to 100 pixels in diameter.
- A clearly visible heading beneath the icon.
- A description approximately two to four lines long, depending on the column width.
- A large landscape image approximately 360 to 410 pixels wide and 200 to 230 pixels tall when the available desktop width permits.
- Consistent image dimensions across all three columns.
- A small, consistent corner radius on photographs.
- Generous spacing between the introduction and the columns.
- Comfortable spacing between icons, headings, descriptions, and photographs.
- Enough bottom padding to distinguish the section from the next one.

These measurements are guides, not rigid dimensions. Adjust them proportionally for the viewport while preserving the spacious appearance.

Do not:
- Shrink the photographs into thumbnails.
- Put the icon beside the heading and description.
- Put all three icons in a small horizontal row with the text squeezed underneath.
- Turn the three columns into decorative bento cards.
- Put a separate large background card behind each column.
- Add unnecessary buttons under every description.
- Add extra columns, statistics, or features.

The photographs should be visually substantial and help the visitor understand the purpose of each column.

## 7.4 Responsive Behavior

On desktop, preserve the three-column arrangement.

On tablets, reduce the column gaps and image widths while keeping the text readable.

On mobile, stack the columns vertically. Each column should retain its complete structure: icon, heading, description, and large image.

Do not remove the images on mobile simply to save space.

---

# 8. Signup Call-to-Action

Place a prominent signup section after Why Eventify? and before the footer.

Use a wide burgundy panel with restrained styling.

Include:
- Heading: `Ready to get started?`
- Supporting text: `Sign up now and never miss out on campus events.`
- Button: `Sign Up Free →`
- Optional subtle campus illustration or campus photograph on the right side.

Keep the text on the left and the button clearly visible. A subtle campus image may occupy the right portion without competing with the text.

Use `#881421` as the dominant background color and light text for contrast. A restrained tonal variation is allowed, but avoid harsh gradients.

The button must navigate to the signup page.

Do not add fake testimonials, counters, pricing plans, or additional promotional cards.

---

# 9. Footer and College Contact Details

The footer should be light, clean, and college-specific.

### Main footer row

**Left:**
- Eventify logo and wordmark.
- Short tagline: `A smarter way to experience campus events.`

**Center:**
- Home.
- Events.
- About.
- Contact.

**Right:**
- Social media icons only for real links supplied by the project owner.

### Bottom row

Include:
- Copyright notice.
- Sunway College identification and location, using verified details.

Keep the bottom row separated by a subtle border.

### Contact information

The Contact page or section must provide a place for:
- Phone number.
- Email address.
- College location.
- A contact form, if included in the agreed requirements.

Use a simple two-column layout on desktop: contact details on one side and the form on the other.

Do not invent phone numbers, email addresses, or social media accounts. If details have not been supplied, leave clearly identified configuration placeholders for the developer rather than displaying fake contact information as real.

Preserve the copyright area and do not omit the college identity from the footer.

---

# 10. Events Listing Page

The Events page is separate from the landing page.

It should contain:
- A clear page heading.
- Search input.
- Category filter.
- Relevant event-status or date filters.
- A grid of reusable event cards.
- Appropriate loading, empty, and error states.

Group search and filters together above the event list. Do not crowd the page with excessive filter controls.

Use the same event card design as the landing page, adjusted only where more space is required.

When a visitor attempts an action requiring authentication, direct them to login or signup.

---

# 11. Event Details and Registration

The event details page should present one program clearly.

Display:
- Event poster.
- Title.
- Category.
- Description.
- Date and time.
- Venue.
- Registration deadline.
- Capacity or availability when relevant.
- Registration type.
- Current registration or application status where appropriate.
- A prominent registration action.

### Registration modal

Do not display the registration form permanently on the event page.

When an authenticated student clicks Register Now or Apply:
1. Open a modal overlay.
2. Display the required registration questions.
3. Show clear labels and validation messages.
4. Provide Submit and Cancel actions.
5. Close the modal only according to the interaction design and submission result.
6. Show confirmation only after the server reports success.

If a visitor is not logged in, direct them to login or signup before allowing registration.

The modal should have a clear heading, a close button, a scrollable body if needed, and a visible submit action. On mobile, it may occupy most of the viewport.

Do not create a complex full-screen form builder or an unnecessarily complicated modal.

---

# 12. Login and Signup Pages

Use a full-screen two-column layout on desktop.

### Left panel

- Eventify branding.
- A welcoming heading.
- A short explanation of the platform.
- A suitable campus or student-life photograph, or a restrained burgundy image treatment.

### Right panel

- The login or signup form.
- Clearly labeled fields.
- Validation messages.
- Primary submit button.
- A link to switch between login and signup.

The form should be comfortably sized and not squeezed into a narrow column.

Signup fields must follow `requirement.md`, including first name, last name, student ID, college email, password, and confirm password.

The college email domain is `@sunway.edu.np`.

Include a password strength indicator and clear password requirements. Do not add social login or unrequested authentication methods.

On mobile, stack the panels and prioritize the form.

---

# 13. Student Dashboard and Profile

Authenticated students should see a consistent application layout.

## Sidebar

Include:
- Profile picture and student identity.
- Dashboard.
- Events.
- Other agreed student navigation options.
- Logout.

When a page is opened, the sidebar should be collapsed to icons to preserve content width. On pointer hover, it should expand to show icons and text labels.

Also support keyboard focus and touch interactions for devices without hover.

Keep the main content aligned correctly in both sidebar states.

## Student profile tabs

The profile should contain three distinct content tabs:

- Attended.
- Registered.
- Applied.

The tabs should work like separate content categories on a social profile, but they must use Eventify's own branding and design.

### Attended

Show event cards for programs the student has actually attended.

- Reuse the same event card design used on the Events page.
- Only include events whose attendance record confirms the student was present.
- Do not treat registration alone as attendance.

### Registered

Show events where the student has a confirmed registration or has been selected and is expected to attend.

- Include upcoming programs.
- Show the relevant registration status when useful.
- Do not include programs that are merely pending applications.

### Applied

Show programs the student has applied to, along with their current application status.

Possible statuses include Pending, Selected, and Rejected, according to the backend data.

Do not mix pending applications with confirmed registrations or attended events.

Keep the three tabs visually distinct, simple, and easy to switch between.

---

# 14. Administrator Dashboard

The administrator interface should share the same colors, typography, icons, spacing, and component style as the student interface.

Use a collapsible sidebar that minimizes to icons and expands on hover, with keyboard and touch support.

Include only agreed administrative sections:
- Dashboard.
- Events.
- Registrations and applications.
- Attendance.
- Feedback.
- User management, where required.
- Logout.

Use readable tables, lists, forms, and status labels. Do not introduce complex analytics or extra dashboard cards without a real requirement.

Role authorization must be enforced by the backend, not just by hiding frontend controls.

---

# 15. Reusable Event Cards

Build one reusable event card component for use on:
- Landing page.
- Events listing page.
- Student profile tabs.
- Other approved event lists.

Maintain a consistent visual identity across all uses.

Standardize:
- Image aspect ratio.
- Image crop behavior.
- Category label.
- Title style.
- Date and time.
- Venue.
- Spacing and padding.
- Corner radius.
- Action placement.

The available action can change by context, but the card structure should remain recognizable.

---

# 16. Explicitly Avoid These Design Choices

Do not use:
- Harsh gradients.
- Rainbow coloring or neon colors.
- Purple-and-black themes.
- Pure white as the dominant page background.
- Heavy drop shadows.
- Liquid-glass effects.
- Emojis as interface icons.
- Decorative bento grids.
- Fake testimonials or invented user statistics.
- Fake social media links.
- Three-tier pricing sections.
- Terminal-window decorations.
- Excessive radial orbs or dot grids.
- Decorative sparkle icons or animated arrows.
- Colored left stripes on every card.
- Excessive animation.
- Overly rounded pills for every element.
- Unnecessary cards around content that works better in an open layout.
- Tiny photographs in sections that require large images.
- Overcrowded text or squeezed columns.
- Extra marketing sections that are not described in this specification.
- Unsupported claims about payments, support, or other features Eventify does not provide.

Avoid the marketing phrase structure “It's not X, it's Y” and avoid em dashes in interface and marketing copy.

---

# 17. Implementation Guidelines

- Build a real responsive website, not a static mockup.
- Use reusable React components.
- Centralize colors, spacing, border, and radius values.
- Use CSS Grid and Flexbox where appropriate.
- Use Lucide icons consistently.
- Optimize photographs and preserve consistent image aspect ratios.
- Use real backend data once the relevant APIs are available.
- Keep forms accessible and provide clear feedback.
- Do not add dependencies only for decorative effects.
- Do not introduce features that are not in `requirement.md`.

Suggested CSS variables:

```css
:root {
  --color-primary: #881421;
  --color-secondary: #C12A37;
  --color-background: #FAF5F3;
  --color-surface: #FFFDFC;
  --color-text: #2C2023;
  --color-text-muted: #74696B;
  --color-border: #E9DCDD;
  --color-blush: #F7E4E5;

  --radius-card: 10px;
  --radius-button: 8px;

  --space-section: 80px;
  --content-max-width: 1280px;
}
```

These values are starting points. Use responsive adjustments rather than forcing fixed dimensions on every screen.

---

# 18. Final Implementation Priorities

Implement the design in this order:

1. Establish shared colors, typography, spacing, and reusable components.
2. Build the public navigation and campus hero.
3. Build the search area and upcoming event cards.
4. Build the three-column Why Eventify? section exactly as specified.
5. Add the signup call-to-action and college-specific footer.
6. Apply the shared design system to login and signup.
7. Apply the shared design system to student and administrator dashboards.
8. Implement responsive behavior and accessibility.
9. Test the layout at desktop, tablet, and mobile sizes.

The most important design requirement is that the public landing page feels like a polished Sunway College event platform, with a burgundy campus hero, clean event cards, and a spacious three-column Why Eventify? section containing an icon, heading, description, and large image in each column.

Preserve this direction throughout implementation. Do not replace it with a compact icon row or an unrelated template.
