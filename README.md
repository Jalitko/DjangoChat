![Home View](static/../chat/static/screenshots/homeview.png?raw=true "Title")

# DjangoChat

# Setup

The first thing to do is to clone the repository:

    $ git clone https://github.com/Jalitko/DjangoChat.git
    $ cd DjangoChat
    
Install project dependencies:

    $ pip install -r requirements.tx
    
    
Create database tables and a superuser account:

    $ python manage.py migrate
    $ python manage.py createsuperuser
    

You can now run the development server:

    $ python manage.py runserver

The site should now be running at `http://localhost:8000`.
To access Django administration site, log in as a superuser, then
visit `http://localhost:8000/admin/`
