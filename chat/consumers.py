from channels.consumer import SyncConsumer, AsyncConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync, sync_to_async
from django.contrib.auth.models import User
from chat.models import Message, Thread, UserSetting
import json
from rich.console import Console
console = Console(style='bold green')


class ChatConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        self.me = self.scope['user']
        them_id = self.scope['url_route']['kwargs']['id']
        self.them_user = await sync_to_async(User.objects.get)(id=them_id)
        self.thread = await sync_to_async(Thread.objects.get_or_create_thread)(self.me, self.them_user)
        self.room_name = f'{self.thread.name}'
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.send({
            'type': 'websocket.accept',
        })

        console.print(f'{self.channel_name} - You are connected')

    async def websocket_receive(self, event):
        console.print(f'[{self.channel_name}] - Received message: {event["text"]}')

        await self.store_message(event.get('text'))

        msg = json.dumps({
            'text': event.get('text'),
            'user': self.me.id
        })

        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': msg,
            },
        )
        
        await self.send_recent(self.me, self.them_user)
        await self.send_recent(self.them_user, self.me)
    
    async def websocket_message(self, event):
        console.print(f'[{self.channel_name}] - Message send: {event["text"]}')

        await self.send({
            'type': 'websocket.send',
            'text': 'None',
        })


    async def websocket_disconnect(self, event):
        console.print(f'[{self.channel_name}] - Disconnected')

        await self.channel_layer.group_discard(self.room_name, self.channel_name)


    @database_sync_to_async
    def store_message(self, text):
        Message.objects.create(
            thread = self.thread,
            sender = self.scope['user'],
            text = text,
        )

    async def send_recent(self, usr1, usr2):
        await self.channel_layer.group_send(
            str(usr1.id),
            {
                'type': 'websocket.message',
                'text': str(usr2.id),
            },
        )


class OnlineConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        self.room_name = 'online-users'
        await self.send({
            'type': 'websocket.accept',
        })
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        
        self.me = self.scope['user']
        console.print(f'[{self.me}] - ONLINE {self.scope["user"].id}')

    async def websocket_receive(self, event):
        user = self.scope['user']

        await self.send_msg(user, event.get('text'))
        await self.store_is_online(user, True)

    
    async def websocket_message(self, event):
        await self.send({
            'type': 'websocket.send',
            'text': event.get('text'),
        })

    async def websocket_disconnect(self, event):
        user = self.scope['user']
        console.print(f'[{self.me}] - OFFLINE {user.id}')

        await self.send_msg(user, 'false')
        await self.store_is_online(user, False)

        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def send_msg(self, user, text):
        msg = json.dumps({
            'set': text,
            'user': user.id
        })

        console.print(f'Online dot {msg}')

        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': msg,
            },
        )
    
    async def store_is_online(self, user, value):
        settings = await sync_to_async(UserSetting.objects.get)(id=user.id)
        settings.is_online = value
        await sync_to_async(settings.save)()



class NotifiConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        me = self.scope['user']
        self.room_name = str(me.id)
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.send({
            'type': 'websocket.accept',
        })

        console.print(f'{self.channel_name} - You are connected {me.id}')

    async def websocket_receive(self, event):
        console.print(f'[{self.channel_name}] - Received message: {event["text"]}')

        msg = json.dumps({
            'text': 'text',
        })

        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'websocket.message',
                'text': msg,
            },
        )
    
    async def websocket_message(self, event):
        console.print(f'[{self.channel_name}] - Message send: {event["text"]} {self.channel_name}')

        await self.send(
            {
                'type': 'websocket.send',
                'text': event.get('text'),
            }
        )


    async def websocket_disconnect(self, event):
        console.print(f'[{self.channel_name}] - Disconnected')

        await self.channel_layer.group_discard(self.room_name, self.channel_name)