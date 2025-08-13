import firebase_admin
from firebase_admin import credentials, firestore, db
import json

class FirebaseService:
    def __init__(self):
        # Initialize Firebase Admin SDK
        # You'll need to download the service account key from Firebase Console
        # For now, we'll use a simple initialization
        try:
            if not firebase_admin._apps:
                # Initialize with default credentials (you can add service account later)
                firebase_admin.initialize_app()
            self.db = firestore.client()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            self.db = None
    
    def save_project(self, project_id, project_data):
        if self.db:
            try:
                doc_ref = self.db.collection('projects').document(project_id)
                doc_ref.set(project_data)
                return True
            except Exception as e:
                print(f"Error saving project: {e}")
                return False
        return False
    
    def load_project(self, project_id):
        if self.db:
            try:
                doc_ref = self.db.collection('projects').document(project_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                print(f"Error loading project: {e}")
        return None
    
    def save_file(self, project_id, file_path, content):
        if self.db:
            try:
                doc_ref = self.db.collection('projects').document(project_id).collection('files').document(file_path.replace('/', '_'))
                doc_ref.set({
                    'path': file_path,
                    'content': content,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                return True
            except Exception as e:
                print(f"Error saving file: {e}")
                return False
        return False
