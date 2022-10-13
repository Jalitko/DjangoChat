from django.contrib import admin
from .models import Message, Thread, UserSetting

# Register your models here.
admin.site.register(UserSetting)
admin.site.register(Thread)