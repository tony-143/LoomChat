import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Meeting, AnonymousParticipant, Participants

class MeetingChatConsumer(AsyncWebsocketConsumer):
    meeting_group_name = None

    async def connect(self):
        self.meeting_id = self.scope['url_route']['kwargs']['meeting_id']
        self.user = self.scope['url_route']['kwargs']['user']
        self.meeting_group_name = f'meeting_{self.meeting_id}'
        
        try:
            # Fetch meeting asynchronously
            meeting = await sync_to_async(Meeting.objects.get)(meeting_code=self.meeting_id)
            self.is_host = await sync_to_async(lambda: meeting.host.first_name == self.user)()
        except Meeting.DoesNotExist:
            await self.close()  # Close connection if meeting does not exist
            return
        
        # print(f"User is host: {self.is_host}")
        # print(f"User is : {self.user}")
        # print(f"User : {meeting.host.first_name}")

        # Add the user to the meeting group
        await self.channel_layer.group_add(
            self.meeting_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if self.meeting_group_name:  # Check if it has been set
            await self.channel_layer.group_discard(
                self.meeting_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        
        
        if message_type == 'offer' or message_type == 'answer' or message_type == 'ice-candidate':
            await self.channel_layer.group_send(
                self.meeting_group_name,
                {
                    'type': 'send_message',
                    'message': text_data
                }
            )

        # Send the message to the meeting group
        elif message_type == 'join_request':
            await self.channel_layer.group_send(
                self.meeting_group_name,
                {
                    'type': 'meeting_join_request',
                    'user': self.user,
                    'message': f'{self.user} has requested to join the meeting.'
                }
            )

        elif message_type == 'join_approval' and self.is_host:
            approved_user = text_data_json['user']
            await self.channel_layer.group_send(
                self.meeting_group_name,
                {
                    'type': 'meeting_join_approved',
                    'user': approved_user,
                    'message': f'{approved_user} has been approved to join the meeting.'
                }
            )

        elif message_type == 'message':
            # Fetch meeting asynchronously
            try:
                meeting = await sync_to_async(Meeting.objects.get)(meeting_code=self.meeting_id)
                # Fetch both types of participants in parallel
                user_ = await sync_to_async(lambda: AnonymousParticipant.objects.filter(meeting=meeting, name=self.user))()
                auth_user = await sync_to_async(lambda: Participants.objects.filter(meeting=meeting, name=self.user))()
                
                user_exists = await sync_to_async(user_.exists)()
                user_first = await sync_to_async(lambda: user_.first())()
                auth_user_exists = await sync_to_async(auth_user.exists)()
                auth_user_first = await sync_to_async(lambda: auth_user.first())()
                
                if self.is_host or (user_exists and user_first.approval) or (auth_user_exists and auth_user_first.approval):
                    
                    message = text_data_json['message']
                    
                    await self.channel_layer.group_send(
                        self.meeting_group_name,
                        {
                            'type': 'meeting_chat_message',
                            'message': message,
                            'user': self.user
                        }
                    )
                else:
                    await self.send(text_data=json.dumps({
                        'error': 'You are not approved to join this meeting.'
                    }))
            except Meeting.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'error': 'Meeting does not exist.'
                }))
                
    async def send_message(self, event):
        message = event['message']
        await self.send(text_data=message)

    async def meeting_chat_message(self, event):
        message = event['message']
        user = event['user']
        
        # Send the message to WebSocket
        await self.send(text_data=json.dumps({
            'type':'message',
            'message': message,
            'user': user
        }))
    
    async def meeting_join_request(self, event):
        user = event['user']
        if self.is_host:
            await self.send(text_data=json.dumps({
                'type': 'join_request',
                'user': user,
                'message': f'{user} has requested to join the meeting.'
            }))

    async def meeting_join_approved(self, event):
        user = event['user']
        print(user,'-------')
        if self.user == user:
            await self.send(text_data=json.dumps({
                'type': 'join_approved',
                'message': 'You have been approved to join the meeting!'
            }))
