from django.contrib import admin
from .models import Message, Thread, UserSetting

# Register your models here.
admin.site.register(UserSetting)


class MessageInline(admin.StackedInline):
    model = Message
    fields = ('sender', 'text')
    readonly_fields = ('sender', 'text')

class ThreadAdmin(admin.ModelAdmin):
    model = Thread
    inlines = (MessageInline,)

admin.site.register(Thread, ThreadAdmin)