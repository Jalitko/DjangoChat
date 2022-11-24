from channels.consumer import SyncConsumer, AsyncConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync, sync_to_async
from django.contrib.auth.models import User
from chat.models import Message, Thread, UserSetting
import json
from rich.console import Console
console = Console(style='bold green')


online_users = []
class WebConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        self.me = self.scope['user']
        self.room_name = str(self.me.id)
        
        online_users.append(self.me.id)
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.send({
            'type': 'websocket.accept',
        })

        console.print(f'You are connected {self.room_name}')

    async def websocket_receive(self, event):
        event = json.loads(event['text'])
        console.print(f'Received message: {event["type"]}')

        if   event['type'] == 'message':
            msg = await self.send_msg(event)
            await self.send_users(msg, [self.me.id, self.them_user.id])
        elif event['type'] == 'online':
            msg = await self.send_online(event)
            console.print(online_users)
            await self.send_users(msg, [])
        elif event['type'] == 'read':
            msg = await sync_to_async(Message.objects.get)(id=event['id'])
            msg.isread = True
            await sync_to_async(msg.save)()
            
            msg_thread = await sync_to_async(Thread.objects.get)(message=msg)
            await self.unread(msg_thread, int(event['user']), -1)

    
    async def websocket_message(self, event):
        await self.send(
            {
                'type': 'websocket.send',
                'text': event.get('text'),
            }
        )

    async def websocket_disconnect(self, event):
        console.print(f'[{self.channel_name}] - Disconnected')

        event = json.loads('''{
            "type": "online",
            "set": "false"
        }''')

        online_users.remove(self.me.id)
        msg = await self.send_online(event)
        await self.send_users(msg, [])

        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def send_msg(self, msg):
        
        them_id = msg['to']
        self.them_user = await sync_to_async(User.objects.get)(id=them_id)
        self.thread = await sync_to_async(Thread.objects.get_or_create_thread)(self.me, self.them_user)
        await self.store_message(msg['message'])
        await self.unread(self.thread, self.me.id, 1)

        await self.send_notifi([self.me.id, self.them_user.id])
        return json.dumps({
            'type': 'message',
            'sender': them_id,
        })

    @database_sync_to_async
    def store_message(self, text):
        Message.objects.create(
            thread = self.thread,
            sender = self.scope['user'],
            text = text,
        )

    async def send_users(self, msg, users=[]):
        if not users: users = online_users

        for user in users:
            await self.channel_layer.group_send(
                str(user),
                {
                    'type': 'websocket.message',
                    'text': msg,
                },
            )

    async def send_online(self, event):
        user = self.scope['user']
        await self.store_is_online(user, event['set'])
        return json.dumps({
            'type': 'online',
            'set': event['set'],
            'user': user.id
        })

    async def store_is_online(self, user, value):
        if value == 'true': value = True
        else: value = False

        settings = await sync_to_async(UserSetting.objects.get)(id=user.id)
        settings.is_online = value
        await sync_to_async(settings.save)()
    
    async def send_notifi(self, users):

        console.print(f'NOTIFI {users}')

        for i in range(len(users)):
            text = json.dumps({
                'type': 'notifi',
                'user': users[i-1],
                'sender': users[0]
            })

            await self.channel_layer.group_send(
                str(users[i]),
                {
                    'type': 'websocket.message',
                    'text': text,
                },
            )

    async def unread(self, thread, user, plus):
        users = await sync_to_async(thread.users.first)()
        
        if(users.id != int(user)): 
            thread.unread_by_1 += plus
        else: 
            thread.unread_by_2 += plus
        
        await sync_to_async(thread.save)()