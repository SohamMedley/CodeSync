import requests
import json

class GroqService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def complete_code(self, code, language="javascript"):
        prompt = f"""
        Complete this {language} code. Only return the completion, no explanations:
        
        {code}
        """
        
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a code completion assistant. Only return the code completion without any explanations or markdown formatting."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.1
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                return f"Error: {response.status_code}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def explain_code(self, code):
        prompt = f"""
        Explain this code in simple terms:
        
        {code}
        """
        
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful coding assistant. Explain code clearly and concisely."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                return f"Error: {response.status_code}"
                
        except Exception as e:
            return f"Error: {str(e)}"
