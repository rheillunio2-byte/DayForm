# 🤝 Contributing to DayForm

Thank you for your interest in contributing to **DayForm**!

DayForm is a personal scheduling and lifestyle planning application built to help users organize their academic responsibilities, workouts, meals, routines, and everyday activities.

Contributions help make the application more useful, reliable, accessible, and enjoyable to use.

Whether you are fixing a bug, improving the interface, developing a scheduling feature, or updating documentation, your contribution is welcome.

---

# 📌 Table of Contents

1. Getting Started
2. Development Requirements
3. Setting Up the Project
4. Types of Contributions
5. Contribution Guidelines
6. Coding Standards
7. Working with Scheduling Features
8. UI and Accessibility Guidelines
9. Reporting Bugs
10. Suggesting Features
11. Submitting Changes
12. Pull Request Checklist
13. Code of Conduct

---

# 1. Getting Started

Before contributing, familiarize yourself with DayForm and its existing features.

DayForm is designed around a unified scheduling experience that includes:

- Daily, weekly, and monthly schedules
- Academic planning
- Workout planning
- Meal scheduling
- Habits and daily routines
- Tasks and events
- Reusable schedule templates
- Schedule image export

Contributions should support the project's goal of helping users organize their time through a clear and consistent planning experience.

---

# 2. Development Requirements

Before starting development, ensure that you have the following tools installed:

- **Node.js** — JavaScript runtime
- **npm** — Package manager
- **Git** — Version control system
- **Visual Studio Code** or another code editor
- **Modern Web Browser** — For testing the application

Basic familiarity with the following technologies is recommended:

- React
- TypeScript
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- Vite
- Git and GitHub

---

# 3. Setting Up the Project

Follow these steps to prepare your local development environment.

## Step 1: Fork the Repository

Fork the DayForm repository to your own GitHub account.

