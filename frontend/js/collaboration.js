// Import the io function from socket.io-client
import { io } from "socket.io-client"

class CollaborationManager {
  constructor() {
    this.socket = null
    this.roomId = null
    this.username = null
    this.isConnected = false
    this.remoteCursors = new Map()

    this.initializeSocket()
  }

  initializeSocket() {
    this.socket = io("http://localhost:5000")

    this.socket.on("connect", () => {
      console.log("Connected to server")
      this.isConnected = true
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server")
      this.isConnected = false
    })

    this.socket.on("room_state", (data) => {
      console.log("Received room state:", data)
      this.handleRoomState(data)
    })

    this.socket.on("user_joined", (data) => {
      console.log("User joined:", data)
      this.addUserToList(data.username, data.user_id)
    })

    this.socket.on("user_left", (data) => {
      console.log("User left:", data)
      this.removeUserFromList(data.user_id)
    })

    this.socket.on("code_update", (data) => {
      console.log("Code update received:", data)
      this.handleCodeUpdate(data)
    })

    this.socket.on("cursor_update", (data) => {
      console.log("Cursor update received:", data)
      this.handleCursorUpdate(data)
    })

    this.socket.on("file_created", (data) => {
      console.log("File created:", data)
      if (window.codeEditor) {
        window.codeEditor.createFile(data.file_path, data.content)
      }
    })

    this.socket.on("file_deleted", (data) => {
      console.log("File deleted:", data)
      if (window.codeEditor) {
        window.codeEditor.deleteFile(data.file_path)
      }
    })

    this.socket.on("file_selected", (data) => {
      console.log("File selected:", data)
      if (window.codeEditor) {
        window.codeEditor.switchToFile(data.file_path)
      }
    })
  }

  joinRoom(roomId, username) {
    this.roomId = roomId
    this.username = username

    this.socket.emit("join_room", {
      room_id: roomId,
      username: username,
    })

    // Update UI
    document.getElementById("room-info").textContent = `Room: ${roomId}`
  }

  leaveRoom() {
    if (this.roomId) {
      this.socket.emit("leave_room", {
        room_id: this.roomId,
      })

      this.roomId = null
      this.username = null
    }
  }

  sendCodeChange(filePath, content, cursorPosition) {
    if (this.roomId && this.isConnected) {
      this.socket.emit("code_change", {
        room_id: this.roomId,
        file_path: filePath,
        content: content,
        cursor_position: cursorPosition,
      })
    }
  }

  sendCursorMove(cursorPosition) {
    if (this.roomId && this.isConnected) {
      this.socket.emit("cursor_move", {
        room_id: this.roomId,
        cursor_position: cursorPosition,
      })
    }
  }

  createFile(filePath, content = "") {
    if (this.roomId && this.isConnected) {
      this.socket.emit("create_file", {
        room_id: this.roomId,
        file_path: filePath,
        content: content,
      })
    }
  }

  deleteFile(filePath) {
    if (this.roomId && this.isConnected) {
      this.socket.emit("delete_file", {
        room_id: this.roomId,
        file_path: filePath,
      })
    }
  }

  selectFile(filePath) {
    if (this.roomId && this.isConnected) {
      this.socket.emit("select_file", {
        room_id: this.roomId,
        file_path: filePath,
      })
    }
  }

  handleRoomState(data) {
    // Load existing files
    Object.entries(data.files).forEach(([filePath, content]) => {
      if (window.codeEditor) {
        window.codeEditor.createFile(filePath, content)
      }
    })

    // Update user list
    this.updateUserList(data.users)

    // Select current file if any
    if (data.current_file && window.codeEditor) {
      window.codeEditor.switchToFile(data.current_file)
    }
  }

  handleCodeUpdate(data) {
    // Update file content
    if (window.codeEditor) {
      window.codeEditor.updateContent(data.file_path, data.content)
    }

    // Update remote cursor
    this.updateRemoteCursor(data.user_id, data.cursor_position)
  }

  handleCursorUpdate(data) {
    this.updateRemoteCursor(data.user_id, data.cursor_position, data.username)
  }

  updateRemoteCursor(userId, position, username) {
    // This would be implemented with Monaco Editor decorations
    // For now, we'll just store the cursor positions
    this.remoteCursors.set(userId, {
      position: position,
      username: username,
    })
  }

  addUserToList(username, userId) {
    const activeUsers = document.getElementById("active-users")

    const userBadge = document.createElement("div")
    userBadge.className = "user-badge"
    userBadge.id = `user-${userId}`
    userBadge.textContent = username

    activeUsers.appendChild(userBadge)
  }

  removeUserFromList(userId) {
    const userElement = document.getElementById(`user-${userId}`)
    if (userElement) {
      userElement.remove()
    }

    // Remove remote cursor
    this.remoteCursors.delete(userId)
  }

  updateUserList(users) {
    const activeUsers = document.getElementById("active-users")
    activeUsers.innerHTML = ""

    users.forEach((user) => {
      if (user.username !== this.username) {
        this.addUserToList(user.username, "unknown")
      }
    })
  }
}

// Global instance
const collaboration = new CollaborationManager()
window.collaboration = collaboration
