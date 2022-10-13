#   python manage.py runserver 0.0.0.0:8000
#   python manage.py migrate --run-syncdb 

import re, json
from xmlrpc.client import Boolean
from django.shortcuts import render, redirect
from .models import UserSetting
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

def log(*args, **kwargs):
    WARNING = f'\033[94m\033[1m{args[0]}'
    ENDC = '\033[0m'
    args = list(args)
    args.pop(0)
    args = tuple(args)
    args = (WARNING, *args, ENDC)
    print(*args, **kwargs)

def email_valid(email):
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    if(re.fullmatch(regex, email)): return True
    return False

@login_required
def api_online_users(request, id=0):
    users_json = {}
    
    if id != 0:
        user = User.objects.get(id=id)
        user_settings = UserSetting.objects.get(user=user)
        users_json['user'] = {
            'id': user.id,
            'username': user_settings.username,
            'profile-image': user_settings.profile_image.url
        }

    else:
        all_users = User.objects.all().exclude(username=request.user)
        for user in all_users:
            user_settings = UserSetting.objects.get(user=user)
            users_json[user.id] = {
                'id': user.id,
                'username': user_settings.username,
                'profile-image': user_settings.profile_image.url
            }

    return HttpResponse(
        json.dumps(users_json),
        content_type = 'application/javascript; charset=utf8'
    )

@login_required
def index(request, id=0):
    user = User.objects.get(username=request.user)
    Usettings = UserSetting.objects.get(user=user)

    context = {
        "settings" : Usettings,
        'id' : id,
    }
    return render(request, 'index.html', context=context)


def login_view(request):
    logout(request)
    context = {}


    if request.POST:
        email = request.POST['email']
        password = request.POST['password']
        
        user = authenticate(username=email, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                return redirect('/')
        else:
            context = {
            "error": 'Email or Password was wrong.',
            }    
        
    return render(request, 'login.html',context)


def signup_view(request):
    logout(request)


    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')
        error = ''
        
        if not email_valid(email):
            error = "Wrong email address."
        try:
            if User.objects.get(username=email) is not None:
                error = 'This email is already used.'
        except: pass

        if error:  return render(request, "signup.html", context={'error': error})

        user = User.objects.create_user(
            username = email, 
            password = password,
        )
        userset = UserSetting.objects.create(user=user, username=username)
        
        login(request, user)
        return redirect('/')


    return render(request, 'signup.html')