import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseDocument, truncateText, ParsedDocumentResult } from '@/lib/parseDocument';

interface DocumentUploadProps {
  onParsed: (text: string, meta: ParsedDocumentResult['meta']) => void;
  multiple?: boolean;
  maxChars?: number;
}

export const DocumentUpload = ({ onParsed, multiple = false, maxChars = 50000 }: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ParsedDocumentResult['meta'] | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    setStatus('parsing');
    try {
      // For now only parse first file if multiple
      const file = files[0];
      const result = await parseDocument(file);
      const truncated = truncateText(result.text, maxChars);
      setMeta(result.meta);
      onParsed(truncated, result.meta);
      setStatus('done');
    } catch (e: any) {
      setError(e.message || 'Failed to parse document');
      setStatus('error');
    }
  }, [onParsed, maxChars]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card
      className={`p-4 border-dashed border-2 relative transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center text-center gap-3">
        {status === 'parsing' ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : status === 'done' ? (
          <CheckCircle2 className="w-8 h-8 text-success" />
        ) : status === 'error' ? (
          <AlertCircle className="w-8 h-8 text-destructive" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">Drag & drop or click to upload</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (max {maxChars.toLocaleString()} chars)</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={status==='parsing'}>
          {status === 'parsing' ? 'Parsing...' : 'Browse Files'}
        </Button>
        {error && <p className="text-xs text-destructive max-w-sm">{error}</p>}
        {meta && (
          <div className="w-full mt-2 p-2 rounded bg-muted text-left text-xs flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-medium truncate" title={meta.fileName}>{meta.fileName}</p>
              <p className="text-muted-foreground">{(meta.fileSize/1024).toFixed(1)} KB {meta.pages ? `• ${meta.pages} pages` : ''}</p>
              {meta.warnings && meta.warnings.length > 0 && (
                <ul className="list-disc ml-4 text-warning">
                  {meta.warnings.slice(0,2).map((w,i)=>(<li key={i}>{w}</li>))}
                  {meta.warnings.length>2 && <li>+{meta.warnings.length-2} more</li>}
                </ul>
              )}
            </div>
            <button onClick={()=>{setMeta(null); setStatus('idle'); setError(null);}} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentUpload;
