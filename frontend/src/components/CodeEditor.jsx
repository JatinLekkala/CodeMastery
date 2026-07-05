import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Undo, Redo, Copy, Check } from 'lucide-react';

const BOILERPLATES = {
  'C++': `#include <iostream>
using namespace std;

int main() {
    // Read input, process, write output
    
    return 0;
}
`,
  'Java': `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Read input using Scanner or BufferedReader
        Scanner sc = new Scanner(System.in);
        
        // Write your solution here
        
    }
}
`,
  'Python': `# Write your solution here
import sys

def solve():
    # Read all input from standard input
    # lines = sys.stdin.read().split()
    pass

if __name__ == '__main__':
    solve()
`
};

const LANGUAGE_MAPPING = {
  'C++': 'cpp',
  'Java': 'java',
  'Python': 'python'
};

const CodeEditor = ({ code, onChange, language, onLanguageChange, theme }) => {
  const editorRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    // Populate code with boilerplate if currently empty
    if (!code) {
      onChange(BOILERPLATES[language]);
    }
  }, [language, code]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
      editorRef.current.focus();
    }
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your code to the default template?')) {
      onChange(BOILERPLATES[language]);
    }
  };

  const handleEditorChange = (value) => {
    onChange(value || '');
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div className="editor-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Language:</span>
          <select 
            value={language} 
            onChange={(e) => onLanguageChange(e.target.value)}
            className="form-select"
            style={{ width: '130px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
          >
            <option value="C++">C++ (gcc)</option>
            <option value="Java">Java (openjdk 11)</option>
            <option value="Python">Python (python 3.9)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={handleUndo} 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          <button 
            onClick={handleRedo} 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>
          <button 
            onClick={handleCopyCode} 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Copy Code"
          >
            {copiedCode ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>
          <button 
            onClick={handleReset} 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
            title="Reset Code Template"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="editor-container" style={{ border: 'none', borderRadius: 0 }}>
        <Editor
          height="100%"
          language={LANGUAGE_MAPPING[language]}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            roundedSelection: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            }
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
