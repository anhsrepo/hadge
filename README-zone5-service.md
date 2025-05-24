# Zone 5 Contribution Graph Service

🔥 Dynamically generated Zone 5 training contribution graphs for your GitHub profile!

## 🚀 Usage

Once deployed to Vercel, you can embed your Zone 5 contribution graph anywhere:

### In README.md:
```markdown
![Zone 5 Contributions](https://your-app.vercel.app/api/zone5-contributions?username=anhsrepo)
```

### In Gist:
```markdown
![Zone 5 Training Graph](https://your-app.vercel.app/api/zone5-contributions?username=anhsrepo&theme=github)
```

## 📊 Examples

### Basic Usage:
```
https://your-app.vercel.app/api/zone5-contributions?username=anhsrepo
```

### With Custom Repository:
```
https://your-app.vercel.app/api/zone5-contributions?username=anhsrepo&repo=hadge
```

### With Theme:
```
https://your-app.vercel.app/api/zone5-contributions?username=anhsrepo&theme=dark
```

## 🎨 Features

- **Authentic GitHub Styling** - Looks exactly like GitHub's contribution graph
- **Real-time Data** - Reads directly from your workout CSV files
- **Responsive SVG** - Scales perfectly on any device
- **Hover Tooltips** - Shows exact minutes for each day
- **Caching** - 1-hour cache for optimal performance

## 🛠️ Deployment

### Deploy to Vercel:

1. **Fork this repository**
2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your forked repository
   - Add environment variable: `GITHUB_TOKEN` (your GitHub personal access token)
   - Deploy!

3. **Use your API:**
   ```
   https://your-app-name.vercel.app/api/zone5-contributions?username=yourusername
   ```

## 🔧 Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `username` | string | **Required.** Your GitHub username | - |
| `repo` | string | Repository containing workout data | `hadge` |
| `theme` | string | Color theme | `github` |

## 🎯 Perfect for:

- **GitHub Profile READMEs**
- **Pinned Gists**
- **Personal Websites**
- **Fitness Documentation**
- **Team Dashboards**

## 🌟 Zone 5 Intensity Levels:

- **Gray (0 min)** - Rest day
- **Light Green (1-15 min)** - Light Zone 5 session
- **Medium Green (16-30 min)** - Solid Zone 5 workout
- **Dark Green (31-45 min)** - Intense Zone 5 training
- **Darkest Green (45+ min)** - Ultra Zone 5 session

---

**Just like GitHub contributions, but for your fitness!** 💪🔥 