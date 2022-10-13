
// LOGIN AND SIGNUP PAGE
function TogglePassword() {
    var password = document.getElementById("password");
    var eye = document.getElementById("toggleeye");


    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);

    eye.classList.toggle('fa-eye-slash');
}




// INDEX

function Hscroll(side){
    const width = 300;
    var bar = document.getElementById('online-users-bar');

    if (side === 'left') {
        bar.scrollLeft -= width;
    }
    else{
        bar.scrollLeft += width;
    }
}

function selectchat(id){
    if (id == 0) {
        id = $('#chat-id').val()
        
        if(id == 0){
            $('.active').hide()
            $('.active-name').hide()
            return
        }
    }
    
    if (id != $('#chat-id').val()){
        document.getElementById('chat-messages').innerHTML = ''
    }
    
    window.history.pushState('data', 'title', id);
    $.getJSON(`/online-users/${id}`, function(data) {
        $(".active-profile").attr('src', data['user']['profile-image']);
        $(".active-name").text(data['user']['username']);
        $('.active').show()
        $('.active-name').show()
        $('#chat-id').val(id)

        if(ws != 0) ws.close()
        SocketCreate()
    });
}



function add_Online_users(){
   $.getJSON('/online-users/', function(data) {
        Object.keys(data).forEach(key => {
            document.getElementById('online-users-bar').innerHTML += `
            <div class='online-user' onclick='selectchat("${data[key]['id']}")'>
                <div class='profile-picture-div'>
                    <span class="online-dot"></span>
                    <img class="profile-picture profile-inchats" src="${data[key]['profile-image']}"/>
                </div>
                    <span class="profile-name">${data[key]['username']}</span>
            </div class='online-user'>`;
        });
    });

}

function add_Recent_chats(){
    $.getJSON('/online-users/', function(data) {
         Object.keys(data).forEach(key => {
             document.getElementById('recents').innerHTML += `
             <div class='recent' onclick='selectchat("${data[key]['id']}")'>

                <div class='profile-picture-div'>
                    <span class="online-dot"></span>
                    <img class="profile-picture profile-inchats" src="${data[key]['profile-image']}"/>
                </div>
             
             <div class='recent-box'> 
               <span class="profile-name-recent">${data[key]['username']}</span>
               <span class="message-recent">text of the last message</span> 
             </div>
   
             <div> 
               <span class="profile-name-recent date-recent">7:27</span>
   
               <div class="unread-circle">
                 <span>5</span>
               </div>
             </div>
           </div>
           <div class='line line2'></div>
           `;
         });
     });
 
}

function SocketCreate(){
    var url = 'ws://' + window.location.host + '/ws/chat'
    ws = new WebSocket(url + window.location.pathname)
    ws.onopen = function(event){
        console.log('Connection is opened');
    }

    ws.onmessage = function(event){
        var data = JSON.parse(event.data)

        if(data.user == $('#my-id').val()){
            var from = 'from-me'
        }
        else{
            var from = 'from-them'
        }

        document.getElementById('chat-messages').innerHTML =     
            `<div class='text-bubble ${from}'>
                ${data.text}
            </div>
            ` + document.getElementById('chat-messages').innerHTML
    }

    ws.onclose = function(event){
        console.log('Connection is closed');
    }

    ws.onerror = function(event){
        console.log('Something went wrong');
    }
}


function sendMessaage(e){
    message = document.getElementById('message').value
    
    if (e.preventDefault) e.preventDefault()
    if(message=='') return 0
    
    ws.send(message)
    messageForm.reset()
}

var ws = 0
const messageForm = document.getElementById('message-form')
messageForm.addEventListener('submit', sendMessaage)
add_Recent_chats()
add_Online_users()
selectchat(0)