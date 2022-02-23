import {CreateMessageElement, UI} from "./view.js";
import {setCookie, deleteCookie} from "./cookieManager.js";
import {
    sendTokenRequest,
    tokenGetRequest,
    changeNameRequest,
    messageHistoryRequest,
    socketSendMessage,
    socketOnMessageHandler,
} from "./network.js";

const TOKEN = 'token';
let currentUserName = undefined;
let currentEmail = undefined;
let currentWindow;

function showMessage(messageOptions) {
    const message = new CreateMessageElement(messageOptions);
    const messageNode = message.mainElement;

    UI.mainWindow.messagesList.append(messageNode);
    UI.mainWindow.messageWrapper.scrollToEnd();
}

function sendMessage() {
    const message = UI.mainWindow.messageForm.getText();
    UI.mainWindow.messageForm.resetForm();
    socketSendMessage(message);
}

async function showMessageHistory() {
    const callbackOptions = {};
    callbackOptions.onSuccess = async function (response) {
        const responseJSON = await response.json();
        responseJSON.messages.forEach(item => {
            const messageOptions = {
                message: item.message,
                userName: item.username,
                createdAt: new Date(item.createdAt),
                myMessage: (item.username === currentUserName),
            };
            showMessage(messageOptions);
        });
    }
    await messageHistoryRequest(callbackOptions);
}

function onMessageHandler(data) {
    const messageOptions = {
        message: data.text,
        userName: data.user.name,
        createdAt: new Date(data.createdAt),
        myMessage: (data.user.email === currentEmail),
    };
    showMessage(messageOptions);
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
    const emailName = UI.authorizationWindow.authorizationList.email.getEmail()
    UI.authorizationWindow.authorizationList.email.resetForm();

    const callbackOptions = {
        onSuccess() {
            alert('Код отправлен.');
        }
    }
    await sendTokenRequest(emailName, callbackOptions);

    toggleWindow(UI.codeConfirmWindow);
}

async function codeConfirmHandler() {
    setCookie(TOKEN, UI.codeConfirmWindow.form.getText());
    UI.codeConfirmWindow.form.resetForm();

    const callbackOptions = {
        onSuccess(response) {
            if (response.ok) {
                successfulCodeConfirmHandler(response);
            } else {
                alert('Неверный токен. Попробуйте еще раз.');
            }
        },
    };
    await tokenGetRequest(callbackOptions);
}

async function successfulCodeConfirmHandler(tokenResponse) {
    const responseJSON = await tokenResponse.json();
    await showMessageHistory();
    socketOnMessageHandler(onMessageHandler);

    toggleWindow(UI.mainWindow)

    currentEmail = responseJSON.email;
    currentUserName = responseJSON.name;
    UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);
}

async function changeName() {
    const newName = UI.settingsWindow.settingsList.chatName.getUserName();

    const callbackOptions = {
        onSuccess(response) {
            if (response.ok) {
                currentUserName = name;
                alert('Имя изменено');
                location.reload();
            } else {
                UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);
                alert('Что-то пошло не так.');
            }
        },
    };
    await changeNameRequest(newName, callbackOptions);
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
    UI.mainWindow.exitBtn.addEventListener('click', () => {
        deleteCookie(TOKEN);
        location.reload();
    });

    UI.settingsWindow.closeBtn.addEventListener('click', () => {
        toggleWindow(UI.mainWindow);
    });
    UI.settingsWindow.settingsList.chatName.form.mainElement.addEventListener('submit', () => {
        changeName();
    });
    UI.settingsWindow.settingsList.chatName.form.textElement.addEventListener('blur', () => {
        UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);
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
    const callbackOptions = {
        onSuccess(response) {
            if (response.ok) {
                successfulCodeConfirmHandler(response);
            } else {
                passAuthorization();
            }
        }
    };
    await tokenGetRequest(callbackOptions);

    UI.mainWindow.messageWrapper.scrollToEnd();
    addListeners();
}

init();