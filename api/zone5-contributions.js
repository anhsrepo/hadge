import fetch from 'node-fetch';

const THEMES = {
  dark: {
    background: '#0d1117',
    text: '#c9d1d9',
    subtitleColor: '#8b949e',
    colors: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
  },
  light: {
    background: '#ffffff',
    text: '#24292e',
    subtitleColor: '#586069',
    colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  }
};

async function getWorkoutData(username, repo) {
  // Try to fetch workouts from the year-based CSV files
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1]; // Check current and previous year
  
  let allWorkouts = [];
  
  for (const year of years) {
    const csvUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/workouts/${year}.csv`;
    
    try {
      const response = await fetch(csvUrl);
      if (response.ok) {
        const csvText = await response.text();
        const workouts = parseCSV(csvText);
        allWorkouts = allWorkouts.concat(workouts);
      }
    } catch (error) {
      console.error(`Error fetching ${year} workout data:`, error);
    }
  }
  
  // If no year-based files found, try the root workouts.csv
  if (allWorkouts.length === 0) {
    const csvUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/workouts.csv`;
    
    try {
      const response = await fetch(csvUrl);
      if (response.ok) {
        const csvText = await response.text();
        return parseCSV(csvText);
      }
    } catch (error) {
      console.error('Error fetching workout data:', error);
    }
  }
  
  return allWorkouts;
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
  const { theme = 'dark' } = options;
  const themeConfig = THEMES[theme] || THEMES.dark;
  const INTENSITY_COLORS = themeConfig.colors;

  // Calculate date range
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  // Start from the beginning of the week (Sunday)
  const startDate = new Date(oneYearAgo);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Group workouts by date
  const dailyMinutes = {};
  
  // Define high-intensity workout types that count as Zone 5
  const zone5Workouts = [
    'incline treadmill', 
    'stairmaster', 
    'arc trainer', 
    'running',
    'cycling',
    'hiit',
    'zone 5'
  ];
  
  workoutData.forEach(workout => {
    const date = workout.date.split(' ')[0];
    const totalMinutes = Math.round(workout.duration / 60);
    const workoutName = workout.name.toLowerCase();
    
    // Check if this is a Zone 5 workout
    const isZone5 = zone5Workouts.some(type => workoutName.includes(type));
    
    if (isZone5) {
      dailyMinutes[date] = (dailyMinutes[date] || 0) + totalMinutes;
    }
  });

  // Generate weeks array
  const weeks = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= today) {
    const week = [];
    for (let day = 0; day < 7; day++) {
      if (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const minutes = dailyMinutes[dateStr] || 0;
        const intensity = getZone5Intensity(minutes);
        
        week.push({
          date: new Date(currentDate),
          minutes,
          intensity,
          color: INTENSITY_COLORS[intensity]
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (week.length > 0) {
      weeks.push(week);
    }
  }

  // Calculate total minutes
  const totalMinutes = Object.values(dailyMinutes).reduce((sum, mins) => sum + mins, 0);

  // SVG dimensions
  const cellSize = 10;
  const cellGap = 3;
  const leftPadding = 30; // Space for day labels
  const topPadding = 40; // Space for title and month labels
  const width = leftPadding + (weeks.length * (cellSize + cellGap)) + 20;
  const height = topPadding + (7 * (cellSize + cellGap)) + 40; // Extra space for legend

  // Generate SVG
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
      .month { font-size: 12px; fill: ${themeConfig.subtitleColor}; }
      .wday { font-size: 11px; fill: ${themeConfig.subtitleColor}; text-anchor: start; }
      .title { font-size: 14px; fill: ${themeConfig.text}; font-weight: 600; }
    </style>`;
  
  // Add title
  svg += `<text x="${leftPadding}" y="16" class="title">${totalMinutes} minutes in Zone 5 over the past year</text>`;

  // Month labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;
  
  weeks.forEach((week, weekIndex) => {
    if (week[0]) {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        const x = leftPadding + (weekIndex * (cellSize + cellGap));
        svg += `<text x="${x}" y="32" class="month">${monthNames[month]}</text>`;
        lastMonth = month;
      }
    }
  });

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 1; i < 7; i += 2) { // Show Mon, Wed, Fri
    const y = topPadding + (i * (cellSize + cellGap)) + 8;
    svg += `<text x="0" y="${y}" class="wday">${dayLabels[i].slice(0, 3)}</text>`;
  }

  // Contribution squares
  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const x = leftPadding + (weekIndex * (cellSize + cellGap));
      const y = topPadding + (dayIndex * (cellSize + cellGap));
      
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${day.color}">
        <title>${day.date.toDateString()}: ${day.minutes} minutes Zone 5</title>
      </rect>`;
    });
  });

  // Legend
  const legendY = height - 20;
  const legendX = width - 200;
  
  svg += `<g transform="translate(${legendX}, ${legendY})">
    <text x="0" y="10" style="font-size: 11px; fill: ${themeConfig.subtitleColor};">Less</text>`;
  
  INTENSITY_COLORS.forEach((color, i) => {
    svg += `<rect x="${30 + i * 14}" y="0" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
  });
  
  svg += `<text x="${30 + 5 * 14}" y="10" style="font-size: 11px; fill: ${themeConfig.subtitleColor};">More</text>
  </g>`;

  svg += '</svg>';
  return svg;
}

export default async function handler(req, res) {
  const { username, repo = 'hadge', theme = 'dark' } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const workoutData = await getWorkoutData(username, repo);
    const svg = generateContributionSVG(workoutData, { theme });
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating contribution graph:', error);
    res.status(500).json({ error: 'Failed to generate contribution graph' });
  }
}