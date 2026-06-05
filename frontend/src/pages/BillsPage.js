import React, { useState, useEffect, useRef } from 'react';
import { billAPI } from '../services/api';
import { showToast, formatCurrency, formatDate } from '../utils/helpers';
import { FiTrash2, FiCheck, FiUpload, FiCamera, FiX, FiRefreshCw } from 'react-icons/fi';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [capturedFile, setCapturedFile] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream(cameraStream);
    };
  }, [cameraStream]);

  const stopCameraStream = (stream) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const loadBills = async () => {
    try {
      const res = await billAPI.getBills();
      setBills(Array.isArray(res.data) ? res.data : res.data?.bills || []);
    } catch (error) {
      showToast.error('Failed to load bills');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadReceiptFile = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await billAPI.uploadReceipt(formData);
      showToast.success('Receipt uploaded and processed');
      loadBills();
      return true;
    } catch (error) {
      showToast.error('Failed to upload receipt');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadReceiptFile(file);
    e.target.value = '';
  };

  const openCamera = async () => {
    setCameraOpen(true);
    setCameraError('');
    setCapturedImage('');
    setCapturedFile(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
    } catch (error) {
      setCameraError('Camera permission was blocked or no camera was found.');
    }
  };

  const closeCamera = () => {
    stopCameraStream(cameraStream);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCameraStream(null);
    setCameraOpen(false);
    setCameraError('');
    setCapturedImage('');
    setCapturedFile(null);
  };

  const captureReceipt = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      showToast.error('Camera is still loading. Try again in a moment.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast.error('Could not capture image');
        return;
      }

      const fileName = `receipt-scan-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(blob));
      stopCameraStream(cameraStream);
      setCameraStream(null);
    }, 'image/jpeg', 0.92);
  };

  const retakeReceipt = async () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage('');
    setCapturedFile(null);
    await openCamera();
  };

  const uploadCapturedReceipt = async () => {
    if (!capturedFile) return;

    const uploaded = await uploadReceiptFile(capturedFile);
    if (uploaded) {
      closeCamera();
    }
  };

  const handleVerify = async (id) => {
    try {
      await billAPI.updateBill(id, { is_verified: true });
      showToast.success('Receipt verified');
      loadBills();
    } catch (error) {
      showToast.error('Failed to verify');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this receipt?')) {
      try {
        await billAPI.deleteBill(id);
        showToast.success('Receipt deleted');
        loadBills();
      } catch (error) {
        showToast.error('Failed to delete');
      }
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  const filteredBills = bills.filter(bill => {
    if (filter === 'verified') return bill.is_verified;
    if (filter === 'unverified') return !bill.is_verified;
    if (filter === 'completed') return bill.processing_status === 'completed';
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bills & Receipts</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCamera}
            disabled={uploading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-60"
          >
            <FiCamera />
            Scan with Camera
          </button>
          <label className="btn-primary flex items-center gap-2 cursor-pointer">
            <FiUpload />
            {uploading ? 'Uploading...' : 'Upload Receipt'}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="card w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Scan Receipt</h2>
              <button
                type="button"
                onClick={closeCamera}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                title="Close camera"
              >
                <FiX size={22} />
              </button>
            </div>

            {cameraError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {cameraError}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-black">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured receipt preview"
                    className="h-[28rem] w-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-[28rem] w-full object-contain"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={retakeReceipt}
                    disabled={uploading}
                    className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <FiRefreshCw />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={uploadCapturedReceipt}
                    disabled={uploading}
                    className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <FiUpload />
                    {uploading ? 'Uploading...' : 'Use Scan'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={captureReceipt}
                  disabled={Boolean(cameraError) || !cameraStream || uploading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FiCamera />
                  Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All ({bills.length})
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-4 py-2 rounded ${filter === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Verified ({bills.filter(b => b.is_verified).length})
        </button>
        <button
          onClick={() => setFilter('unverified')}
          className={`px-4 py-2 rounded ${filter === 'unverified' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Unverified ({bills.filter(b => !b.is_verified).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Processed ({bills.filter(b => b.processing_status === 'completed').length})
        </button>
      </div>

      {filteredBills.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">No receipts found</p>
          <p className="text-gray-500 text-sm mt-2">Upload your first receipt to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{bill.merchant_name || 'Unknown Merchant'}</h3>
                    {bill.is_verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FiCheck size={12} /> Verified
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bill.processing_status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : bill.processing_status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bill.processing_status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-800">{formatCurrency(bill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Date</p>
                      <p className="font-semibold text-gray-800">{formatDate(bill.transaction_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">File Type</p>
                      <p className="font-semibold text-gray-800 uppercase">{bill.file_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">OCR Confidence</p>
                      <p className={`font-semibold ${bill.ocr_confidence > 0.8 ? 'text-green-600' : bill.ocr_confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {(bill.ocr_confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {bill.raw_text && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-700 max-h-20 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Extracted Text:</p>
                      <p>{bill.raw_text.substring(0, 200)}{bill.raw_text.length > 200 ? '...' : ''}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!bill.is_verified && bill.processing_status === 'completed' && (
                    <button
                      onClick={() => handleVerify(bill.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Verify Receipt"
                    >
                      <FiCheck size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Receipt"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
