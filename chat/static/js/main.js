
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
        id = getIds('chat')
        
        if(id == 0){
            $('.active').hide()
            $('.active-name').hide()
            $('.messages-input').hide()
            return
        }
    }
    
    // Clear messages after repick chat
    if (id != getIds('chat'))  clearMessages()

    // push id to URL
    window.history.pushState('data', 'title', id);

    //  Select chat
    $('#chat-id').val(id)
    getOnlineUsers(id, data => {
        $(".active-profile").attr('src', data['user']['profile-image']);
        $(".active-name").text(data['user']['username']);
        $('.active').show()
        $('.active-name').show()
        $('.messages-input').show()
        $('.active > span').attr('id', `userid-${id}`)
        OnlineDot(($(`span[id="userid-${id}"]`)[1].classList[1] == 'online') ? true : false, id)
    });
    
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
            <div class='recent' id='recentid-${id}' onclick='selectchat("${id}")'>

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
        
                    <div class="unread-circle" id="badge-${id}" style="display: none;">
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

// Create WebSocket
function WebSocketCreate(){
    var loc = window.location
    var url = 'ws://' + loc.host + '/ws' + loc.pathname
    ws = new WebSocket(url)

    ws.onopen = function(event){
        console.log('Connection is opened');
        
        ws.send(`{
            "type": "online",
            "set": "true"
        }`)
    }

    ws.onmessage = function(event){
        unread()

        var data = JSON.parse(event.data);
        console.log(data['type'])
        
        if(data['type'] === 'message'){
            getChatMessages()
        }
        else if(data['type'] === 'online'){
            OnlineDot(data['set'], data['user'])
        }
        else if(data['type'] === 'notifi'){
            var id = data['sender']

            if(id != parseInt(getIds('my'))){
                notifi.pause()
                notifi.currentTime = 0
                notifi.play();
                new Toast(id)
            }
            getLastMessage(data['user'])
        }
    }

    ws.onclose = function(event){
        console.log('Connection is closed');
        id = getIds('my')
        OnlineDot('false', id)
    }

    ws.onerror = function(event){
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
    id = getIds('chat')
    if(id==0) return

    var count = 'count=1'
    if(all){
        count = ''
        resetCurrent()
        clearMessages()
    }

    var open = setInterval(() => {
        if(ws.readyState === WebSocket.OPEN){
            getMessages(id, count, data =>{
                Object.keys(data).forEach(key => {
                    var date = new Date(data[key]['timestamp'])
                    recieveMessages(data[key]['sender'], data[key]['text'], date)

                    if(getIds('chat') == data[key]['sender']){
                        if(data[key]['isread']) return
                        ws.send(`{
                            "type": "read",
                            "id": "${key}",
                            "user": "${getIds('chat')}"
                        }`)
                    }
                })
            })
            clearInterval(open)
        }
    },100)

    setTimeout(() =>{
        unread()
    }, 1000)
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
    var date = parseInt(Date.toLocaleString('default', { day: 'numeric' }))
    var month = Date.toLocaleString('default', { month: 'long' })
    var monthInt = parseInt(Date.toLocaleString('default', { month: 'numeric' }))
    var year = parseInt(Date.toLocaleString('default', { year: 'numeric' }))
    
    // assign chat bubble to sender
    var sender = 'from-them'
    if(senderId == getIds('my')) sender = 'from-me'
    

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
                ${urlify(text)}
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
    
    message = `{
        "type": "message",
        "to": "${getIds('chat')}",
        "message": "${message}"
    }`
    ws.send(message)
    messageForm.reset()
}

// Add clickable element to message
function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
      return `<a href="${url}" target="_blank" class="message-link">${url}</a>`
    })
}

// Get id from html 
function getIds(id){
    if(id === 'chat') return $('#chat-id').val()
    else return $('#my-id').val()
}

// Create Toast to toast container
class Toast {
    #container
    #toastElem
    #delay = 3000
    #visibleSince
    #moveBind
    #id

    constructor(options){
        this.#id = options
        getOnlineUsers(options, data => {
            var user = data['user']
            getMessages(options, 'count=1', data =>{
                var key = Object.keys(data)[0]
                var message = data[key]

                options = {
                    user: options,
                    name: user['username'],
                    image: user['profile-image'],
                    text: message['text'],
                }
                this.show(options)
            })
        })

        this.#moveBind = this.moveToChat.bind(this)
        this.#container = document.getElementById('toast-container')
        this.autoClose(this.#delay)
        this.#visibleSince = new Date()
    }

    show(options) {
        this.#toastElem = document.createElement("div")
        this.#toastElem.classList.add("toast", "hide")
        this.#toastElem.addEventListener('click', this.#moveBind)
        this.#container.append(this.#toastElem)

        this.#toastElem.innerHTML += `
            <img class="profile-picture" src="${options.image}">
            <div class='toast-text'>
                <div class='toast-name'>${options.name}</div>
                <div class='toast-message'>${options.text}</div>
            </div>
        `
        setTimeout(() => {
            this.#toastElem.classList.remove('hide')
            this.#toastElem.classList.add('show')
        }, 20)

        this.showProgress()
    }

    remove(){
        this.hide()
        setTimeout(() => this.#toastElem.remove(), 220)
    }

    autoClose(value){
        setTimeout(() => this.remove(), value)
    }

    hide(){
        this.#toastElem.classList.add('hide')
        this.#toastElem.classList.remove('show')
    }

    showProgress(){
        setInterval(() => {
            const timeVisible = new Date() - this.#visibleSince
            this.#toastElem.style.setProperty(
                '--progress',
                1 - timeVisible / this.#delay
            )
        }, 10)
    }

    moveToChat(){
        selectchat(this.#id)
        this.remove()
    }
}

// Get unread messages from REST api
function getUnread(callback){
    $.getJSON(`/unread/`, callback);
}

// Count unread messages
function unread(){
    unreadOb = {total : -1, count: -1, now: 0,}

    getUnread(data =>{
        unreadOb.count = Object.keys(data).length
        Object.keys(data).forEach(key => {
            if(unreadOb.total == -1) unreadOb.total = 0
            unreadOb.total += data[key]['count']
            unreadOb.now += 1
            badge(data[key]['sender'], data[key]['count'])
        })
    })

    var intter = setInterval(() => {
        if(unreadOb.count == unreadOb.now){
            if(unreadOb.total == 0) document.title = 'DjangoChat'
            else document.title = `DjangoChat (${unreadOb.total})`

            clearInterval(intter)
        }
    }, 20)
}

// Get unread count to badge
function badge(id, value){
    if(value == 0) {
        $(`#badge-${id}`).hide()
    }
    else{
        if(value > 9) value = '9+'
        $(`#badge-${id} > span`).text(value)
        $(`#badge-${id}`).show()
    }
}

var ws
var currentDate, currentMonth, currentYear
var notifi = new Audio('/static/notifi.mp3')
var allUsers = []

WebSocketCreate()
const messageForm = document.getElementById('message-form')
messageForm.addEventListener('submit', sendMessaage)
add_Recent_chats()
add_Online_users()
resetCurrent()
selectchat(0)
getAllOnlineStatus()
var unreadOb
unread()