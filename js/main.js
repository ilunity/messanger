import {CreateMessageElement, UI} from "./view.js";
import {getCookie, setCookie, deleteCookie} from "./cookieManager.js";
import {sendServerRequest, SendTokenRequest, tokenGetRequest, changeNameRequest, messageHistoryRequest} from "./network.js";

const TOKEN = 'token';
let currentUserName = '';
let currentWindow;

function showMessage(messageOptions) {
    const message = new CreateMessageElement(messageOptions);
    const messageNode = message.mainElement;

    UI.mainWindow.messagesList.append(messageNode);
    UI.mainWindow.messageWrapper.scrollToEnd();
}

function sendMessage() {
    const messageOptions = {
        message: UI.mainWindow.messageForm.getText(),
        userName: currentUserName,
        createdAt: new Date(),
        myMessage: true,
    }
    UI.mainWindow.messageForm.resetForm();

    showMessage(messageOptions);
}

async function showMessageHistory() {
    const callbackOptions = {
        async onSuccess(response) {
            const responseJSON = await response.json();
            alert(JSON.stringify(responseJSON));
        }
    }
    await messageHistoryRequest(callbackOptions);
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
    await SendTokenRequest(emailName, callbackOptions);

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
    toggleWindow(UI.mainWindow)

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