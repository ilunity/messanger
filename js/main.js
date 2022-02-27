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
import {messagesStorage} from "./storage.js";

const TOKEN = 'token';
const LOADING_MESSAGE_COUNT = 20;
let currentUserName = undefined;
let currentEmail = undefined;
let currentWindow;

function showMessage(messageOptions, isNewMessage = true) {
    const message = new CreateMessageElement(messageOptions);
    const messageNode = message.mainElement;

    if (isNewMessage) {
        UI.mainWindow.messagesList.append(messageNode);
        if (UI.mainWindow.isPositioningForNewMessages) UI.mainWindow.messageWrapper.scrollToEnd();
    } else {
        UI.mainWindow.messagesList.prepend(messageNode);
    }
}

function sendMessage() {
    const message = UI.mainWindow.messageForm.getText();
    UI.mainWindow.messageForm.resetForm();
    socketSendMessage(message);
}

function showMessageHistory(messagesCount = undefined) {
    const messages = messagesStorage.loadMessages(messagesCount);
    messages.forEach(item => {
        const messageOptions = {
            message: item.text,
            userName: item.user.name,
            createdAt: new Date(item.createdAt),
            myMessage: (item.user.email === currentEmail),
        };
        showMessage(messageOptions, false);
    });
}

async function loadMessageHistory() {
    const callbackOptions = {};
    callbackOptions.onSuccess = async function (response) {
        const responseJSON = await response.json();
        const messages = responseJSON.messages;
        messagesStorage.saveMessages(messages);
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

function addLoadMessageHistoryListener() {
    UI.mainWindow.messageWrapper.mainElement.addEventListener('scroll', scrollMessagesHandler);
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

function scrollMessagesHandler() {
    const messagesWrapperYBottom = UI.mainWindow.messageWrapper.mainElement.getBoundingClientRect().bottom;
    const messagesListYBottom = UI.mainWindow.messagesList.getBoundingClientRect().bottom;
    const distanceToStartOfMessages = messagesListYBottom - messagesWrapperYBottom;
    UI.mainWindow.isPositioningForNewMessages = (distanceToStartOfMessages < 10);

    const messagesWrapperYTop = UI.mainWindow.messageWrapper.mainElement.getBoundingClientRect().top;
    const endOfMessagesFrameYBottom = UI.mainWindow.endOfMessagesText.getBoundingClientRect().bottom;
    const distanceToEndOfMessages = messagesWrapperYTop - endOfMessagesFrameYBottom;

    if (distanceToEndOfMessages > 100) return;

    showMessageHistory(LOADING_MESSAGE_COUNT);
}

// function scrollToLastHandler() {
//     const messagesWrapperYBottom = UI.mainWindow.messageWrapper.mainElement.getBoundingClientRect().bottom;
//     const messagesListYBottom = UI.mainWindow.messagesList.getBoundingClientRect().bottom;
//     console.log(messagesWrapperYBottom + " " + messagesListYBottom);
// }

async function successfulCodeConfirmHandler(tokenResponse) {
    const responseJSON = await tokenResponse.json();
    currentEmail = responseJSON.email;
    currentUserName = responseJSON.name;
    UI.settingsWindow.settingsList.chatName.setUserName(currentUserName);

    await loadMessageHistory();
    addLoadMessageHistoryListener();
    showMessageHistory(LOADING_MESSAGE_COUNT);
    socketOnMessageHandler(onMessageHandler);

    toggleWindow(UI.mainWindow)
    UI.mainWindow.messageWrapper.scrollToEnd();
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