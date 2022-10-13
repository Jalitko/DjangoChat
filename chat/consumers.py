from channels.consumer import SyncConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from chat.models import Thread
import json

def log(*args, **kwargs):
    WARNING = f'\033[94m\033[1m{args[0]}'
    ENDC = '\033[0m'
    args = list(args)
    args.pop(0)
    args = tuple(args)
    args = (WARNING, *args, ENDC)
    print(*args, **kwargs)

class ChatConsumer(SyncConsumer):
    def websocket_connect(self, event):
        me = self.scope['user']
        them = self.scope['url_route']['kwargs']['id']
        them_user = User.objects.get(id=them)
        thread = Thread.objects.get_or_create_thread(me, them_user)
        self.room_name = f'{thread.name}'
        async_to_sync(self.channel_layer.group_add)(self.room_name, self.channel_name)
        self.send({
            'type': 'websocket.accept',
        })

        log(f'[{self.channel_name}] - You are connected')

    def websocket_receive(self, event):
        log(f'[{self.channel_name}] - Received message: {event["text"]}')

        msg = json.dumps({
            'text': event.get('text'),
            'user': self.scope['user'].id
        })

        async_to_sync(self.channel_layer.group_send)(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': msg,
            },
        )
    
    def websocket_message(self, event):
        log(f'[{self.channel_name}] - Message send: {event["text"]}')

        self.send({
            'type': 'websocket.send',
            'text': event.get('text'),
        })


    def websocket_disconnect(self, event):
        log(f'[{self.channel_name}] - Disconnected')

        async_to_sync(self.channel_layer.group_discard)(self.room_name, self.channel_name)


class EchoConsumer(SyncConsumer):
    def websocket_connect(self, event):
        self.room_name = 'broadcast'
        self.send({
            'type': 'websocket.accept',
        })
        async_to_sync(self.channel_layer.group_add)(self.room_name, self.channel_name)
        log(f'[{self.channel_name}] - You are connected')

    def websocket_receive(self, event):
        log(f'[{self.channel_name}] - Received message: {event["text"]}')
        async_to_sync(self.channel_layer.group_send)(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': event.get('text'),
            },
        )
    
    def websocket_message(self, event):
        log(f'[{self.channel_name}] - Message send: {event["text"]}')

        self.send({
            'type': 'websocket.send',
            'text': event.get('text'),
        })


    def websocket_disconnect(self, event):
        log(f'[{self.channel_name}] - Disconnected')

        async_to_sync(self.channel_layer.group_discard)(self.room_name, self.channel_name)
    