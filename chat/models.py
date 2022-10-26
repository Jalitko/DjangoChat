from concurrent.futures import thread
from chat.managers import ThreadManager
from django.db import models
from django.contrib.auth.models import User
import os, uuid


# Create your models here.
def random_file_name(instance, filename):
    ext = filename.split('.')[-1]
    filename = "%s.%s" % (uuid.uuid4(), ext)
    return os.path.join('profile-pics', filename)




class UserSetting(models.Model):
    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    username = models.CharField(max_length=32, default="")
    profile_image = models.ImageField(upload_to=random_file_name, blank=True, null=True, default='\\profile-pics\\default.jpg')
    is_online = models.BooleanField(default=False)
    
    def __str__(self):
        return str(self.user)


class TrackingModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Thread(TrackingModel):
    name = models.CharField(max_length=50, null=True, blank=True)
    users = models.ManyToManyField('auth.User')

    objects = ThreadManager()


    def __str__(self):
        return f'{self.name} \t -> \t {self.users.first()} - {self.users.last()}'



class Message(TrackingModel):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)
    sender = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    text = models.TextField(blank=False, null=False)
    
    
    def __str__(self):
        return f'From Thread - {self.thread.name}'
