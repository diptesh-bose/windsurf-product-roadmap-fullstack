import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, addDays, differenceInDays, startOfWeek, addWeeks } from 'date-fns';
import Paper from '@mui/material/Paper';
import '../styles/EnhancedGanttView.css';

const EnhancedGanttView = () => {
  const [features, setFeatures] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState(addWeeks(startOfWeek(new Date()), 4));
  const [hoveredTask, setHoveredTask] = useState(null);
  const ganttRef = useRef(null);

  // Color mapping for feature status
  const statusColors = {
    backlog: '#8c7ae6',
    in_progress: '#00b894',
    completed: '#4cd137',
    blocked: '#e84393',
    review: '#fdcb6e',
  };

  // Icon mapping for feature types
  const typeIcons = {
    bug: '🐛',
    feature: '✨',
    improvement: '⚡',
    documentation: '📝',
    security: '🔒'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch features and releases
        const [featuresRes, releasesRes] = await Promise.all([
          axios.get('/api/features'),
          axios.get('/api/releases')
        ]);

        const featuresData = featuresRes.data.map(feature => ({
          ...feature,
          startDate: new Date(feature.start_date),
          endDate: new Date(feature.end_date),
          color: statusColors[feature.status] || '#a5b1c2'
        }));
        
        // Create dependency array from feature dependencies
        const dependencyArray = [];
        featuresData.forEach(feature => {
          if (feature.dependencies) {
            feature.dependencies.forEach(depId => {
              dependencyArray.push({
                id: `${feature.id}-${depId}`,
                predecessorId: depId,
                successorId: feature.id
              });
            });
          }
        });

        setFeatures(featuresData);
        setDependencies(dependencyArray);
        setReleases(releasesRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && ganttRef.current) {
      drawDependencyLines();
    }
  }, [loading, features, dependencies]);

  const generateDates = () => {
    const dates = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  };

  const renderHeader = () => {
    const dates = generateDates();
    const months = {};
    
    dates.forEach(date => {
      const monthKey = format(date, 'yyyy-MM');
      if (!months[monthKey]) {
        months[monthKey] = {
          name: format(date, 'MMMM yyyy'),
          days: 0
        };
      }
      months[monthKey].days++;
    });
    
    return (
      <div className="gantt-header">
        <div className="gantt-months">
          {Object.values(months).map(month => (
            <div
              key={month.name}
              className="gantt-month"
              style={{ width: `${month.days * 40}px` }}
            >
              {month.name}
            </div>
          ))}
        </div>
        <div className="gantt-days">
          {dates.map(date => (
            <div
              key={date.toISOString()}
              className={`gantt-day ${
                format(date, 'iii') === 'Sat' || format(date, 'iii') === 'Sun'
                  ? 'weekend'
                  : ''
              }`}
            >
              {format(date, 'd')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const drawDependencyLines = () => {
    if (!ganttRef.current) return;

    const svg = ganttRef.current.querySelector('.gantt-dependency-lines');
    if (!svg) return;

    // Clear existing lines
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    dependencies.forEach(dep => {
      const predecessor = features.find(f => f.id === dep.predecessorId);
      const successor = features.find(f => f.id === dep.successorId);

      if (!predecessor || !successor) return;

      const predBar = document.querySelector(`[data-feature-id="${predecessor.id}"]`);
      const succBar = document.querySelector(`[data-feature-id="${successor.id}"]`);

      if (!predBar || !succBar) return;

      const predRect = predBar.getBoundingClientRect();
      const succRect = succBar.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const startX = predRect.right - svgRect.left;
      const startY = predRect.top + (predRect.height / 2) - svgRect.top;
      const endX = succRect.left - svgRect.left;
      const endY = succRect.top + (succRect.height / 2) - svgRect.top;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const controlPoint1X = startX + (endX - startX) * 0.5;
      const controlPoint2X = startX + (endX - startX) * 0.5;

      path.setAttribute('d', `M ${startX},${startY} C ${controlPoint1X},${startY} ${controlPoint2X},${endY} ${endX},${endY}`);
      path.setAttribute('class', 'dependency-line');
      
      svg.appendChild(path);
    });
  };

  const renderGrid = () => {
    const dates = generateDates();
    return (
      <div className="gantt-grid">
        {dates.map(date => (
          <div
            key={date.toISOString()}
            className={`gantt-grid-column ${
              format(date, 'iii') === 'Sat' || format(date, 'iii') === 'Sun'
                ? 'weekend'
                : ''
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTasks = () => {
    const firstDate = startDate;
    
    // Group features by release
    const featuresByRelease = {};
    features.forEach(feature => {
      const releaseId = feature.release_id || 'unassigned';
      if (!featuresByRelease[releaseId]) {
        featuresByRelease[releaseId] = [];
      }
      featuresByRelease[releaseId].push(feature);
    });
    
    return (
      <div className="gantt-tasks">
        {Object.entries(featuresByRelease).map(([releaseId, releaseFeatures]) => {
          const release = releases.find(r => r.id === Number(releaseId)) || { 
            name: 'Unassigned', 
            start_date: null, 
            end_date: null 
          };
          
          return (
            <div key={releaseId} className="gantt-swimlane">
              <div className="swimlane-header">
                <div className="swimlane-title">{release.name}</div>
                {release.start_date && release.end_date && (
                  <div className="swimlane-dates">
                    {format(new Date(release.start_date), 'MMM d')} - {format(new Date(release.end_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              
              {releaseFeatures.map(feature => {
                const startDiff = differenceInDays(feature.startDate, firstDate);
                const duration = differenceInDays(feature.endDate, feature.startDate) + 1;
                
                return (
                  <div 
                    key={feature.id}
                    data-feature-id={feature.id}
                    className="gantt-task"
                    style={{
                      left: `${startDiff * 40}px`,
                      width: `${duration * 40}px`,
                      backgroundColor: feature.color
                    }}
                    onMouseEnter={() => setHoveredTask(feature)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {feature.icon && (
                      <span className="task-icon">
                        {typeIcons[feature.type] || '📋'}
                      </span>
                    )}
                    {feature.avatar && (
                      <div className="task-avatar">
                        <img src={feature.avatar} alt={`${feature.title} assignee`} />
                      </div>
                    )}
                    <div className="task-title">{feature.title}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        
        <svg className="gantt-dependency-lines">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
        </svg>
        
        {hoveredTask && (
          <div 
            className="gantt-tooltip visible"
            style={{
              left: `${hoveredTask.left}px`,
              top: `${hoveredTask.top}px`
            }}
          >
            <div className="tooltip-title">{hoveredTask.title}</div>
            <div className="tooltip-dates">
              {format(hoveredTask.startDate, 'MMM d')} - {format(hoveredTask.endDate, 'MMM d, yyyy')}
            </div>
            <div 
              className="tooltip-status"
              style={{ backgroundColor: statusColors[hoveredTask.status] }}
            >
              {hoveredTask.status}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <Paper className="enhanced-gantt-view">
      <div className="gantt-container" ref={ganttRef}>
        {renderHeader()}
        <div className="gantt-body">
          {renderGrid()}
          {renderTasks()}
        </div>
      </div>
      
      <div className="gantt-legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e84393' }}></div>
          <span>Blocked</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#8c7ae6' }}></div>
          <span>Backlog</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4cd137' }}></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fdcb6e' }}></div>
          <span>In Review</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#00b894' }}></div>
          <span>In Progress</span>
        </div>
      </div>
    </Paper>
  );
};

export default EnhancedGanttView;