from channels.consumer import SyncConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from chat.models import Message, Thread
import json
from rich.console import Console
console = Console(style='bold green')


class ChatConsumer(SyncConsumer):
    def websocket_connect(self, event):
        me = self.scope['user']
        them = self.scope['url_route']['kwargs']['id']
        them_user = User.objects.get(id=them)
        self.thread = Thread.objects.get_or_create_thread(me, them_user)
        self.room_name = f'{self.thread.name}'
        async_to_sync(self.channel_layer.group_add)(self.room_name, self.channel_name)
        self.send({
            'type': 'websocket.accept',
        })

        console.print(f'[{self.channel_name}] - You are connected')

    def websocket_receive(self, event):
        console.print(f'[{self.channel_name}] - Received message: {event["text"]}')

        msg = json.dumps({
            'text': event.get('text'),
            'user': self.scope['user'].id
        })

        self.store_message(event.get('text'))

        async_to_sync(self.channel_layer.group_send)(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': msg,
            },
        )
    
    def websocket_message(self, event):
        console.print(f'[{self.channel_name}] - Message send: {event["text"]}')

        self.send({
            'type': 'websocket.send',
            'text': event.get('text'),
        })


    def websocket_disconnect(self, event):
        console.print(f'[{self.channel_name}] - Disconnected')

        async_to_sync(self.channel_layer.group_discard)(self.room_name, self.channel_name)


    def store_message(self, text):
        Message.objects.create(
            thread = self.thread,
            sender = self.scope['user'],
            text = text,
        )



class EchoConsumer(SyncConsumer):
    def websocket_connect(self, event):
        self.room_name = 'broadcast'
        self.send({
            'type': 'websocket.accept',
        })
        async_to_sync(self.channel_layer.group_add)(self.room_name, self.channel_name)
        console.print(f'[{self.channel_name}] - You are connected')

    def websocket_receive(self, event):
        console.print(f'[{self.channel_name}] - Received message: {event["text"]}')
        async_to_sync(self.channel_layer.group_send)(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': event.get('text'),
            },
        )
    
    def websocket_message(self, event):
        console.print(f'[{self.channel_name}] - Message send: {event["text"]}')

        self.send({
            'type': 'websocket.send',
            'text': event.get('text'),
        })


    def websocket_disconnect(self, event):
        console.print(f'[{self.channel_name}] - Disconnected')

        async_to_sync(self.channel_layer.group_discard)(self.room_name, self.channel_name)
    