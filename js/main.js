import {CreateMessageElement, UI} from "./view.js";
import {getCookie, setCookie, deleteCookie} from "./cookieManager.js";

const NAME_IN_CHAT = 'Я';
const TOKEN = 'token';
let currentUserName = '';
let currentWindow;

function sendMessage() {
    const messageOptions = {
        text: UI.mainWindow.messageForm.getText(),
        author: NAME_IN_CHAT,
        time: getCurrentTime(),
    }
    UI.mainWindow.messageForm.resetForm();

    const message = new CreateMessageElement(messageOptions);
    const messageNode = message.mainElement;

    UI.mainWindow.messagesList.append(messageNode);
    UI.mainWindow.messageWrapper.scrollToEnd();
}

function getCurrentTime() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const timeString = `${hours}:${minutes}`;

    return timeString;
}

function toggleWindow(window) {
    if (currentWindow === window) {
        return;
    }

    if (currentWindow !== undefined) {
        currentWindow.changeVisibility();
    }
    currentWindow = window;
    currentWindow.changeVisibility();
}

async function authorizationHandler() {
    const email = UI.authorizationWindow.authorizationList.email.getEmail()
    UI.authorizationWindow.authorizationList.email.resetForm();

    const emailJSON = JSON.stringify({email: email});
    try {
        let response = await fetch( 'https://chat1-341409.oa.r.appspot.com/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: emailJSON,
        })
    } catch (error) {
        alert(error);
    }

    toggleWindow(UI.codeConfirmWindow);
}

async function codeConfirmHandler() {
    setCookie(TOKEN, UI.codeConfirmWindow.form.getText());
    UI.codeConfirmWindow.form.resetForm();

    const response = await getTokenResponse();
    if (response.ok) {
        successfulCodeConfirmHandler();
    } else {
        alert('Неверный токен. Попробуйте еще раз.');
    }
}

function successfulCodeConfirmHandler(tokenResponseJSON) {
    toggleWindow(UI.mainWindow)

    currentUserName = tokenResponseJSON.name;
    UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);
}

async function changeName() {
    const token = getCookie(TOKEN);

    const newName = UI.settingsWindow.settingsList.chatName.getUserName();
    const bodyJSON = JSON.stringify({name: newName});
    try {
        let response = await fetch('https://chat1-341409.oa.r.appspot.com/api/user', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Authorization': `Bearer ${token}`,
            },
            body: bodyJSON,
        })
        if (response.ok) {
            currentUserName = name;
            alert('Имя изменено');
        } else {
            UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);
            alert('Что-то пошло не так');
        }
    } catch (error) {
        alert(error);
    }
}

async function getTokenResponse() {
    const token = getCookie(TOKEN);

    try {
        const response = await fetch('https://chat1-341409.oa.r.appspot.com/api/user/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Authorization': `Bearer ${token}`,
            }
        })
        return response;
    } catch (error) {
        alert(error)
    }
}

function passAuthorization() {
    toggleWindow(UI.codeConfirmWindow);
}

function addListeners() {
    UI.mainWindow.messageForm.mainElement.addEventListener('submit', () => {
        sendMessage();
    });
    UI.mainWindow.settingsBtn.addEventListener('click', () => {
        toggleWindow(UI.settingsWindow);
    });

    UI.settingsWindow.closeBtn.addEventListener('click', () => {
        toggleWindow(UI.mainWindow);
    });
    UI.settingsWindow.settingsList.chatName.form.mainElement.addEventListener('submit', () => {
        changeName();
    });
    UI.mainWindow.exitBtn.addEventListener('click', () => {
        deleteCookie(TOKEN);
        location.reload();
    });

    UI.authorizationWindow.authorizationList.email.form.mainElement.addEventListener('submit', authorizationHandler);
    UI.authorizationWindow.closeBtn.addEventListener('click', () => {
        toggleWindow(UI.codeConfirmWindow);
    });

    UI.codeConfirmWindow.form.mainElement.addEventListener('submit', codeConfirmHandler);
    UI.codeConfirmWindow.closeBtn.addEventListener('click', () => {
        toggleWindow(UI.authorizationWindow);
    });
}

async function init() {
    const tokenResponse = await getTokenResponse();
    if (tokenResponse.ok) {
        let tokenResponseJSON = await tokenResponse.json();
        successfulCodeConfirmHandler(tokenResponseJSON);
    } else {
        passAuthorization();
    }
    UI.mainWindow.messageWrapper.scrollToEnd();
    addListeners();
}

init();