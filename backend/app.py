from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import json
import os
from datetime import datetime
from websocket_handler import WebSocketHandler
from groq_service import GroqService
from firebase_service import FirebaseService

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize services
groq_service = GroqService("YOUR_API_KEY")
firebase_service = FirebaseService()
websocket_handler = WebSocketHandler(socketio, firebase_service)

# Store active rooms and users
active_rooms = {}
user_cursors = {}

@app.route('/')
def index():
    return "CodeSync Backend Server Running!"

@app.route('/api/groq/complete', methods=['POST'])
def groq_complete():
    try:
        data = request.json
        code = data.get('code', '')
        language = data.get('language', 'javascript')
        
        completion = groq_service.complete_code(code, language)
        return jsonify({'completion': completion, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/groq/explain', methods=['POST'])
def groq_explain():
    try:
        data = request.json
        code = data.get('code', '')
        
        explanation = groq_service.explain_code(code)
        return jsonify({'explanation': explanation, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@socketio.on('connect')
def on_connect():
    print(f'User connected: {request.sid}')
    emit('connected', {'status': 'Connected to CodeSync'})

@socketio.on('disconnect')
def on_disconnect():
    print(f'User disconnected: {request.sid}')
    websocket_handler.handle_disconnect(request.sid)

@socketio.on('join_room')
def on_join_room(data):
    room_id = data['room_id']
    username = data['username']
    
    join_room(room_id)
    
    if room_id not in active_rooms:
        active_rooms[room_id] = {
            'users': {},
            'files': {},
            'current_file': None
        }
    
    active_rooms[room_id]['users'][request.sid] = {
        'username': username,
        'cursor_position': {'line': 0, 'column': 0}
    }
    
    # Send current room state to new user
    emit('room_state', {
        'files': active_rooms[room_id]['files'],
        'current_file': active_rooms[room_id]['current_file'],
        'users': list(active_rooms[room_id]['users'].values())
    })
    
    # Notify others about new user
    emit('user_joined', {
        'username': username,
        'user_id': request.sid
    }, room=room_id, include_self=False)

@socketio.on('leave_room')
def on_leave_room(data):
    room_id = data['room_id']
    leave_room(room_id)
    
    if room_id in active_rooms and request.sid in active_rooms[room_id]['users']:
        username = active_rooms[room_id]['users'][request.sid]['username']
        del active_rooms[room_id]['users'][request.sid]
        
        emit('user_left', {
            'username': username,
            'user_id': request.sid
        }, room=room_id)

@socketio.on('code_change')
def on_code_change(data):
    room_id = data['room_id']
    file_path = data['file_path']
    content = data['content']
    cursor_position = data.get('cursor_position', {'line': 0, 'column': 0})
    
    if room_id in active_rooms:
        # Update file content
        active_rooms[room_id]['files'][file_path] = content
        
        # Update user cursor position
        if request.sid in active_rooms[room_id]['users']:
            active_rooms[room_id]['users'][request.sid]['cursor_position'] = cursor_position
        
        # Broadcast to other users in the room
        emit('code_update', {
            'file_path': file_path,
            'content': content,
            'user_id': request.sid,
            'cursor_position': cursor_position
        }, room=room_id, include_self=False)

@socketio.on('cursor_move')
def on_cursor_move(data):
    room_id = data['room_id']
    cursor_position = data['cursor_position']
    
    if room_id in active_rooms and request.sid in active_rooms[room_id]['users']:
        active_rooms[room_id]['users'][request.sid]['cursor_position'] = cursor_position
        
        emit('cursor_update', {
            'user_id': request.sid,
            'username': active_rooms[room_id]['users'][request.sid]['username'],
            'cursor_position': cursor_position
        }, room=room_id, include_self=False)

@socketio.on('create_file')
def on_create_file(data):
    room_id = data['room_id']
    file_path = data['file_path']
    content = data.get('content', '')
    
    if room_id in active_rooms:
        active_rooms[room_id]['files'][file_path] = content
        
        emit('file_created', {
            'file_path': file_path,
            'content': content
        }, room=room_id)

@socketio.on('delete_file')
def on_delete_file(data):
    room_id = data['room_id']
    file_path = data['file_path']
    
    if room_id in active_rooms and file_path in active_rooms[room_id]['files']:
        del active_rooms[room_id]['files'][file_path]
        
        emit('file_deleted', {
            'file_path': file_path
        }, room=room_id)

@socketio.on('select_file')
def on_select_file(data):
    room_id = data['room_id']
    file_path = data['file_path']
    
    if room_id in active_rooms:
        active_rooms[room_id]['current_file'] = file_path
        
        emit('file_selected', {
            'file_path': file_path,
            'content': active_rooms[room_id]['files'].get(file_path, '')
        }, room=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
