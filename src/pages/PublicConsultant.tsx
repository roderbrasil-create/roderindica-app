import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EngineerHelper from '../components/layout/EngineerHelper';

export default function PublicConsultant() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Dynamically set document title for a professional, customized look
    document.title = "Consultor Técnico Digital - RODER";

    // Store referral salesperson in localStorage if provided in the URL
    if (ref) {
      localStorage.setItem('roder_consultant_ref', ref);
      console.log("[PUBLIC_CONSULTANT] Referral detected and saved:", ref);
    }
  }, [ref]);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Full screen rendering of the technical consultant helper */}
      <div className="w-full h-full max-w-none flex flex-col relative">
        <EngineerHelper isFullPage={true} />
      </div>
    </div>
  );
}
