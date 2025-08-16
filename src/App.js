// src/App.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Download, TrendingUp, TrendingDown, Church, Settings } from 'lucide-react';
import './App.css';

const ChurchAttendanceAnalyzer = () => {
  const [churchData, setChurchData] = useState([]);
  const [selectedChurches, setSelectedChurches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [backendUrl, setBackendUrl] = useState(process.env.REACT_APP_BACKEND_URL || '');
  const [useBackend, setUseBackend] = useState(!!process.env.REACT_APP_BACKEND_URL);
  const [viewMode, setViewMode] = useState('attendance');
  const [showSettings, setShowSettings] = useState(false);

  // Enhanced sample data with real church information for immediate functionality
  const generateSampleData = () => {
    const realChurches = [
      { name: "Life.Church", location: "Edmond, OK", pastor: "Craig Groeschel" },
      { name: "Church of the Highlands", location: "Birmingham, AL", pastor: "Chris Hodges" },
      { name: "CCV (Christ's Church of the Valley)", location: "Peoria, AZ", pastor: "Ashley Wooldridge" },
      { name: "Lakewood Church", location: "Houston, TX", pastor: "Joel Osteen" },
      { name: "North Point Ministries", location: "Alpharetta, GA", pastor: "Andy Stanley" },
      { name: "Christ Fellowship Church", location: "Palm Beach Gardens, FL", pastor: "Todd Mullins" },
      { name: "Saddleback Church", location: "Lake Forest, CA", pastor: "Andy Wood" },
      { name: "Gateway Church", location: "Southlake, TX", pastor: "Robert Morris" },
      { name: "Crossroads Church", location: "Cincinnati, OH", pastor: "Brian Tome" },
      { name: "Eagle Brook Church", location: "Centerville, MN", pastor: "Jason Strand" },
      { name: "Southeast Christian Church", location: "Louisville, KY", pastor: "Kyle Idleman" },
      { name: "Fellowship Church", location: "Grapevine, TX", pastor: "Ed Young" },
      { name: "Central Church", location: "Henderson, NV", pastor: "Jud Wilhite" },
      { name: "Bayside Church", location: "Roseville, CA", pastor: "Ray Johnston" },
      { name: "Second Baptist Church", location: "Houston, TX", pastor: "H. Edwin Young" },
      { name: "Prestonwood Baptist Church", location: "Plano, TX", pastor: "Jack Graham" },
      { name: "The Church of Eleven22", location: "Jacksonville, FL", pastor: "Joby Martin" },
      { name: "Lakepointe Church", location: "Rockwall, TX", pastor: "Josh Howerton" },
      { name: "Harvest Christian Fellowship", location: "Riverside, CA", pastor: "Greg Laurie" },
      { name: "NewSpring Church", location: "Anderson, SC", pastor: "Perry Noble" },
      { name: "The Summit Church", location: "Durham, NC", pastor: "J.D. Greear" },
      { name: "Flatirons Community Church", location: "Lafayette, CO", pastor: "Jim Burgen" },
      { name: "Houston's First Baptist Church", location: "Houston, TX", pastor: "Gregg Matte" },
      { name: "Willow Creek Community Church", location: "South Barrington, IL", pastor: "Dave Dummitt" },
      { name: "Elevation Church", location: "Charlotte, NC", pastor: "Steven Furtick" }
    ];

    return realChurches.map((church, index) => {
      const baseRanking = index + 1;
      const baseAttendance = 50000 - (baseRanking * 1200);
      
      const data = [];
      for (let year = 2015; year <= 2024; year++) {
        let yearMultiplier = 1;
        
        if (church.name.includes("CCV") || church.name.includes("Eleven22") || church.name.includes("Eagle Brook")) {
          yearMultiplier = 0.7 + (year - 2015) * 0.08;
        } else if (church.name.includes("Willow Creek") || church.name.includes("Saddleback")) {
          yearMultiplier = 1.2 - (year - 2015) * 0.03;
        } else {
          yearMultiplier = 0.9 + Math.sin((year - 2015) * 0.5) * 0.15;
        }
        
        if (year === 2020) yearMultiplier *= 0.7;
        if (year === 2021) yearMultiplier *= 0.8;
        if (year === 2022) yearMultiplier *= 1.1;
        
        const attendance = Math.max(1000, Math.floor(baseAttendance * yearMultiplier + (Math.random() - 0.5) * 2000));
        
        data.push({
          year,
          attendance,
          ranking: baseRanking
        });
      }
      
      return {
        name: church.name,
        location: church.location,
        pastor: church.pastor,
        data
      };
    });
  };

  useEffect(() => {
    const sampleData = generateSampleData();
    
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    years.forEach(year => {
      const yearData = sampleData.map(church => ({
        church,
        attendance: church.data.find(d => d.year === year)?.attendance || 0
      })).sort((a, b) => b.attendance - a.attendance);
      
      yearData.forEach((item, index) => {
        const dataPoint = item.church.data.find(d => d.year === year);
        if (dataPoint) {
          dataPoint.ranking = index + 1;
        }
      });
    });
    
    setChurchData(sampleData);
    setScrapingStatus('Sample data loaded. Configure backend URL and click "Scrape Live Data" for real data.');
  }, []);

  const scrapeChurchData = async () => {
    setLoading(true);
    setScrapingStatus('Initializing scraper...');
    
    try {
      if (useBackend && backendUrl) {
        setScrapingStatus('Connecting to Railway backend...');
        
        const response = await fetch(`${backendUrl}/api/scrape-all`);
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.consolidatedData && result.consolidatedData.length > 0) {
          setChurchData(result.consolidatedData);
          setScrapingStatus(`✅ Successfully loaded ${result.consolidatedData.length} churches with multi-year data from Railway backend!`);
          
          if (result.errors && result.errors.length > 0) {
            setScrapingStatus(prev => prev + ` (${result.errors.length} years had errors)`);
          }
        } else {
          throw new Error('No data returned from backend');
        }
        
      } else {
        setScrapingStatus('❌ No backend configured. Browser-based scraping is blocked by CORS. Please configure Railway backend URL.');
      }
      
    } catch (error) {
      setScrapingStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredChurches = churchData.filter(church =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.pastor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleChurchSelection = (churchName) => {
    setSelectedChurches(prev =>
      prev.includes(churchName)
        ? prev.filter(name => name !== churchName)
        : [...prev, churchName]
    );
  };

  const chartData = () => {
    if (selectedChurches.length === 0) return [];
    
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    return years.map(year => {
      const dataPoint = { year };
      
      selectedChurches.forEach(churchName => {
        const church = churchData.find(c => c.name === churchName);
        if (church) {
          const yearData = church.data.find(d => d.year === year);
          if (yearData) {
            dataPoint[churchName] = viewMode === 'attendance' ? yearData.attendance : yearData.ranking;
          }
        }
      });
      
      return dataPoint;
    });
  };

  const getChurchTrend = (church) => {
    if (church.data.length < 2) return null;
    
    const latest = church.data[church.data.length - 1];
    const previous = church.data[church.data.length - 2];
    
    if (viewMode === 'attendance') {
      return latest.attendance > previous.attendance ? 'up' : 'down';
    } else {
      return latest.ranking < previous.ranking ? 'up' : 'down';
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Church className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Church Attendance Analyzer (2015-2024)</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={scrapeChurchData}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Scraping...' : 'Scrape Live Data'}
              </button>
            </div>
          </div>
          
          {scrapingStatus && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-700 whitespace-pre-line">{scrapingStatus}</p>
            </div>
          )}

          {showSettings && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-3">🚀 Railway Backend Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">
                    Backend URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-backend.railway.app"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useBackend"
                    checked={useBackend}
                    onChange={(e) => setUseBackend(e.target.checked)}
                    className="w-4 h-4 text-yellow-600"
                  />
                  <label htmlFor="useBackend" className="text-sm text-yellow-700">
                    Use Railway backend for live data scraping
                  </label>
                </div>
                <p className="text-xs text-yellow-600">
                  Deploy the provided Node.js backend to Railway, then enter the URL above to get real live data!
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search churches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('attendance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'attendance' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => setViewMode('ranking')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'ranking' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Ranking
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredChurches.map((church, index) => {
                  const isSelected = selectedChurches.includes(church.name);
                  const trend = getChurchTrend(church);
                  
                  return (
                    <div
                      key={church.name}
                      onClick={() => toggleChurchSelection(church.name)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{church.name}</h3>
                          <p className="text-sm text-gray-600">{church.location}</p>
                          <p className="text-xs text-gray-500">{church.pastor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {trend && (
                            trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )
                          )}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">
                  {viewMode === 'attendance' ? 'Attendance Trends' : 'Ranking Trends'} 
                  {selectedChurches.length > 0 && ` (${selectedChurches.length} churches selected)`}
                </h2>
                
                {selectedChurches.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Church className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Select churches from the list to view trends</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={450}>
                    <LineChart data={chartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: viewMode === 'attendance' ? 'Attendance' : 'Ranking', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }}
                        reversed={viewMode === 'ranking'}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          viewMode === 'attendance' 
                            ? `${value.toLocaleString()} attendees`
                            : `Rank #${value}`,
                          name
                        ]}
                        labelFormatter={(year) => `Year: ${year}`}
                      />
                      <Legend />
                      {selectedChurches.map((churchName, index) => (
                        <Line
                          key={churchName}
                          type="monotone"
                          dataKey={churchName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedChurches.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedChurches.map(churchName => {
                const church = churchData.find(c => c.name === churchName);
                if (!church || church.data.length === 0) return null;
                
                const latest = church.data[church.data.length - 1];
                const earliest = church.data[0];
                const attendanceGrowth = viewMode === 'attendance' 
                  ? ((latest.attendance - earliest.attendance) / earliest.attendance * 100).toFixed(1)
                  : ((earliest.ranking - latest.ranking)).toFixed(0);
                
                return (
                  <div key={churchName} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{church.name}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Current {viewMode}: {viewMode === 'attendance' 
                          ? latest.attendance.toLocaleString() 
                          : `#${latest.ranking}`}
                      </p>
                      <p className={`font-medium ${
                        (viewMode === 'attendance' ? attendanceGrowth > 0 : attendanceGrowth > 0) 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {viewMode === 'attendance' 
                          ? `${attendanceGrowth > 0 ? '+' : ''}${attendanceGrowth}% growth`
                          : `${attendanceGrowth > 0 ? '+' : ''}${attendanceGrowth} rank change`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurchAttendanceAnalyzer;