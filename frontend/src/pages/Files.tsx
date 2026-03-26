import { useState } from "react";
import { 
  FolderOpen, 
  FileText,
  FileCode,
  Trash2,
  Search,
  Edit2,
  Plus,
} from "lucide-react";
import { MonacoEditor } from "../components/editor/MonacoEditor";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";

interface FileItem {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  updatedAt: string;
}

const mockFiles: FileItem[] = [
  { 
    id: "1", 
    name: "project-spec.md", 
    content: "# Project Specification\\n\\n## Overview\\nThis is the main project specification.",
    type: "markdown", 
    size: 1024, 
    updatedAt: "2024-03-20" 
  },
  { 
    id: "2", 
    name: "config.yaml", 
    content: "database:\\n  host: localhost\\n  port: 5432",
    type: "yaml", 
    size: 512, 
    updatedAt: "2024-03-19" 
  },
  { 
    id: "3", 
    name: "script.ts", 
    content: "export function main() {\\n  console.log(\\Hello World\);\\n}",
    type: "typescript", 
    size: 256, 
    updatedAt: "2024-03-18" 
  },
  { 
    id: "4", 
    name: "README.md", 
    content: "# AI Orchestrator\\n\\n## Getting Started",
    type: "markdown", 
    size: 2048, 
    updatedAt: "2024-03-17" 
  },
];

export function Files() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [search, setSearch] = useState("");
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleSaveFile = (content: string) => {
    if (!editingFile) return;
    
    setFiles(files.map(f => 
      f.id === editingFile.id 
        ? { ...f, content, updatedAt: new Date().toISOString() }
        : f
    ));
    toast.success("File saved successfully");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    setFiles(files.filter(f => f.id !== id));
    toast.success("File deleted");
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newFileName,
      content: "",
      type: getFileType(newFileName),
      size: 0,
      updatedAt: new Date().toISOString(),
    };
    
    setFiles([...files, newFile]);
    setNewFileName("");
    setShowCreateModal(false);
    setEditingFile(newFile);
    toast.success("File created");
  };

  const getFileType = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const typeMap: Record<string, string> = {
      md: "markdown",
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      py: "python",
      css: "css",
      html: "html",
      sql: "sql",
    };
    return typeMap[ext] || "text";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "markdown": return <FileText className="w-8 h-8 text-blue-500" />;
      case "typescript":
      case "javascript": return <FileCode className="w-8 h-8 text-yellow-500" />;
      case "json":
      case "yaml": return <FileCode className="w-8 h-8 text-gray-500" />;
      default: return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };


  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // If editing a file, show editor
  if (editingFile) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <MonacoEditor
          value={editingFile.content}
          filename={editingFile.name}
          onSave={handleSaveFile}
          onClose={() => setEditingFile(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FolderOpen className="w-6 h-6 mr-2" />
          Files
        </h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New File
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No files found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <span className="font-medium text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{file.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(file.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingFile(file)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.ts"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFile} disabled={!newFileName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
