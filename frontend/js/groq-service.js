class GroqService {
  constructor() {
    this.baseUrl = "http://localhost:5000/api/groq"
  }

  async completeCode(code, language = "javascript") {
    try {
      const response = await fetch(`${this.baseUrl}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          language: language,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return data.completion
      } else {
        throw new Error(data.error || "Failed to complete code")
      }
    } catch (error) {
      console.error("Groq completion error:", error)
      throw error
    }
  }

  async explainCode(code) {
    try {
      const response = await fetch(`${this.baseUrl}/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return data.explanation
      } else {
        throw new Error(data.error || "Failed to explain code")
      }
    } catch (error) {
      console.error("Groq explanation error:", error)
      throw error
    }
  }
}

// Global instance
const groqService = new GroqService()
