import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'document' | 'text'>('image');
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.files.uploadFile.useMutation();
  const filesQuery = trpc.files.getAllFiles.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  const deleteMutation = trpc.files.deleteFile.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need admin privileges to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !familyMemberName) {
      toast.error('Please select a file and enter a family member name');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        await uploadMutation.mutateAsync({
          familyMemberName,
          fileName: selectedFile.name,
          fileType,
          mimeType: selectedFile.type,
          fileData: base64,
          description,
        });
        
        toast.success('File uploaded successfully');
        setSelectedFile(null);
        setFamilyMemberName('');
        setDescription('');
        filesQuery.refetch();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await deleteMutation.mutateAsync({ fileId });
      toast.success('File deleted successfully');
      filesQuery.refetch();
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <ImageIcon className="w-4 h-4" />;
    if (fileType === 'document') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70">Manage family member files and media</p>
        </div>

        {/* Upload Section */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload File</span>
            </CardTitle>
            <CardDescription className="text-white/70">
              Upload images, documents, or text files for family members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Family Member Name</label>
                <Input
                  placeholder="e.g., Amitabh Bachchan"
                  value={familyMemberName}
                  onChange={(e) => setFamilyMemberName(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as 'image' | 'document' | 'text')}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white"
                >
                  <option value="image" className="bg-gray-900">Image</option>
                  <option value="document" className="bg-gray-900">Document</option>
                  <option value="text" className="bg-gray-900">Text</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white/30 file:text-white hover:file:bg-white/40"
              />
              {selectedFile && (
                <p className="text-sm text-white/70 mt-2">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                placeholder="Add notes or description about this file..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder:text-white/60 resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !familyMemberName}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription className="text-white/70">
              Total files: {filesQuery.data?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filesQuery.isLoading ? (
              <p className="text-white/70">Loading files...</p>
            ) : filesQuery.data && filesQuery.data.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filesQuery.data.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(file.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.fileName}</p>
                        <p className="text-sm text-white/70">
                          {file.familyMemberName} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                        {file.description && (
                          <p className="text-xs text-white/60 mt-1">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs capitalize">
                        {file.fileType}
                      </Badge>
                      <Button
                        onClick={() => handleDelete(file.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-center py-8">No files uploaded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
