import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamByQrToken } from '../../services/teamService';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, AlertTriangle, ArrowRight, Camera, CameraOff, Search } from 'lucide-react';

export default function QrScanner() {
  const [manualToken, setManualToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const navigate = useNavigate();
  const html5QrRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setScannerReady(false);
      setCameraError('');

      html5QrRef.current = new Html5Qrcode("qr-reader");

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device.');
        return;
      }

      // Prefer back camera on mobile
      const backCamera = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      ) || cameras[cameras.length - 1];

      await html5QrRef.current.start(
        backCamera.id,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!isScanningRef.current) {
            isScanningRef.current = true;
            handleLookup(decodedText);
          }
        },
        () => { /* ignore frame errors */ }
      );

      setCameraStarted(true);
      setScannerReady(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(
        err?.message?.includes('Permission') || err?.message?.includes('NotAllowed')
          ? 'Camera permission denied. Please allow camera access and refresh.'
          : `Camera unavailable: ${err?.message || 'Unknown error'}`
      );
    }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          // Pause video before stop to prevent AbortError
          const el = document.getElementById("qr-reader");
          if (el) el.querySelectorAll("video").forEach(v => { v.pause(); v.srcObject = null; });
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
      } catch (e) { /* ignore */ }
      html5QrRef.current = null;
    }
    setCameraStarted(false);
    isScanningRef.current = false;
  }

  async function handleLookup(token) {
    setErrorMsg('');
    const clean = (token || '').trim();
    if (!clean) {
      setErrorMsg('Please enter a valid Team Code or QR Token.');
      return;
    }

    setLoading(true);
    try {
      const team = await getTeamByQrToken(clean);
      if (team && team.id) {
        navigate(`/teams/${team.id}`);
      } else {
        setErrorMsg(`No team found for: "${clean}"`);
        isScanningRef.current = false; // allow re-scan
      }
    } catch (e) {
      setErrorMsg('Lookup failed. Check connection and try again.');
      isScanningRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <QrCode className="w-6 h-6 text-emerald-400" />
          <span>QR Code Scanner</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Scan a team's QR code or manually enter a Team Code / Token
        </p>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center space-x-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm">{errorMsg}</span>
        </div>
      )}

      {cameraError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-400">
          <CameraOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-2 text-xs underline underline-offset-2 hover:text-amber-300"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Camera Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${cameraStarted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-sm font-semibold text-slate-300">
              {scannerReady ? 'Camera Active — Point at QR Code' : cameraError ? 'Camera Unavailable' : 'Starting Camera…'}
            </span>
          </div>
          <Camera className={`w-4 h-4 ${cameraStarted ? 'text-emerald-400' : 'text-slate-600'}`} />
        </div>

        {/* QR Reader Target */}
        <div className="flex justify-center p-4 bg-black">
          <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden" style={{ minHeight: '300px' }} />
        </div>

        {!cameraError && !scannerReady && (
          <div className="p-4 flex items-center justify-center space-x-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Requesting camera access…</span>
          </div>
        )}
      </div>

      {/* Manual Lookup */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Manual Team Lookup</h3>
        </div>
        <p className="text-xs text-slate-500">Enter a Team Code (e.g. TEAM-2026-0001), Team ID, or QR Token UUID</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup(manualToken)}
            placeholder="TEAM-2026-0001 or UUID…"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <button
            onClick={() => handleLookup(manualToken)}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-wait text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <span>{loading ? 'Searching…' : 'Lookup'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
