class CodeEditor {
  constructor() {
    this.editor = null
    this.currentFile = null
    this.openTabs = new Map()
    this.files = new Map()
    this.isInitialized = false
    this.monaco = null
    this.isReceivingUpdate = false
    this.groqService = null // Declare groqService variable

    this.initializeMonaco()
  }

  async initializeMonaco() {
    try {
      // Configure Monaco Editor
      require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      })

      require(["vs/editor/editor.main"], (monaco) => {
        this.monaco = monaco
        this.setupEditor()
        this.isInitialized = true
      })
    } catch (error) {
      console.error("Failed to initialize Monaco Editor:", error)
    }
  }

  setupEditor() {
    const editorContainer = document.getElementById("editor")

    this.editor = this.monaco.editor.create(editorContainer, {
      value: "",
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      minimap: { enabled: true },
      wordWrap: "on",
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      glyphMargin: false,
    })

    // Listen for content changes
    this.editor.onDidChangeModelContent((e) => {
      if (this.currentFile && !this.isReceivingUpdate) {
        const content = this.editor.getValue()
        this.files.set(this.currentFile, content)

        // Emit changes to other users
        if (window.collaboration) {
          window.collaboration.sendCodeChange(this.currentFile, content, this.getCursorPosition())
        }
      }
    })

    // Listen for cursor position changes
    this.editor.onDidChangeCursorPosition((e) => {
      if (this.currentFile && window.collaboration) {
        window.collaboration.sendCursorMove(this.getCursorPosition())
      }
    })

    // Hide the no-file message
    document.getElementById("no-file-message").style.display = "none"
  }

  getCursorPosition() {
    if (!this.editor) return { line: 0, column: 0 }

    const position = this.editor.getPosition()
    return {
      line: position.lineNumber,
      column: position.column,
    }
  }

  setCursorPosition(line, column) {
    if (!this.editor) return

    this.editor.setPosition({
      lineNumber: line,
      column: column,
    })
  }

  createFile(filePath, content = "") {
    this.files.set(filePath, content)
    this.openTab(filePath)
    this.updateFileTree()
  }

  deleteFile(filePath) {
    this.files.delete(filePath)
    this.closeTab(filePath)
    this.updateFileTree()
  }

  openTab(filePath) {
    if (!this.openTabs.has(filePath)) {
      this.openTabs.set(filePath, {
        path: filePath,
        name: this.getFileName(filePath),
        language: this.getLanguageFromPath(filePath),
      })
    }

    this.switchToFile(filePath)
    this.updateTabs()
  }

  closeTab(filePath) {
    this.openTabs.delete(filePath)

    if (this.currentFile === filePath) {
      // Switch to another tab or show no-file message
      const remainingTabs = Array.from(this.openTabs.keys())
      if (remainingTabs.length > 0) {
        this.switchToFile(remainingTabs[0])
      } else {
        this.currentFile = null
        if (this.editor) {
          this.editor.setValue("")
        }
        document.getElementById("no-file-message").style.display = "flex"
      }
    }

    this.updateTabs()
  }

  switchToFile(filePath) {
    if (!this.isInitialized || !this.editor) {
      setTimeout(() => this.switchToFile(filePath), 100)
      return
    }

    this.currentFile = filePath
    const content = this.files.get(filePath) || ""
    const language = this.getLanguageFromPath(filePath)

    // Set editor content and language
    this.isReceivingUpdate = true
    this.monaco.editor.setModelLanguage(this.editor.getModel(), language)
    this.editor.setValue(content)
    this.isReceivingUpdate = false

    // Hide no-file message
    document.getElementById("no-file-message").style.display = "none"

    // Update active tab
    this.updateTabs()
    this.updateFileTree()
  }

  updateContent(filePath, content) {
    this.files.set(filePath, content)

    if (this.currentFile === filePath && this.editor) {
      this.isReceivingUpdate = true
      this.editor.setValue(content)
      this.isReceivingUpdate = false
    }
  }

  updateTabs() {
    const tabsContainer = document.getElementById("editor-tabs")
    tabsContainer.innerHTML = ""

    this.openTabs.forEach((tab, filePath) => {
      const tabElement = document.createElement("div")
      tabElement.className = `tab ${this.currentFile === filePath ? "active" : ""}`
      tabElement.innerHTML = `
                <i class="fas fa-file-code"></i>
                <span>${tab.name}</span>
                <button class="tab-close" onclick="window.codeEditor.closeTab('${filePath}')">&times;</button>
            `

      tabElement.addEventListener("click", (e) => {
        if (!e.target.classList.contains("tab-close")) {
          this.switchToFile(filePath)
        }
      })

      tabsContainer.appendChild(tabElement)
    })
  }

  updateFileTree() {
    const fileTree = document.getElementById("file-tree")
    fileTree.innerHTML = ""

    // Group files by folders
    const fileStructure = this.buildFileStructure()
    this.renderFileStructure(fileTree, fileStructure)
  }

  buildFileStructure() {
    const structure = { files: [], folders: {} }

    this.files.forEach((content, filePath) => {
      const parts = filePath.split("/")
      let current = structure

      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i]
        if (!current.folders[folderName]) {
          current.folders[folderName] = { files: [], folders: {} }
        }
        current = current.folders[folderName]
      }

      current.files.push({
        name: parts[parts.length - 1],
        path: filePath,
      })
    })

    return structure
  }

  renderFileStructure(container, structure, level = 0) {
    // Render folders
    Object.keys(structure.folders).forEach((folderName) => {
      const folderElement = document.createElement("div")
      folderElement.className = "folder-item"
      folderElement.style.paddingLeft = `${level * 20}px`
      folderElement.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${folderName}</span>
            `
      container.appendChild(folderElement)

      // Render folder contents
      this.renderFileStructure(container, structure.folders[folderName], level + 1)
    })

    // Render files
    structure.files.forEach((file) => {
      const fileElement = document.createElement("div")
      fileElement.className = `file-item ${this.currentFile === file.path ? "active" : ""}`
      fileElement.style.paddingLeft = `${level * 20}px`
      fileElement.innerHTML = `
                <i class="fas fa-file-code file-icon ${this.getFileExtension(file.name)}"></i>
                <span>${file.name}</span>
            `

      fileElement.addEventListener("click", () => {
        this.openTab(file.path)
      })

      container.appendChild(fileElement)
    })
  }

  getFileName(filePath) {
    return filePath.split("/").pop()
  }

  getFileExtension(fileName) {
    return fileName.split(".").pop().toLowerCase()
  }

  getLanguageFromPath(filePath) {
    const extension = this.getFileExtension(filePath)
    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      scss: "scss",
      py: "python",
      json: "json",
      md: "markdown",
      txt: "plaintext",
    }

    return languageMap[extension] || "plaintext"
  }

  async completeCode() {
    if (!this.editor || !this.currentFile) return

    const code = this.editor.getValue()
    const language = this.getLanguageFromPath(this.currentFile)

    try {
      const completion = await this.groqService.completeCode(code, language) // Use this.groqService

      // Show completion in AI panel
      this.showAIResult("Code Completion", completion)
    } catch (error) {
      this.showAIResult("Error", `Failed to complete code: ${error.message}`)
    }
  }

  async explainCode() {
    if (!this.editor || !this.currentFile) return

    const selectedText = this.editor.getModel().getValueInRange(this.editor.getSelection())
    const code = selectedText || this.editor.getValue()

    try {
      const explanation = await this.groqService.explainCode(code) // Use this.groqService

      // Show explanation in AI panel
      this.showAIResult("Code Explanation", explanation)
    } catch (error) {
      this.showAIResult("Error", `Failed to explain code: ${error.message}`)
    }
  }

  showAIResult(title, content) {
    const aiPanel = document.getElementById("ai-panel")
    const aiContent = document.getElementById("ai-content")

    aiContent.innerHTML = `
            <h4>${title}</h4>
            <div style="background: #1e1e1e; padding: 15px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap; font-family: 'Courier New', monospace;">${content}</div>
        `

    aiPanel.classList.add("active")
  }
}

// Global instance
const codeEditor = new CodeEditor()
window.codeEditor = codeEditor
