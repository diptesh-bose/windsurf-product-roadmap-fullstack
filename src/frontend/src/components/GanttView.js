import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import Paper from '@mui/material/Paper';
import { ViewState, EditingState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  Toolbar,
  ViewSwitcher,
  DateNavigator,
  TodayButton,
  DragDropProvider,
  CurrentTimeIndicator,
  Resources,
  AppointmentTooltip
} from '@devexpress/dx-react-scheduler-material-ui';
import '../styles/GanttView.css';

const GanttView = () => {
  const [features, setFeatures] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentViewName, setCurrentViewName] = useState('Month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuresRes, releasesRes] = await Promise.all([
          axios.get('http://localhost:5001/api/features'),
          axios.get('http://localhost:5001/api/releases')
        ]);
        
        setFeatures(featuresRes.data);
        setReleases(releasesRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data for Gantt view. Please try again later.');
        setLoading(false);
        console.error('Gantt view fetch error:', err);
      }
    };

    fetchData();
  }, []);

  // Convert features and releases to scheduler appointments
  const getAppointments = () => {
    const featureAppointments = features.map(feature => ({
      id: `feature-${feature.id}`,
      title: feature.title,
      startDate: feature.start_date ? new Date(feature.start_date) : new Date(),
      endDate: feature.end_date ? new Date(feature.end_date) : addDays(new Date(), 1),
      type: 'feature',
      priority: feature.priority || 'medium'
    }));

    const releaseAppointments = releases.map(release => ({
      id: `release-${release.id}`,
      title: release.name,
      startDate: release.start_date ? new Date(release.start_date) : new Date(),
      endDate: release.end_date ? new Date(release.end_date) : addDays(new Date(), 30),
      type: 'release'
    }));

    return [...featureAppointments, ...releaseAppointments];
  };

  // Custom appointment component to style based on type and priority
  const Appointment = ({ children, style, data, ...restProps }) => {
    const isFeature = data.type === 'feature';
    const isRelease = data.type === 'release';
    
    let backgroundColor = '#3498db'; // Default color
    
    if (isFeature) {
      switch (data.priority) {
        case 'high':
          backgroundColor = '#e74c3c';
          break;
        case 'medium':
          backgroundColor = '#f39c12';
          break;
        case 'low':
          backgroundColor = '#2ecc71';
          break;
        default:
          backgroundColor = '#3498db';
      }
    } else if (isRelease) {
      backgroundColor = '#9b59b6';
    }
    
    return (
      <Appointments.Appointment
        {...restProps}
        style={{
          ...style,
          backgroundColor,
          borderRadius: '4px',
        }}
        data={data}
      >
        {children}
      </Appointments.Appointment>
    );
  };

  // Define resources for different types of appointments
  const resources = [{
    fieldName: 'type',
    title: 'Type',
    instances: [
      { id: 'feature', text: 'Feature', color: '#f39c12' },
      { id: 'release', text: 'Release', color: '#9b59b6' },
    ],
  }];

  // Handle drag and drop
  const commitChanges = async ({ changed, added, deleted }) => {
    try {
      if (changed) {
        const appointmentId = Object.keys(changed)[0];
        const appointmentType = appointmentId.split('-')[0];
        const id = appointmentId.split('-')[1];
        const changes = changed[appointmentId];
        
        if (appointmentType === 'feature') {
          const updatedFeature = features.find(f => f.id === parseInt(id));
          if (updatedFeature) {
            const newFeature = {
              ...updatedFeature,
              start_date: format(changes.startDate, 'yyyy-MM-dd'),
              end_date: format(changes.endDate, 'yyyy-MM-dd')
            };
            
            await axios.put(`http://localhost:5001/api/features/${id}`, newFeature);
            
            setFeatures(features.map(f => 
              f.id === parseInt(id) ? newFeature : f
            ));
          }
        } else if (appointmentType === 'release') {
          const updatedRelease = releases.find(r => r.id === parseInt(id));
          if (updatedRelease) {
            const newRelease = {
              ...updatedRelease,
              start_date: format(changes.startDate, 'yyyy-MM-dd'),
              end_date: format(changes.endDate, 'yyyy-MM-dd')
            };
            
            await axios.put(`http://localhost:5001/api/releases/${id}`, newRelease);
            
            setReleases(releases.map(r => 
              r.id === parseInt(id) ? newRelease : r
            ));
          }
        }
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading Gantt chart data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="gantt-view">
      <h1 className="page-title">Gantt Chart</h1>
      
      <Paper>
        <Scheduler
          data={getAppointments()}
          height={700}
        >
          <ViewState
            currentDate={currentDate}
            currentViewName={currentViewName}
            onCurrentDateChange={setCurrentDate}
            onCurrentViewNameChange={setCurrentViewName}
          />
          <EditingState 
            onCommitChanges={commitChanges}
          />
          <DayView />
          <WeekView />
          <MonthView />
          
          <Toolbar />
          <DateNavigator />
          <TodayButton />
          <ViewSwitcher />
          
          <Appointments
            appointmentComponent={Appointment}
          />
          
          <AppointmentTooltip 
            showCloseButton
            showDeleteButton
          />
          
          <DragDropProvider
            allowDrag={() => true}
            allowResize={() => true}
          />
          
          <CurrentTimeIndicator />
          
          <Resources
            data={resources}
            mainResourceName="type"
          />
        </Scheduler>
      </Paper>
    </div>
  );
};

export default GanttView;
