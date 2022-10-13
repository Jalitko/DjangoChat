
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from chat import views as chat_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', chat_views.index, name='index'),
    path('<int:id>', chat_views.index, name='index'),
    path('login/', chat_views.login_view, name='login_view'),
    path('signup/', chat_views.signup_view, name='signup_view'),

    path('online-users/', chat_views.api_online_users, name='online-users'),
    path('online-users/<int:id>', chat_views.api_online_users, name='online-users'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


