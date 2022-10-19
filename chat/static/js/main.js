
// LOGIN AND SIGNUP PAGE
function TogglePassword() {
    var password = document.getElementById("password");
    var eye = document.getElementById("toggleeye");

    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);

    eye.classList.toggle('fa-eye-slash');
}




// INDEX

// Scroll button to online users list
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

// Select chat and messages
function selectchat(id){
    // Unselect chat
    if (id == 0) {
        id = $('#chat-id').val()
        
        if(id == 0){
            $('.active').hide()
            $('.active-name').hide()
            return
        }
    }
    
    // Clear messages after repick chat
    if (id != $('#chat-id').val())  clearMessages()

    // push id to URL
    window.history.pushState('data', 'title', id);

    //  Select chat
    $.getJSON(`/online-users/${id}`, function(data) {
        $(".active-profile").attr('src', data['user']['profile-image']);
        $(".active-name").text(data['user']['username']);
        $('.active').show()
        $('.active-name').show()
        $('#chat-id').val(id)
    });

    SocketCreate()
    getMessages()
}

// Push users to online users list
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
                </div class='online-user'>`
        });
    });

}

// Push recetn Chats
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
            `
         });
     });
 
}

// Create WebSocket connection
function SocketCreate(){
    if(ws != 0) ws.close()
    var url = 'ws://' + window.location.host + '/ws/chat'
    ws = new WebSocket(url + window.location.pathname)

    ws.onopen = function(event){
        console.log('Connection is opened');
    }

    ws.onmessage = function(event){
        var data = JSON.parse(event.data)
        getMessages(true)
    }

    ws.onclose = function(event){
        console.log('Connection is closed');
    }

    ws.onerror = function(event){
        console.log('Something went wrong');
    }
}

// Get messages from rest api
function getMessages(last = false){
    resetCurrent()

    id = $('#chat-id').val()
    $.getJSON(`/chat-messages/${id}`, function(data) {
        clearMessages()
        Object.keys(data).forEach(key => {
            var date = new Date(data[key]['timestamp'])
            recieveMessages(data[key]['sender'], data[key]['text'], date)
            
            if(last) return
        });
    });
}

// Push messages to chat thread
function recieveMessages(senderId, text, Date){
    var time = Date.toLocaleTimeString(['en-US'], {timeStyle: 'short'}).toLowerCase()
    var date = Date.toLocaleString('default', { day: 'numeric' })
    var month = Date.toLocaleString('default', { month: 'long' })
    var monthInt = Date.toLocaleString('default', { month: 'numeric' })
    var year = Date.toLocaleString('default', { year: 'numeric' })
    
    // assign chat bubble to sender
    var sender = 'from-them'
    if(senderId == $('#my-id').val()) sender = 'from-me'
    

    // Pust date separator
    var chatDate = ''
    if(date > currentDate || monthInt > currentMonth || year > currentYear){
        chatDate = `<div class='chat-date'>${date} ${month}</div>`
        currentDate = date
        currentMonth = monthInt
        currentYear = year
    }

    // Push message bubble
    div_calss = 'chat-messages'
    div = `
            <div class='text-bubble ${sender}' data-title='${time}'>
                ${text}
            </div>
            ${chatDate}
            `
    document.getElementById(div_calss).innerHTML = div + document.getElementById(div_calss).innerHTML
}

// Clear chat thread
function clearMessages(){
    document.getElementById('chat-messages').innerHTML = ''
}

// Reset date separator vars
function resetCurrent(){
    currentDate = 0
    currentMonth = 0
    currentYear = 0
}

// Send message from input field
function sendMessaage(e){
    message = document.getElementById('message').value
    
    if (e.preventDefault) e.preventDefault()
    if(message=='') return 0
    
    ws.send(message)
    messageForm.reset()
}


var ws = 0
var currentDate, currentMonth, currentYear

const messageForm = document.getElementById('message-form')
messageForm.addEventListener('submit', sendMessaage)
add_Recent_chats()
add_Online_users()
resetCurrent()
selectchat(0)