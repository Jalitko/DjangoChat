var ws
WebSocketCreate()
setAvatar()
clearAvatarInput()

const avatarChange = document.querySelector("#avatar-upload")
const usernameInput = document.getElementById('username-input')
var username = usernameInput.value
var avatar = $('#avatar').attr('src')


// Craete WebSocket
function WebSocketCreate(){
    var loc = window.location
    var url = 'ws://' + loc.host + '/ws/'
    ws = new WebSocket(url)

    ws.onopen = function(event){
        console.log('Connection is opened');
        
        ws.send(`{
            "type": "online",
            "set": "true"
        }`)
    }

    ws.onmessage = function(event){
        var data = JSON.parse(event.data);
        console.log(`online: ${data['set']} user: ${data['user']}`)
    }

    ws.onclose = function(event){
        console.log('Connection is closed');
    }

    ws.onerror = function(event){
        console.log('Something went wrong');
    }
}

// Set avatar image
function setAvatar(){
    var avatar = $('#avatar')
    var src = `${window.location.origin}/${avatar.attr('src')}`
    avatar.attr('src', src)
}

// Reset avatar to default
function avatarReset(def){
    clearAvatarInput()
    const defsrc = `${window.location.origin}/media/\\profile-pics\\default.jpg`
    if(def){
        $('#avatar').attr('src', defsrc)
        saveChanges(true)
    }
    else{
        $('#avatar').attr('src', avatar)
    }
}

// Clear file from input form element
function clearAvatarInput(){
    $('#avatar-upload').val(null)
}

// Get file from input form element
function getAvatarInput(){
    var image = $('#avatar-upload')[0].files[0]
    if(image == null) return ''
    return image
}

// Upload a new avatar file and show preview
avatarChange.addEventListener("change", function(){
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            $('#avatar').attr('src', reader.result)
        })
        reader.readAsDataURL(this.files[0])
        saveChanges(true)
})

// Detect username changes
usernameInput.addEventListener('change', () =>{
    if(usernameInput.value != username) saveChanges(true)
    else saveChanges(false)
})

// Show or hide popup to save or reset changes
function saveChanges(show){
    if(show) $('.save-reset').addClass('show').removeClass('hide')
    else     $('.save-reset').addClass('hide').removeClass('show')
}

// Reset all changes
function SettingsReset(){
    avatarReset(false)
    usernameInput.value = username
    saveChanges(false)
    clearAvatarInput()
}

// Send changes with POST request and save changes
function SettingsSave(){
    const csrf_token = $('#csrf-token').val()
    let formData = new FormData()
    formData.append('csrfmiddlewaretoken', csrf_token)
    formData.append("avatar", getAvatarInput())
    formData.append("username", usernameInput.value)

    $.ajax({
        type: "POST",
        url: "/settings/",
        processData: false, 
        contentType: false,
        data: formData,
        success: function (data) {
            console.log("success")
            location.reload()
        },
        failure: function (data) {
            console.log("failure")
        },
    })
}