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
      "⬜" # No Zone 5 activity
    when 1..20
      "🟩" # Light Zone 5 (1-20 min)
    when 21..45
      "🟢" # Medium Zone 5 (21-45 min)
    else
      "🔥" # Heavy Zone 5 (45+ min)
    end
  end

  def get_last_5_days_data
    # Get last 5 days including today
    today = Date.today
    last_5_days = (0...5).map { |i| today - i }.reverse
    
    # Group activities by date and sum Zone 5 minutes
    daily_minutes = {}
    
    activities.each do |activity|
      date = Date.parse(activity["Date"])
      next unless last_5_days.include?(date)
      
      daily_minutes[date] ||= 0
      # Convert seconds to minutes
      daily_minutes[date] += (activity["Duration"].to_f / 60).round
    end

    last_5_days.map do |date|
      minutes = daily_minutes[date] || 0
      {
        date: date,
        minutes: minutes,
        intensity: get_zone5_intensity(minutes)
      }
    end
  end

  def generate_contribution_graph
    days_data = get_last_5_days_data
    
    # Just the contribution squares like GitHub
    squares = days_data.map { |day| day[:intensity] }.join(" ")
    
    # Add total for reference
    total_minutes = days_data.sum { |day| day[:minutes] }
    "#{squares}\n\n#{total_minutes} minutes Zone 5 this week"
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