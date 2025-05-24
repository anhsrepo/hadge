# CLAUDE.md

This file provides guidance to Claude Code for both general best practices and project-specific instructions.

## General Best Practices from Anthropic

### Test-Driven Development (TDD) Workflow
When working on features that can be verified with tests:

1. **Write tests first** - Create tests based on expected input/output pairs before implementation
2. **Verify tests fail** - Run tests to confirm they fail (no implementation yet)
3. **Commit tests** - Commit the test files when satisfied
4. **Implement code** - Write code to pass the tests without modifying the tests
5. **Iterate until passing** - Keep running tests and adjusting code until all pass
6. **Verify implementation** - Check that the solution isn't overfitting to tests
7. **Commit implementation** - Commit the code once all tests pass

### Visual Development Workflow
When implementing visual designs or UI features:

1. **Enable screenshots** - Use Playwright/Puppeteer MCP or manual screenshots
2. **Get visual target** - Receive mockup via image paste, drag-drop, or file path
3. **Implement initial code** - Create first version based on the mockup
4. **Take screenshot** - Capture current implementation
5. **Compare and iterate** - Compare with mockup, adjust code, screenshot again
6. **Repeat until match** - Continue iterating until visual match achieved
7. **Commit when satisfied** - Commit the final implementation

Key principle: Claude performs best with clear targets (tests, visual mocks, expected outputs) to iterate against.

## Project-Specific Instructions

### Overview
Zone 5 Contributions - A GitHub-style contribution graph for high-intensity workout tracking

### Commands to run
- Build: `vercel`
- Deploy to production: `vercel --prod`
- Local development: `vercel dev`
- Check deployment status: `vercel ls`

### Project structure
- `/api/zone5-contributions.js` - Main API endpoint that generates SVG
- `/public/index.html` - Display page with GitHub-style container
- `/workouts/YYYY.csv` - Year-based workout data files (auto-updated via GitHub Actions)
- `/.github/workflows/sync-health-data.yml` - GitHub Action that syncs from health repo

### How the System Works
1. **Health Data Source**: A separate private "health" repository stores Apple Health exports
2. **Daily Sync**: GitHub Action runs daily to fetch and process health data
3. **Zone 5 Detection**: High-intensity workouts are identified and mapped to categories
4. **CSV Storage**: Processed data is stored in year-based CSV files (e.g., workouts/2025.csv)
5. **API Endpoint**: The Vercel API reads CSV files and generates the contribution graph

### Zone 5 Workout Categories
The system recognizes these high-intensity activities:
- Incline Treadmill
- Stairmaster
- Arc Trainer
- Running
- Cycling
- HIIT
- Others

### API Parameters
- `username` - GitHub username to fetch workout data from
- `repo` - Repository name (default: 'hadge')
- `theme` - Color theme: 'dark' or 'light'

### SVG Layout Details
- Cell size: 10x10 pixels
- Cell gap: 3 pixels
- Left padding: 30px (for day labels)
- Top padding: 40px (for title and month labels)
- Show only Mon, Wed, Fri labels
- Position legend at bottom right
- No rounded corners on cells
- Include title text showing total Zone 5 minutes

### HTML Container
- Max width: 896px
- Background: #161b22 (dark theme)
- Border: 1px solid #30363d
- Border radius: 6px
- Padding: 16px

### Deployment Notes
- Cache SVG responses for 1 hour
- Always deploy with `vercel --prod` for production
- Latest production URL: https://hadge-1vchkw669-anhagapes-projects.vercel.app

### Apple Health Integration
The existing system uses a two-repository approach:
1. **Health Repository**: Private repo where Apple Health exports are stored
2. **Hadge Repository**: Public repo that displays the contribution graph
3. **GitHub Action**: Syncs data daily from health repo to hadge repo

To add new workouts:
1. Export data from Apple Health to the private health repository
2. The sync-health-data.yml workflow will automatically process it
3. Or trigger the workflow manually from GitHub Actions tab