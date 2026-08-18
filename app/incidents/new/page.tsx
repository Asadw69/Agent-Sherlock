'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/incidents/file-upload';
import { ArrowLeft, AlertCircle, Sparkles, ShieldAlert, Info } from 'lucide-react';

export default function NewIncidentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'HIGH',
    serviceName: '',
    deploymentVersion: '',
    deploymentTimestamp: '',
  });

  const [logFiles, setLogFiles] = useState<File[]>([]);
  const [repoFile, setRepoFile] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create incident
      const createResponse = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          serviceName: formData.serviceName,
          deploymentVersion: formData.deploymentVersion || null,
          deploymentTimestamp: formData.deploymentTimestamp || null,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.error || 'Failed to create incident');
      }

      const incident = await createResponse.json();

      // Upload files if provided
      if (logFiles.length > 0 || repoFile.length > 0) {
        const allFiles = [...logFiles, ...repoFile];
        const uploadFormData = new FormData();

        for (const file of allFiles) {
          uploadFormData.append('files', file);
        }

        const uploadResponse = await fetch(`/api/incidents/${incident.id}/upload`, {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.error || 'Failed to upload files');
        }
      }

      // Navigate to investigation page
      router.push(`/investigations/${incident.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.serviceName;

  return (
    <div className="text-slate-900 dark:text-slate-100 flex flex-col w-full flex-1 selection:bg-blue-500/20 selection:text-blue-600">
      <main className="mx-auto max-w-5xl px-4 pt-24 sm:pt-28 pb-12 sm:px-6 lg:px-8 flex-1 w-full space-y-8">
        
        {/* Page Header */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ff1053]/10 text-[#ff1053] text-xs font-bold uppercase tracking-wider mb-3 border border-[#ff1053]/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Root Cause Analysis</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Create New Incident
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/70 font-normal">
            Upload application logs and repository files for the AI agent to analyze.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Details Card */}
          <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-white uppercase tracking-wider">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Incident Title *
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Payment API outage after deployment #392"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Description &amp; Symptoms *
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What broke? When did latency spike? What were user-facing symptoms?"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Severity *
                  </label>
                  <Select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="LOW" className="bg-black text-white">LOW</option>
                    <option value="MEDIUM" className="bg-black text-white">MEDIUM</option>
                    <option value="HIGH" className="bg-black text-white">HIGH</option>
                    <option value="CRITICAL" className="bg-black text-white">CRITICAL</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Service Name *
                  </label>
                  <Input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    placeholder="e.g., payment-service"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Deployment Version (Optional)
                  </label>
                  <Input
                    type="text"
                    name="deploymentVersion"
                    value={formData.deploymentVersion}
                    onChange={handleInputChange}
                    placeholder="e.g., v2.4.1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Deployment Timestamp (Optional)
                  </label>
                  <Input
                    type="datetime-local"
                    name="deploymentTimestamp"
                    value={formData.deploymentTimestamp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Uploads */}
          <FileUpload
            label="Application Logs"
            description="Upload .log, .txt, .json, or .csv files with server errors"
            accept=".log,.txt,.json,.csv"
            multiple={true}
            onFilesChange={setLogFiles}
          />

          <FileUpload
            label="Source Code Repository"
            description="Upload a ZIP file of your codebase or service repository"
            accept=".zip"
            multiple={false}
            onFilesChange={setRepoFile}
          />

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 rounded-2xl border border-[#ff1053]/40 bg-[#ff1053]/15 p-4 text-[#ff1053]">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">Error Creating Incident</p>
                <p className="mt-1 text-white/90">{error}</p>
              </div>
            </div>
          )}

          {/* Guidance Note */}
          <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <Info className="h-5 w-5 shrink-0 text-[#ff1053] mt-0.5" />
            <div className="text-xs text-white/70 leading-relaxed font-normal">
              <p className="font-bold text-white uppercase tracking-wider">Automatic Processing:</p>
              <p className="mt-0.5">
                Logs and repositories will be parsed securely in memory. Large archives will ignore <code>node_modules</code>, <code>dist</code>, and binary files.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              variant="gradient"
              size="lg"
              className="w-full sm:w-auto uppercase tracking-wider"
            >
              {isSubmitting ? 'Initializing Investigation...' : 'Create & Investigate'}
            </Button>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto uppercase tracking-wider">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

