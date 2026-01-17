import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Play, AlertTriangle, Upload, FileJson } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const BATCH_SIZE = 50; // Process 50 records at a time

export default function AnnieImport() {
  const [importData, setImportData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, ready, running, complete, error
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState({
    appointmentTypes: { total: 0, done: 0, status: 'pending' },
    clients: { total: 0, done: 0, status: 'pending' },
    horses: { total: 0, done: 0, status: 'pending' },
    appointments: { total: 0, done: 0, status: 'pending' },
    treatments: { total: 0, done: 0, status: 'pending' },
    settings: { total: 1, done: 0, status: 'pending' }
  });
  const [idMaps, setIdMaps] = useState({
    appointmentTypes: {},
    clients: {},
    horses: {},
    appointments: {}
  });
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate the data structure
        if (!data.appointmentTypes || !data.clients || !data.horses || !data.appointments || !data.treatments) {
          throw new Error('Invalid import file structure. Missing required fields.');
        }

        setImportData(data);
        setStatus('ready');
        setError(null);

        // Update progress totals
        setProgress({
          appointmentTypes: { total: data.appointmentTypes?.length || 0, done: 0, status: 'pending' },
          clients: { total: data.clients?.length || 0, done: 0, status: 'pending' },
          horses: { total: data.horses?.length || 0, done: 0, status: 'pending' },
          appointments: { total: data.appointments?.length || 0, done: 0, status: 'pending' },
          treatments: { total: data.treatments?.length || 0, done: 0, status: 'pending' },
          settings: { total: 1, done: 0, status: 'pending' }
        });
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
        setImportData(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const runImport = async () => {
    if (!importData) {
      setError('No import data loaded. Please upload a file first.');
      return;
    }

    setStatus('running');
    setError(null);
    setLogs([]);
    addLog('Starting import for annievetphysio@gmail.com', 'info');

    const newIdMaps = {
      appointmentTypes: {},
      clients: {},
      horses: {},
      appointments: {}
    };

    try {
      // Step 1: Appointment Types
      addLog('Importing appointment types...', 'info');
      setCurrentStep(1);
      setProgress(p => ({ ...p, appointmentTypes: { ...p.appointmentTypes, status: 'running' } }));

      for (const type of importData.appointmentTypes) {
        try {
          const result = await base44.functions.invoke('importAnnieData', {
            action: 'import_appointment_types',
            data: { appointmentTypes: [type] }
          });
          if (result.idMap) {
            Object.assign(newIdMaps.appointmentTypes, result.idMap);
          }
          setProgress(p => ({ ...p, appointmentTypes: { ...p.appointmentTypes, done: p.appointmentTypes.done + 1 } }));
        } catch (err) {
          addLog(`Error importing type ${type.name}: ${err.message}`, 'error');
        }
        await delay(100);
      }
      setProgress(p => ({ ...p, appointmentTypes: { ...p.appointmentTypes, status: 'complete' } }));
      addLog(`Imported ${importData.appointmentTypes.length} appointment types`, 'success');

      // Step 2: Clients
      addLog('Importing clients...', 'info');
      setCurrentStep(2);
      setProgress(p => ({ ...p, clients: { ...p.clients, status: 'running' } }));

      const clientBatches = [];
      for (let i = 0; i < importData.clients.length; i += BATCH_SIZE) {
        clientBatches.push(importData.clients.slice(i, i + BATCH_SIZE));
      }

      for (const batch of clientBatches) {
        try {
          const result = await base44.functions.invoke('importAnnieData', {
            action: 'import_clients',
            data: { clients: batch }
          });
          if (result.idMap) {
            Object.assign(newIdMaps.clients, result.idMap);
          }
          setProgress(p => ({ ...p, clients: { ...p.clients, done: p.clients.done + batch.length } }));
        } catch (err) {
          addLog(`Error importing client batch: ${err.message}`, 'error');
        }
        await delay(200);
      }
      setProgress(p => ({ ...p, clients: { ...p.clients, status: 'complete' } }));
      addLog(`Imported ${importData.clients.length} clients`, 'success');

      // Step 3: Horses
      addLog('Importing horses...', 'info');
      setCurrentStep(3);
      setProgress(p => ({ ...p, horses: { ...p.horses, status: 'running' } }));

      const horseBatches = [];
      for (let i = 0; i < importData.horses.length; i += BATCH_SIZE) {
        horseBatches.push(importData.horses.slice(i, i + BATCH_SIZE));
      }

      for (const batch of horseBatches) {
        try {
          const result = await base44.functions.invoke('importAnnieData', {
            action: 'import_horses',
            data: { horses: batch, clientIdMap: newIdMaps.clients }
          });
          if (result.idMap) {
            Object.assign(newIdMaps.horses, result.idMap);
          }
          setProgress(p => ({ ...p, horses: { ...p.horses, done: p.horses.done + batch.length } }));
        } catch (err) {
          addLog(`Error importing horse batch: ${err.message}`, 'error');
        }
        await delay(200);
      }
      setProgress(p => ({ ...p, horses: { ...p.horses, status: 'complete' } }));
      addLog(`Imported ${importData.horses.length} horses`, 'success');

      // Step 4: Appointments
      addLog('Importing appointments (this may take a while)...', 'info');
      setCurrentStep(4);
      setProgress(p => ({ ...p, appointments: { ...p.appointments, status: 'running' } }));

      const apptBatches = [];
      for (let i = 0; i < importData.appointments.length; i += BATCH_SIZE) {
        apptBatches.push(importData.appointments.slice(i, i + BATCH_SIZE));
      }

      for (const batch of apptBatches) {
        try {
          const result = await base44.functions.invoke('importAnnieData', {
            action: 'import_appointments',
            data: {
              appointments: batch,
              clientIdMap: newIdMaps.clients,
              horseIdMap: newIdMaps.horses,
              appointmentTypeIdMap: newIdMaps.appointmentTypes
            }
          });
          if (result.idMap) {
            Object.assign(newIdMaps.appointments, result.idMap);
          }
          setProgress(p => ({ ...p, appointments: { ...p.appointments, done: p.appointments.done + batch.length } }));
        } catch (err) {
          addLog(`Error importing appointment batch: ${err.message}`, 'error');
        }
        await delay(300);
      }
      setProgress(p => ({ ...p, appointments: { ...p.appointments, status: 'complete' } }));
      addLog(`Imported ${importData.appointments.length} appointments`, 'success');

      // Step 5: Treatments
      addLog('Importing treatments...', 'info');
      setCurrentStep(5);
      setProgress(p => ({ ...p, treatments: { ...p.treatments, status: 'running' } }));

      const treatmentBatches = [];
      for (let i = 0; i < importData.treatments.length; i += BATCH_SIZE) {
        treatmentBatches.push(importData.treatments.slice(i, i + BATCH_SIZE));
      }

      for (const batch of treatmentBatches) {
        try {
          await base44.functions.invoke('importAnnieData', {
            action: 'import_treatments',
            data: {
              treatments: batch,
              horseIdMap: newIdMaps.horses,
              appointmentIdMap: newIdMaps.appointments
            }
          });
          setProgress(p => ({ ...p, treatments: { ...p.treatments, done: p.treatments.done + batch.length } }));
        } catch (err) {
          addLog(`Error importing treatment batch: ${err.message}`, 'error');
        }
        await delay(200);
      }
      setProgress(p => ({ ...p, treatments: { ...p.treatments, status: 'complete' } }));
      addLog(`Imported ${importData.treatments.length} treatments`, 'success');

      // Step 6: Settings
      addLog('Importing settings...', 'info');
      setCurrentStep(6);
      setProgress(p => ({ ...p, settings: { ...p.settings, status: 'running' } }));

      try {
        await base44.functions.invoke('importAnnieData', {
          action: 'import_settings',
          data: { settings: importData.settings }
        });
        setProgress(p => ({ ...p, settings: { done: 1, total: 1, status: 'complete' } }));
        addLog('Imported settings', 'success');
      } catch (err) {
        addLog(`Error importing settings: ${err.message}`, 'error');
      }

      setIdMaps(newIdMaps);
      setStatus('complete');
      addLog('Import complete!', 'success');

    } catch (err) {
      setError(err.message);
      setStatus('error');
      addLog(`Import failed: ${err.message}`, 'error');
    }
  };

  const getStepIcon = (stepStatus) => {
    switch (stepStatus) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const steps = [
    { key: 'appointmentTypes', label: 'Appointment Types' },
    { key: 'clients', label: 'Clients' },
    { key: 'horses', label: 'Horses' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'treatments', label: 'Treatments' },
    { key: 'settings', label: 'Settings' }
  ];

  const totalRecords = Object.values(progress).reduce((sum, p) => sum + p.total, 0);
  const doneRecords = Object.values(progress).reduce((sum, p) => sum + p.done, 0);
  const overallProgress = totalRecords > 0 ? (doneRecords / totalRecords) * 100 : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <PageHeader title="Import Annie's Data" />

      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This will import data for <strong>annievetphysio@gmail.com</strong> only.
          Make sure you are logged in as Annie before running this import.
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Step 1: Load Import File</CardTitle>
          <CardDescription>
            Upload the import_payload.json file from your local dataimport folder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {importData ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileJson className="h-6 w-6" />
                    <span>File loaded successfully</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="h-8 w-8" />
                    <span>Click to upload import_payload.json</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {importData && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>Cliniko export from Annie McAndrew Vet Physio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{importData.clients?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{importData.horses?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Horses</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{importData.appointments?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Appointments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Step 2: Run Import</CardTitle>
        </CardHeader>
        <CardContent>
          {totalRecords > 0 && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Overall Progress</span>
                <span className="text-sm">{doneRecords} / {totalRecords}</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          <div className="space-y-3 mb-6">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3">
                {getStepIcon(progress[step.key].status)}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className={currentStep === idx + 1 ? 'font-medium' : ''}>
                      {step.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {progress[step.key].done} / {progress[step.key].total}
                    </span>
                  </div>
                  {progress[step.key].status === 'running' && (
                    <Progress
                      value={progress[step.key].total > 0 ? (progress[step.key].done / progress[step.key].total) * 100 : 0}
                      className="h-1 mt-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={runImport}
            disabled={status === 'running' || !importData}
            className="w-full"
            size="lg"
          >
            {status === 'running' ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : status === 'complete' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Import Complete - Run Again
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-100 p-3 rounded-md font-mono text-xs max-h-64 overflow-y-auto">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-slate-300'
                  }`}
                >
                  [{log.time}] {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