Repository: [DayForm on GitHub](https://github.com/rheillunio2-byte/DayForm)

## Step 2: Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/DayForm.git
```

Replace `YOUR-USERNAME` with your GitHub username.

## Step 3: Enter the Project Directory

```bash
cd DayForm
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access DayForm.

## Step 6: Create a Branch

Create a separate branch for your contribution.

For a new feature:

```bash
git checkout -b feature/your-feature-name
```

For a bug fix:

```bash
git checkout -b fix/your-bug-name
```

Use a clear branch name that describes the purpose of your changes.

---

# 4. Types of Contributions

## 🐛 Bug Fixes

You can help improve DayForm by identifying and correcting issues such as:

- Incorrect schedule times
- Activities appearing on the wrong date
- Recurring schedule errors
- Incorrect schedule conflict detection
- Broken calendar navigation
- Incorrect image exports
- Data not persisting
- Responsive layout issues
- Broken buttons or forms

## ✨ Feature Improvements

Possible contributions include:

- Improved weekly timetable functionality
- Additional schedule customization
- Better recurring activity controls
- Improved schedule templates
- Calendar import or export
- Enhanced schedule image export
- More flexible workout routines
- Improved meal planning tools
- Additional habit tracking features
- Better task organization

## 🎨 User Interface Improvements

Contributions to the design and usability of DayForm are welcome.

Examples include:

- Improved typography and spacing
- Clearer weekly timetable layouts
- Better mobile navigation
- More accessible color contrast
- Improved empty states
- More intuitive schedule creation
- Consistent category colors
- Better keyboard navigation

## 📚 Documentation Improvements

You may also contribute by:

- Correcting documentation errors
- Improving installation instructions
- Adding usage examples
- Updating feature descriptions
- Clarifying technical limitations
- Improving the README
- Adding screenshots or demonstrations

---

# 5. Contribution Guidelines

To maintain project quality, please follow these guidelines:

1. Keep contributions relevant to DayForm.
2. Preserve existing functionality unless a change is intentional.
3. Use clear and descriptive names for variables, functions, and components.
4. Keep code organized and readable.
5. Avoid introducing unnecessary dependencies.
6. Test changes before submitting them.
7. Avoid committing generated files or unrelated changes.
8. Update documentation when a contribution changes application behavior.
9. Explain significant changes clearly in your pull request.
10. Never commit API keys, passwords, or private credentials.

---

# 6. Coding Standards

Consistency helps make DayForm easier to maintain and improve.

## React and TypeScript

- Use clear and meaningful names.
- Prefer reusable components where appropriate.
- Keep components focused on their intended responsibilities.
- Use TypeScript types and interfaces to describe data.
- Handle invalid inputs and errors gracefully.
- Avoid unnecessary duplication.
- Remove unused imports and variables.

## Styling

- Maintain consistent spacing and typography.
- Follow the project's existing design patterns.
- Keep layouts responsive.
- Avoid unnecessary CSS overrides.
- Maintain readable and organized styles.
- Consider both light and dark themes when modifying shared components.

## File Organization

Place code in appropriate directories and files.

Avoid placing unrelated application logic into one component when it can reasonably be separated into reusable modules.

---

# 7. Working with Scheduling Features

Scheduling logic is one of DayForm's most important components.

When modifying or adding scheduling functionality, ensure that:

- Start and end times are handled correctly.
- Activities appear on the correct dates.
- Weekly navigation displays the correct week.
- Recurring activities behave consistently.
- Schedule conflicts are detected accurately.
- Editing and deleting activities work as expected.
- Activities remain consistent across schedule views.
- Time-zone handling is considered where applicable.
- Flexible or unspecified times are handled appropriately.

## Weekly Timetable Guidelines

The weekly view should remain easy to read and useful for planning.

When modifying the weekly timetable:

- Preserve clear day and time labels.
- Ensure activities appear in the correct day and time slot.
- Avoid unnecessary visual clutter.
- Handle multiple activities within the same day.
- Keep category colors consistent.
- Maintain responsive behavior on smaller screens.

## Recurring Schedule Guidelines

When working with recurring activities, consider:

- Daily recurrence
- Weekly recurrence
- Weekday recurrence
- Weekend recurrence
- Custom recurrence
- Editing a single occurrence
- Editing an entire recurring series

Avoid changing unrelated occurrences when a user edits only one instance.

## Schedule Conflict Detection

Conflict detection should identify activities that overlap in time.

When improving this feature:

- Check both start and end times.
- Handle activities with different durations.
- Avoid treating activities that end exactly when another begins as overlapping.
- Provide clear feedback to users.
- Do not silently modify existing activities to resolve conflicts.

---

# 8. UI and Accessibility Guidelines

DayForm should maintain a clean, organized, and approachable interface.

When contributing UI changes:

- Prioritize usability over decoration.
- Maintain clear visual hierarchy.
- Keep schedules readable.
- Use consistent category colors.
- Avoid excessive cards and unnecessary visual clutter.
- Ensure controls are easy to identify.
- Provide helpful empty and error states.
- Maintain responsive layouts.
- Consider keyboard navigation.
- Use accessible labels for interactive elements.
- Maintain sufficient color contrast.

For major visual changes, include screenshots in your pull request.

---

# 9. Reporting Bugs

If you encounter a problem, report it through the repository's GitHub Issues section.

A useful bug report should include:

**Title:** A short description of the problem.

**Description:** Explain what happened and what you expected to happen.

**Steps to Reproduce:** Provide the steps needed to reproduce the issue.

**Expected Behavior:** Describe the correct result.

**Actual Behavior:** Describe what happened instead.

**Environment:** Include relevant information such as:

- Operating system
- Browser
- Node.js version, if applicable
- Application version or commit

**Screenshots or Examples:** Include screenshots, sample schedules, or error messages when useful.

For scheduling bugs, include the relevant dates, start times, end times, recurrence settings, and activity categories.

---

# 10. Suggesting Features

Feature suggestions are welcome.

Before submitting a suggestion:

1. Check whether a similar request already exists.
2. Explain the problem the feature addresses.
3. Describe how the feature should work.
4. Explain how it would improve DayForm.
5. Include examples or references when useful.

Suggestions should be practical and consistent with DayForm's purpose as a personal scheduling and lifestyle planner.

---

# 11. Submitting Changes

After completing your changes, review and test them before committing.

## Step 1: Check Your Changes

```bash
git status
```

## Step 2: Stage the Relevant Files

```bash
git add .
```

Only stage files that belong to your contribution.

## Step 3: Commit Your Changes

Use a clear and descriptive commit message.

```bash
git commit -m "Improve weekly schedule layout"
```

Other examples:

```bash
git commit -m "Add schedule image export"
git commit -m "Fix recurring activity handling"
git commit -m "Improve workout planner controls"
git commit -m "Update project documentation"
```

## Step 4: Push Your Branch

```bash
git push origin feature/your-feature-name
```

## Step 5: Open a Pull Request

Visit your fork on GitHub and create a pull request targeting the original DayForm repository's main branch.

---

# 12. Pull Request Checklist

Before submitting a pull request, make sure that:

- [ ] Your changes address the intended issue or feature.
- [ ] Your code follows the project's coding standards.
- [ ] Existing functionality has not been unintentionally broken.
- [ ] Scheduling behavior has been tested where applicable.
- [ ] Daily, weekly, and monthly views remain functional.
- [ ] The interface remains responsive.
- [ ] Invalid inputs and errors are handled appropriately.
- [ ] No unnecessary files or dependencies were added.
- [ ] Documentation has been updated when necessary.
- [ ] Your commit messages are clear and descriptive.
- [ ] Screenshots are included for significant UI changes.

## Pull Request Description

A good pull request should explain:

**Summary:** What did you change?

**Purpose:** Why was the change necessary?

**Implementation:** How did you implement it?

**Testing:** What did you test?

**Screenshots:** Include before-and-after screenshots for visual changes when appropriate.

Keep pull requests focused. If you are proposing several unrelated changes, consider submitting separate pull requests.

---

# 13. Code of Conduct

All contributors are expected to maintain a respectful and collaborative environment.

Please:

- Be respectful when communicating with others.
- Provide constructive feedback.
- Respect different levels of experience.
- Avoid personal attacks or inappropriate language.
- Focus discussions on improving the project.
- Be open to suggestions and revisions.

Contributions should help make DayForm more reliable, accessible, and useful for its users.

---

# 📬 Thank You for Contributing!

Thank you for taking the time to contribute to DayForm.

Every improvement, whether a scheduling enhancement, a bug fix, a UI refinement, or a documentation update, helps make the project better.

**Together, we can make planning more organized, flexible, and accessible.**

---

*DayForm — Plan your time. Build your routine. Shape your day.*