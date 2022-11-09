
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
    $('#chat-id').val(id)
    getOnlineUsers(id, data => {
        $(".active-profile").attr('src', data['user']['profile-image']);
        $(".active-name").text(data['user']['username']);
        $('.active').show()
        $('.active-name').show()
        $('.active > span').attr('id', `userid-${id}`)
        OnlineDot(($(`span[id="userid-${id}"]`)[1].classList[1] == 'online') ? true : false, id)
    });
    

    SocketCreateChat()
    getChatMessages(true)
}

// Push users to online users list
function add_Online_users(){
    getOnlineUsers('', data => {
        Object.keys(data).forEach(key => {
            document.getElementById('online-users-bar').innerHTML += `
                <div class='online-user' onclick='selectchat("${data[key]['id']}")'>
                    <div class='profile-picture-div'>
                        <span class="online-dot offline" id="userid-${data[key]['id']}"></span>
                        <img class="profile-picture profile-inchats" src="${data[key]['profile-image']}"/>
                    </div>
                        <span class="profile-name">${data[key]['username']}</span>
                </div class='online-user'>`
        });
    });

}

// Push recent Chats
function add_Recent_chats(){
    getOnlineUsers('', data => {
        Object.keys(data).forEach(key => {
            const id = data[key]['id']
            document.getElementById('recents').innerHTML += `
            <div class='recent' id='recentid-${id}' onclick='selectchat("${data[key]['id']}")'>

                <div class='profile-picture-div'>
                    <span class="online-dot offline" id="userid-${id}"></span>
                    <img class="profile-picture profile-inchats" src="${data[key]['profile-image']}"/>
                </div>
            
                <div class='recent-box'> 
                    <span class="profile-name-recent">${data[key]['username']}</span>
                    <span class="message-recent"></span> 
                </div>
    
                <div style='width:120px;'> 
                    <span class="profile-name-recent date-recent"></span>
        
                    <div class="unread-circle" style="display: none;">
                        <span>5</span>
                    </div>
                </div>
            </div>
            <div class='line line2'></div>
            `
            allUsers.push(id)
            getLastMessage(id)
        });
    });
}

// Create WebSocket connection for chat
function SocketCreateChat(){
    if(ws != 0) ws.close()
    var url = 'ws://' + window.location.host + '/ws/chat'
    ws = new WebSocket(url + window.location.pathname)

    ws.onopen = function(event){
        console.log('Connection is opened');
    }

    ws.onmessage = function(event){
        getChatMessages()
    }

    ws.onclose = function(event){
        console.log('Connection is closed');
    }

    ws.onerror = function(event){
        console.log('Something went wrong');
    }
}

// Create WebSocket connection for online users handling
function SocketCreateOnline(){
    var url = 'ws://' + window.location.host + '/ws/online'
    on = new WebSocket(url)
    const id = $('#my-id').val()

    on.onopen = function(event){
        console.log('ONLINE');
        OnlineDot(true, id)
        on.send(`true`)
    }

    on.onmessage = function(event){
        var data = JSON.parse(event.data);
        OnlineDot(data.set, data.user)
    }

    on.onclose = function(event){
        console.log('OFFLINE');
        OnlineDot(false, id)
    }

    on.onerror = function(event){
        console.log('Something went wrong');
    }
}

// Create WebSocket connection for recieving messages
function SocketNotifi(){
    var url = 'ws://' + window.location.host + '/ws/notifi'
    notifiWS = new WebSocket(url)

    notifiWS.onopen = function(event){
        console.log('notifi online');
    }

    notifiWS.onmessage = function(event){
        getLastMessage(event.data)
        notifi.pause()
        notifi.currentTime = 0
        notifi.play();
        
    }

    notifiWS.onclose = function(event){
        console.log('notifi offline');
    }

    notifiWS.onerror = function(event){
        console.log('Something went wrong');
    }
}

// Set online dot color by id
function OnlineDot(setOnline, id){
    var user = `span[id="userid-${id}"]`
    var onClass = 'online'
    var offClass = 'offline'
    
    if(setOnline == true || setOnline == 'true'){
        $(user).removeClass(offClass).addClass(onClass)
    }
    else{
        $(user).removeClass(onClass).addClass(offClass)
    }
}

// Get all user online status
function getAllOnlineStatus(){
    getOnlineUsers('', data => {
        Object.keys(data).forEach(key => {
            var id = data[key]['id']
            var online = data[key]['is-online']
            OnlineDot(online, id)
        });
    });
 
}

// Get onilne users from rest api
function getOnlineUsers(id, callback){
    $.getJSON(`/online-users/${id}`, callback);
}

// Get messages from rest api
function getMessages(id, count, callback){
    $.getJSON(`/chat-messages/${id}?${count}`, callback);
}

// Get messages to chat
function getChatMessages(all = false) {
    id = $('#chat-id').val()
    var count = 'count=1'
    if(all){
        count = ''
        resetCurrent()
        clearMessages()
    }

    getMessages(id, count, data =>{
        Object.keys(data).forEach(key => {
            var date = new Date(data[key]['timestamp'])
            recieveMessages(data[key]['sender'], data[key]['text'], date)
        });
    });
}

// Get last message to recent chats
function getLastMessage(id){

    getMessages(id,'count=1', data =>{
        var key = Object.keys(data)[0]
        var data = data[key]
        var time = new Date(data['timestamp'])
        var now = new Date(Date.now())
        var timeStr

        //Not this year
        if(time.getFullYear() != now.getFullYear()){
            timeStr = time.toLocaleDateString()
        }
        //Not today
        else if(time.getDate() != now.getDate() || time.getMonth() != now.getMonth()){
            var day = time.getDate()
            var month = time.toLocaleString('default', { month: 'long' }).slice(0, 3).toLowerCase()
            timeStr = `${day} ${month}`
        }
        else{
            timeStr = time.toLocaleTimeString(['en-US'], {timeStyle: 'short'}).toLowerCase()
        }

        var from = ''
        if(id != data.sender) from = 'You:'

        $(`#recentid-${id} > div > span.message-recent`).html(`${from} ${data.text}`)
        $(`#recentid-${id} > div > span.date-recent`).html(`${timeStr}`)
    })
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
    message = document.getElementById('message').value.trim()

    
    if (e.preventDefault) e.preventDefault()
    if(message=='') return 0
    
    ws.send(message)
    messageForm.reset()
}


var ws = 0
var currentDate, currentMonth, currentYear
var allUsers = []

const messageForm = document.getElementById('message-form')
messageForm.addEventListener('submit', sendMessaage)
add_Recent_chats()
add_Online_users()
resetCurrent()
selectchat(0)

var on = 0
SocketCreateOnline()
getAllOnlineStatus()

var notifiWS = 0
var notifi = new Audio('/static/notifi.mp3')
SocketNotifi()