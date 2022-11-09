from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from chat.consumers import ChatConsumer, OnlineConsumer, NotifiConsumer

application = ProtocolTypeRouter({
    'websocket':AuthMiddlewareStack(
        URLRouter([
            path('ws/chat/<str:id>', ChatConsumer.as_asgi()),
            path('ws/online', OnlineConsumer.as_asgi()),
            path('ws/notifi', NotifiConsumer.as_asgi()),
        ])
    )
})