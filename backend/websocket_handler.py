class WebSocketHandler:
    def __init__(self, socketio, firebase_service):
        self.socketio = socketio
        self.firebase_service = firebase_service
        self.active_connections = {}
    
    def handle_disconnect(self, session_id):
        if session_id in self.active_connections:
            room_id = self.active_connections[session_id].get('room_id')
            if room_id:
                self.socketio.emit('user_disconnected', {
                    'user_id': session_id
                }, room=room_id)
            del self.active_connections[session_id]
    
    def broadcast_to_room(self, room_id, event, data):
        self.socketio.emit(event, data, room=room_id)
