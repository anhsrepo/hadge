// Zone 5 Contribution Graph API - Vercel Function
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Zone 5 intensity colors (matching GitHub's contribution graph)
const INTENSITY_COLORS = {
  0: '#161b22',    // No Zone 5 (GitHub's empty square)
  1: '#0e4429',    // Light Zone 5 (GitHub's lightest green)
  2: '#006d32',    // Medium Zone 5 (GitHub's medium green)  
  3: '#26a641',    // Heavy Zone 5 (GitHub's dark green)
  4: '#39d353'     // Ultra Zone 5 (GitHub's darkest green)
};

async function getWorkoutData(username, repo = 'hadge') {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: username,
      repo: repo,
      path: 'workouts/2025.csv'
    });
    
    const csvContent = Buffer.from(data.content, 'base64').toString();
    return parseCSV(csvContent);
  } catch (error) {
    console.error('Error fetching workout data:', error);
    return [];
  }
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      name: values[0],
      duration: parseInt(values[2]),
      date: values[3]
    };
  });
}

function getZone5Intensity(minutes) {
  if (minutes === 0) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 45) return 3;
  return 4;
}

function generateContributionSVG(workoutData, options = {}) {
  const { 
    width = 722, 
    height = 112,
    theme = 'github',
    title = 'Zone 5 Training Contributions'
  } = options;

  // Get last 53 weeks (like GitHub)
  const weeksToShow = 53;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeksToShow * 7 - 1));

  // Group workouts by date
  const dailyMinutes = {};
  workoutData.forEach(workout => {
    const date = workout.date;
    if (!dailyMinutes[date]) dailyMinutes[date] = 0;
    dailyMinutes[date] += Math.round(workout.duration / 60);
  });

  // Generate weeks data
  const weeks = [];
  let currentDate = new Date(startDate);
  
  for (let week = 0; week < weeksToShow; week++) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const minutes = dailyMinutes[dateStr] || 0;
      const intensity = getZone5Intensity(minutes);
      
      weekData.push({
        date: new Date(currentDate),
        minutes,
        intensity,
        color: INTENSITY_COLORS[intensity]
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(weekData);
  }

  // Calculate total minutes
  const totalMinutes = Object.values(dailyMinutes).reduce((sum, mins) => sum + mins, 0);

  // Generate SVG
  let svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: #f0f6fc; }
        .subtitle { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: #7d8590; }
        .legend-text { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: #7d8590; }
      </style>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#0d1117" rx="6"/>
      
      <!-- Title -->
      <text x="16" y="25" class="title">${title}</text>
      <text x="16" y="42" class="subtitle">${totalMinutes} minutes in the last year</text>
      
      <!-- Contribution Grid -->
      <g transform="translate(16, 55)">
  `;

  // Draw month labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonth = startDate.getMonth();
  for (let week = 0; week < weeksToShow; week += 4) {
    if (weeks[week] && weeks[week][0]) {
      const monthIndex = weeks[week][0].date.getMonth();
      svg += `<text x="${week * 12}" y="10" class="legend-text">${monthNames[monthIndex]}</text>`;
    }
  }

  // Draw day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  dayLabels.forEach((label, i) => {
    if (label) {
      svg += `<text x="-8" y="${20 + i * 12}" class="legend-text" text-anchor="end">${label}</text>`;
    }
  });

  // Draw contribution squares
  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const x = weekIndex * 12;
      const y = 15 + dayIndex * 12;
      
      svg += `
        <rect x="${x}" y="${y}" width="10" height="10" rx="2" fill="${day.color}">
          <title>${day.date.toDateString()}: ${day.minutes} minutes Zone 5</title>
        </rect>
      `;
    });
  });

  // Add legend
  svg += `
        <g transform="translate(0, 105)">
          <text x="0" y="0" class="legend-text">Less</text>
          <rect x="30" y="-8" width="10" height="10" rx="2" fill="${INTENSITY_COLORS[0]}"/>
          <rect x="44" y="-8" width="10" height="10" rx="2" fill="${INTENSITY_COLORS[1]}"/>
          <rect x="58" y="-8" width="10" height="10" rx="2" fill="${INTENSITY_COLORS[2]}"/>
          <rect x="72" y="-8" width="10" height="10" rx="2" fill="${INTENSITY_COLORS[3]}"/>
          <rect x="86" y="-8" width="10" height="10" rx="2" fill="${INTENSITY_COLORS[4]}"/>
          <text x="105" y="0" class="legend-text">More</text>
        </g>
      </g>
    </svg>
  `;

  return svg;
}

export default async function handler(req, res) {
  const { username, repo = 'hadge', theme = 'github' } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const workoutData = await getWorkoutData(username, repo);
    const svg = generateContributionSVG(workoutData, { theme });
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating contribution graph:', error);
    res.status(500).json({ error: 'Failed to generate contribution graph' });
  }
} 