import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "../ui/button";
import { Save, X } from "lucide-react";

interface MonacoEditorProps {
  value: string;
  language?: string;
  filename?: string;
  onSave?: (value: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export function MonacoEditor({
  value,
  language = "text",
  filename,
  onSave,
  onClose,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    setCurrentValue(value || "");
    setHasChanges(value !== currentValue);
  };

  const handleSave = () => {
    onSave?.(currentValue);
    setHasChanges(false);
  };

  const getLanguageFromFilename = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      py: "python",
      sh: "shell",
      bash: "shell",
      css: "css",
      scss: "scss",
      html: "html",
      xml: "xml",
      sql: "sql",
      dockerfile: "dockerfile",
      tf: "terraform",
    };
    return langMap[ext || ""] || "text";
  };

  const editorLanguage = filename ? getLanguageFromFilename(filename) : language;

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">{filename || "Untitled"}</span>
          {hasChanges && (
            <span className="text-xs text-orange-600">● Modified</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[400px]">
        <Editor
          height="100%"
          language={editorLanguage}
          value={currentValue}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: readOnly,
            automaticLayout: true,
            wordWrap: "on",
            padding: { top: 16 },
          }}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
