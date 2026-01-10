import { useState, useRef } from 'react';
import { bulkUploadAPI } from '../../services/api';
import { Card, Button, Alert, LoadingSpinner, Modal } from './UIComponents';
import { 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UPLOAD_TYPES = {
  students: {
    title: 'Bulk Upload Students',
    description: 'Upload a CSV file to add multiple students at once',
    downloadSample: bulkUploadAPI.downloadStudentsSample,
    upload: bulkUploadAPI.uploadStudents,
    sampleFilename: 'students_sample.csv',
    requiredColumns: ['firstName', 'lastName', 'email'],
    optionalColumns: ['phone', 'campus', 'school', 'batch', 'tenthGrade', 'twelfthGrade', 'highestDegree']
  },
  selfApplications: {
    title: 'Bulk Upload Self Applications',
    description: 'Upload a CSV file to add your external job applications',
    downloadSample: bulkUploadAPI.downloadSelfApplicationsSample,
    upload: bulkUploadAPI.uploadSelfApplications,
    sampleFilename: 'self_applications_sample.csv',
    requiredColumns: ['companyName', 'jobTitle'],
    optionalColumns: ['jobUrl', 'location', 'salary', 'applicationDate', 'status', 'source', 'notes']
  },
  selfApplicationsCampus: {
    title: 'Bulk Upload Student Applications',
    description: 'Upload a CSV file to add self-applications for your campus students',
    downloadSample: bulkUploadAPI.downloadSelfApplicationsCampusSample,
    upload: bulkUploadAPI.uploadSelfApplicationsCampus,
    sampleFilename: 'self_applications_campus_sample.csv',
    requiredColumns: ['studentEmail', 'companyName', 'jobTitle'],
    optionalColumns: ['jobUrl', 'location', 'salary', 'applicationDate', 'status', 'source', 'notes']
  }
};

function BulkUpload({ type, onSuccess, onClose }) {
  const config = UPLOAD_TYPES[type];
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDownloadSample = async () => {
    try {
      setDownloading(true);
      const response = await config.downloadSample();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = config.sampleFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download sample file');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await config.upload(file);
      setResult(response.data);
      
      if (response.data.summary.success > 0 && onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <p className="text-gray-600 mb-4">{config.description}</p>
        
        {/* Required/Optional Columns Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <p className="font-medium text-gray-700 mb-2">Required columns:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {config.requiredColumns.map(col => (
              <span key={col} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                {col}
              </span>
            ))}
          </div>
          <p className="font-medium text-gray-700 mb-2">Optional columns:</p>
          <div className="flex flex-wrap gap-2">
            {config.optionalColumns.map(col => (
              <span key={col} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Download Sample */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
        <div>
          <p className="font-medium text-indigo-900">Download Sample Template</p>
          <p className="text-sm text-indigo-700">Get a sample CSV file with the correct format</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleDownloadSample}
          disabled={downloading}
        >
          {downloading ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Download Sample
            </>
          )}
        </Button>
      </div>

      {/* File Upload Area */}
      {!result ? (
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-300'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-2">
                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500" />
                <p className="text-lg font-medium text-green-800">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2 cursor-pointer">
                <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-lg font-medium text-gray-700">
                  Click to select a CSV file
                </p>
                <p className="text-sm text-gray-500">
                  or drag and drop your file here
                </p>
              </div>
            )}
          </div>

          {error && <Alert type="error">{error}</Alert>}

          <div className="flex justify-end gap-3">
            {onClose && (
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Results Display */
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{result.summary.success}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{result.summary.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{result.summary.skipped || 0}</div>
              <div className="text-sm text-yellow-800">Skipped</div>
            </div>
          </div>

          {/* Success Details */}
          {result.results.success?.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Successfully Processed ({result.results.success.length})
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-green-700">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Details</th>
                      {type === 'students' && <th className="pb-2">Temp Password</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.success.map((item, idx) => (
                      <tr key={idx} className="border-t border-green-200">
                        <td className="py-1">{item.row}</td>
                        <td className="py-1">{item.name || item.email || `${item.company} - ${item.jobTitle}`}</td>
                        {type === 'students' && <td className="py-1 font-mono text-xs">{item.temporaryPassword}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed Details */}
          {result.results.failed?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <XCircleIcon className="w-5 h-5 mr-2" />
                Failed ({result.results.failed.length})
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.failed.map((item, idx) => (
                      <tr key={idx} className="border-t border-red-200">
                        <td className="py-1">{item.row}</td>
                        <td className="py-1">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skipped Details */}
          {result.results.skipped?.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Skipped ({result.results.skipped.length})
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-yellow-700">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.skipped.map((item, idx) => (
                      <tr key={idx} className="border-t border-yellow-200">
                        <td className="py-1">{item.row}</td>
                        <td className="py-1">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleReset}>
              Upload Another File
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component as a modal
export function BulkUploadModal({ isOpen, onClose, type, onSuccess }) {
  const config = UPLOAD_TYPES[type];
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config?.title || 'Bulk Upload'}
      size="large"
    >
      <BulkUpload 
        type={type} 
        onSuccess={onSuccess} 
        onClose={onClose}
      />
    </Modal>
  );
}

export default BulkUpload;
