import { useRef, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Eye, FileText, FileSpreadsheet, File } from 'lucide-react';
import type { ProcedureType, Document } from '@/types';
import { toast } from 'sonner';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  doc: <FileText className="h-4 w-4 text-blue-500" />,
  docx: <FileText className="h-4 w-4 text-blue-500" />,
  xls: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
};

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / 1048576).toFixed(1) + ' Mo';
}

interface Props {
  marcheId: string;
  procedure: ProcedureType;
}

export default function DocumentUploader({ marcheId, procedure }: Props) {
  const { documents, addDocument, deleteDocument, addTemoin } = useData();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  const docs = documents.filter(d => d.marcheId === marcheId && d.procedure === procedure);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} dépasse 10 Mo`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const doc: Document = {
          id: crypto.randomUUID(),
          marcheId,
          procedure,
          nom: file.name,
          type: file.type,
          taille: file.size,
          uploadedBy: user?.id || '',
          uploadedAt: new Date().toISOString(),
          url: reader.result as string, // base64 data URL
        };
        addDocument(doc);
        addTemoin({
          userId: user?.id || '',
          dateOperation: new Date().toLocaleDateString('fr-FR'),
          heureOperation: new Date().toLocaleTimeString('fr-FR'),
          description: `Téléchargement du document "${file.name}" - procédure ${procedure}`,
          ipAddress: '192.168.1.1',
          action: 'telechargement',
        });
        toast.success(`"${file.name}" ajouté`);
      };
      reader.readAsDataURL(file);
    });

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = (doc: Document) => {
    deleteDocument(doc.id, user?.id || '');
    addTemoin({
      userId: user?.id || '',
      dateOperation: new Date().toLocaleDateString('fr-FR'),
      heureOperation: new Date().toLocaleTimeString('fr-FR'),
      description: `Suppression du document "${doc.nom}" - procédure ${procedure}`,
      ipAddress: '192.168.1.1',
      action: 'suppression',
    });
    toast.success('Document supprimé');
  };

  const handlePreview = (doc: Document) => {
    const ext = getExt(doc.nom);
    if (ext === 'pdf') {
      setPreviewUrl(doc.url);
      setPreviewName(doc.nom);
    } else {
      // For non-PDF, trigger download
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.nom;
      a.click();
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Documents joints
          {docs.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{docs.length}</Badge>}
        </h4>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3 w-3" /> Ajouter un document
        </Button>
        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} multiple className="hidden" onChange={handleUpload} />
      </div>

      {docs.length > 0 && (
        <div className="border rounded-md divide-y">
          {docs.map(doc => {
            const ext = getExt(doc.nom);
            return (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                {FILE_ICONS[ext] || <File className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs">{doc.nom}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(doc.taille)} • {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(doc)} title="Aperçu">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc)} title="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {docs.length === 0 && (
        <div
          className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          Glissez ou cliquez pour ajouter des documents (PDF, Word, Excel — max 10 Mo)
        </div>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader><DialogTitle>{previewName}</DialogTitle></DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="w-full flex-1 rounded border" style={{ height: 'calc(80vh - 80px)' }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
