require 'csv'
require 'octokit'
require 'optparse'
require 'date'

class Zone5ContributionGraph
  def initialize(filepath, access_token, gist_id)
    @filepath = filepath
    @client = Octokit::Client.new(:access_token => access_token)
    @gist_id = gist_id
  end

  def activities
    @activities ||= CSV.parse(File.read(@filepath), headers: true)
  end

  def get_zone5_intensity(minutes)
    case minutes
    when 0
      "⬜" # No Zone 5 activity (like GitHub's gray)
    when 1..15
      "🟩" # Light Zone 5 (like GitHub's light green)
    when 16..30
      "🟢" # Medium Zone 5 (like GitHub's medium green)
    when 31..45
      "🔵" # Heavy Zone 5 (like GitHub's dark green)
    else
      "🟫" # Ultra Zone 5 (like GitHub's darkest green)
    end
  end

  def get_weeks_data(num_weeks = 12)
    # Get the last N weeks ending today
    today = Date.today
    start_date = today - (num_weeks * 7 - 1)
    
    # Group activities by date
    daily_minutes = {}
    activities.each do |activity|
      date = Date.parse(activity["Date"])
      next if date < start_date || date > today
      
      daily_minutes[date] ||= 0
      daily_minutes[date] += (activity["Duration"].to_f / 60).round
    end

    # Create weeks array
    weeks = []
    current_date = start_date
    
    while current_date <= today
      week_start = current_date - current_date.wday # Start of week (Sunday)
      week = []
      
      7.times do |day_offset|
        date = week_start + day_offset
        minutes = daily_minutes[date] || 0
        week << {
          date: date,
          minutes: minutes,
          intensity: get_zone5_intensity(minutes),
          in_range: date >= start_date && date <= today
        }
      end
      
      weeks << week
      current_date += 7
    end
    
    weeks
  end

  def generate_contribution_graph
    weeks_data = get_weeks_data(12) # Last 12 weeks like GitHub
    
    # Month headers
    months = []
    weeks_data.each_with_index do |week, index|
      if index == 0 || week[0][:date].month != weeks_data[index-1][0][:date].month
        months << { 
          position: index * 2, # 2 chars per week
          name: week[0][:date].strftime("%b")
        }
      end
    end
    
    # Build the graph
    graph = ""
    
    # Month headers
    month_line = " " * 7  # Space for day labels
    months.each do |month|
      month_line += " " * (month[:position] - month_line.length + 7) if month[:position] + 7 > month_line.length
      month_line += month[:name]
    end
    graph += "#{month_line}\n"
    
    # Day rows (Mon, Wed, Fri like GitHub)
    ["Mon", "Wed", "Fri"].each_with_index do |day_name, day_index|
      actual_day = [1, 3, 5][day_index] # Monday=1, Wednesday=3, Friday=5
      
      line = "#{day_name.ljust(4)} "
      weeks_data.each do |week|
        day_data = week[actual_day]
        if day_data[:in_range]
          line += "#{day_data[:intensity]} "
        else
          line += "  " # Empty space for out of range
        end
      end
      graph += "#{line}\n"
    end
    
    # Legend and total
    total_minutes = weeks_data.flatten.select { |d| d[:in_range] }.sum { |d| d[:minutes] }
    
    graph += "\n"
    graph += "Less ⬜🟩🟢🔵🟫 More       #{total_minutes} minutes Zone 5"
    
    graph
  end

  def run
    body = generate_contribution_graph
    
    gist = @client.gist(@gist_id)
    filename = gist.files[gist[:files].to_h.keys.first]
    @client.edit_gist(@gist_id, files: { "#{filename[:filename]}": { content: body }})
  end
end

filename = nil
gist_id = nil
token = nil
optparse = OptionParser.new do |opts|
  opts.banner = "Usage: ruby zone5-contribution-graph.rb [options] filename"
  opts.on("-t", "--token SECRET") { |arg| token = arg}
  opts.on("-g", "--gist GIST_ID") { |arg| gist_id = arg}

  begin
    filename = opts.parse!
  rescue OptionParser::ParseError => error
    $stderr.puts error
    $stderr.puts "(-h or --help will show valid options)"
    exit 1
  end
end

if filename && token && gist_id
  Zone5ContributionGraph.new(filename.first, token, gist_id).run
end 