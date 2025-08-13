class CodeSyncApp {
  constructor() {
    this.currentScreen = "login"
    this.initializeEventListeners()
    this.initializeModals()
  }

  initializeEventListeners() {
    // Login screen
    document.getElementById("join-btn").addEventListener("click", () => {
      this.joinRoom()
    })

    // Allow Enter key in login inputs
    document.getElementById("username").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.joinRoom()
    })

    document.getElementById("room-id").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.joinRoom()
    })

    // Header buttons
    document.getElementById("ai-complete-btn").addEventListener("click", () => {
      if (window.codeEditor) {
        window.codeEditor.completeCode()
      }
    })

    document.getElementById("ai-explain-btn").addEventListener("click", () => {
      if (window.codeEditor) {
        window.codeEditor.explainCode()
      }
    })

    document.getElementById("leave-room-btn").addEventListener("click", () => {
      this.leaveRoom()
    })

    // File management
    document.getElementById("new-file-btn").addEventListener("click", () => {
      this.showModal("new-file-modal")
    })

    document.getElementById("new-folder-btn").addEventListener("click", () => {
      this.showModal("new-folder-modal")
    })

    // AI Panel
    document.getElementById("close-ai-panel").addEventListener("click", () => {
      document.getElementById("ai-panel").classList.remove("active")
    })

    // File creation
    document.getElementById("create-file-btn").addEventListener("click", () => {
      this.createNewFile()
    })

    document.getElementById("create-folder-btn").addEventListener("click", () => {
      this.createNewFolder()
    })

    // Template buttons
    document.querySelectorAll(".template-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const template = e.target.dataset.template
        this.applyFileTemplate(template)
      })
    })
  }

  initializeModals() {
    // Close modal when clicking outside or on close button
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id)
        }
      })
    })

    document.querySelectorAll(".close-modal, .cancel-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal")
        this.hideModal(modal.id)
      })
    })
  }

  joinRoom() {
    const username = document.getElementById("username").value.trim()
    const roomId = document.getElementById("room-id").value.trim() || this.generateRoomId()

    if (!username) {
      alert("Please enter a username")
      return
    }

    if (username.length > 20) {
      alert("Username must be 20 characters or less")
      return
    }

    // Switch to editor screen
    this.switchScreen("editor")

    // Join the collaboration room
    if (window.collaboration) {
      window.collaboration.joinRoom(roomId, username)
    }

    // Create a default file if room is empty
    setTimeout(() => {
      if (window.codeEditor && window.codeEditor.files.size === 0) {
        window.codeEditor.createFile(
          "main.js",
          '// Welcome to CodeSync!\n// Start coding together!\n\nconsole.log("Hello, CodeSync!");',
        )
      }
    }, 1000)
  }

  leaveRoom() {
    if (window.collaboration) {
      window.collaboration.leaveRoom()
    }
    this.switchScreen("login")

    // Clear editor state
    if (window.codeEditor) {
      window.codeEditor.files.clear()
      window.codeEditor.openTabs.clear()
      window.codeEditor.currentFile = null

      if (window.codeEditor.editor) {
        window.codeEditor.editor.setValue("")
      }
    }

    // Clear form
    document.getElementById("username").value = ""
    document.getElementById("room-id").value = ""
  }

  switchScreen(screenName) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active")
    })

    document.getElementById(`${screenName}-screen`).classList.add("active")
    this.currentScreen = screenName
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add("active")

    // Focus on input
    const input = document.querySelector(`#${modalId} input`)
    if (input) {
      setTimeout(() => input.focus(), 100)
    }
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active")

    // Clear inputs
    document.querySelectorAll(`#${modalId} input`).forEach((input) => {
      input.value = ""
    })
  }

  createNewFile() {
    const fileName = document.getElementById("new-file-name").value.trim()

    if (!fileName) {
      alert("Please enter a file name")
      return
    }

    if (window.codeEditor && window.codeEditor.files.has(fileName)) {
      alert("File already exists")
      return
    }

    // Create file locally and broadcast to others
    const content = this.getTemplateContent(fileName)
    if (window.codeEditor) {
      window.codeEditor.createFile(fileName, content)
    }
    if (window.collaboration) {
      window.collaboration.createFile(fileName, content)
    }

    this.hideModal("new-file-modal")
  }

  createNewFolder() {
    const folderName = document.getElementById("new-folder-name").value.trim()

    if (!folderName) {
      alert("Please enter a folder name")
      return
    }

    // Create a placeholder file in the folder
    const placeholderFile = `${folderName}/.gitkeep`
    if (window.codeEditor) {
      window.codeEditor.createFile(placeholderFile, "")
    }
    if (window.collaboration) {
      window.collaboration.createFile(placeholderFile, "")
    }

    this.hideModal("new-folder-modal")
  }

  applyFileTemplate(template) {
    const fileNameInput = document.getElementById("new-file-name")
    const templates = {
      js: "script.js",
      html: "index.html",
      css: "style.css",
      py: "main.py",
    }

    fileNameInput.value = templates[template] || "file.txt"
  }

  getTemplateContent(fileName) {
    const extension = fileName.split(".").pop().toLowerCase()

    const templates = {
      js: '// JavaScript file\nconsole.log("Hello, World!");',
      html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
      css: "/* CSS file */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}",
      py: '# Python file\nprint("Hello, World!")',
      json: '{\n    "name": "project",\n    "version": "1.0.0"\n}',
      md: "# Markdown File\n\nThis is a markdown file.",
    }

    return templates[extension] || ""
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new CodeSyncApp()

  // Make it globally accessible for debugging
  window.codeSyncApp = app
})

// Handle page refresh/close
window.addEventListener("beforeunload", () => {
  if (window.collaboration && window.collaboration.roomId) {
    window.collaboration.leaveRoom()
  }
})
