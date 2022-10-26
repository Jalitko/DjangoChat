from unicodedata import name
from django.db import models
from django.db.models import Count



class ThreadManager(models.Manager):
    def get_or_create_thread(self, user1, user2) :
        
        pair = self.get_pair(user1.id, user2.id)

        threads = self.get_queryset().filter(name=pair)
        if threads.exists():
            return threads.first()
        else: 
            thread = self.create()
            thread.users.add(user1)
            thread.users.add(user2)
            thread.name = pair
            thread.save()
            return thread

        

    def get_pair(self, x, y):
        return x * x + x + y if x>y else y * y + y + x
