"use strict";
import {format} from 'date-fns';

function CreateMessageElement({message, userName, createdAt, myMessage = false}) {
    const messageClone = document.querySelector('#message-tmp').content.cloneNode(true);

    this.mainElement = messageClone.querySelector('.message-item');
    this.messageTextElement = this.mainElement.querySelector('.message-item__message');
    this.messageAuthorElement = this.mainElement.querySelector('.message-item__author');
    this.messageTimeElement = this.mainElement.querySelector('.message-item__time');

    this.setMessage = function (text) {
        this.messageTextElement.textContent = text;
    }
    this.markAsDelivered = function () {
        this.mainElement.classList.add('message-item_delivered');
    }
    this.markAsMyMessage = function () {
        this.mainElement.classList.add('message-item_my-message');
    }
    this.setTime = function (date) {
        this.messageTimeElement.textContent = format(date, 'HH:mm');
    }


    this.setMessage(message);
    this.setTime(createdAt);
    this.messageAuthorElement.textContent = userName;

    if (myMessage) {
        this.markAsMyMessage();
    } else {
        this.markAsDelivered();
    }
}

const UI = {
    mainWindow: {
        mainElement: document.querySelector('.main-window'),
        messageForm: {
            mainElement: document.querySelector('.main-window__message-form'),
            textElement: document.querySelector('.message-form__input'),
            getText() {
                return this.textElement.value;
            },
            resizeTextElement() {
                //todo сделать адаптивным
                const defaultHeight = 32;
                const maxHeight = 84;
                this.textElement.style.height = `${defaultHeight}px`;

                let newHeight = this.textElement.scrollHeight;
                newHeight = newHeight < defaultHeight ? defaultHeight:
                            newHeight > maxHeight ? maxHeight:
                            newHeight;

                this.textElement.style.height = `${newHeight}px`;
            },
            resetForm() {
                this.mainElement.reset();
                this.resizeTextElement();
            },
        },
        settingsBtn: document.querySelector('.main-window__settings-btn'),
        exitBtn: document.querySelector('.main-window__exit-btn'),
        messagesList: document.querySelector('.main-window__messages'),
        endOfMessagesText: document.querySelector('.messages-wrapper__messages-loaded-text'),
        isPositioningForNewMessages: true,
        messageWrapper: {
            mainElement: document.querySelector('.main-window__messages-wrapper'),
            scrollToEnd() {
                const scrollHeight = this.mainElement.scrollHeight;
                this.mainElement.scrollTop = scrollHeight;
            },
        },
        changeVisibility() {
            this.mainElement.classList.toggle('main-window_nonactive');
        },
    },
    settingsWindow: {
        mainElement: document.querySelector('.settings-window'),
        settingsList: {
            mainElement: document.querySelector('.settings-window__settings-list'),
            chatName: {
                mainElement: document.querySelector('.name-settings'),
                form: {
                    mainElement: document.querySelector('.name-settings__form'),
                    textElement: document.querySelector('.name-settings__input'),
                },
                getUserName() {
                    return this.form.textElement.value;
                },
                setUserName(userName) {
                    this.form.textElement.value = userName;
                },
                resetForm() {
                    this.form.mainElement.reset();
                },
            },
        },
        closeBtn: document.querySelector('.settings-window__close-btn'),
        changeVisibility() {
            this.mainElement.classList.toggle('settings-window_nonactive');
        },
    },
    authorizationWindow: {
        mainElement: document.querySelector('.authorization-window'),
        authorizationList: {
            mainElement: document.querySelector('.authorization-window__parameters-list'),
            email: {
                mainElement: document.querySelector('.email-parameter'),
                form: {
                    mainElement: document.querySelector('.email-parameter__form'),
                    textElement: document.querySelector('.email-parameter__input'),
                },
                getEmail() {
                    return this.form.textElement.value;
                },
                resetForm() {
                    this.form.mainElement.reset();
                },
            },
        },
        closeBtn: document.querySelector('.authorization-window__close-btn'),
        changeVisibility() {
            this.mainElement.classList.toggle('authorization-window_nonactive');
        },
    },
    codeConfirmWindow: {
        mainElement: document.querySelector('.confirm-window'),
        form: {
            mainElement: document.querySelector('.code-confirm__form'),
            textElement: document.querySelector('.code-confirm__input'),
            getText() {
                return this.textElement.value;
            },
            resetForm() {
                this.mainElement.reset();
            },
        },
        closeBtn: document.querySelector('.confirm-window__close-btn'),
        changeVisibility() {
            this.mainElement.classList.toggle('confirm-window_nonactive');
        },
    },
}

UI.mainWindow.messageForm.textElement.addEventListener('input', () => {
    UI.mainWindow.messageForm.resizeTextElement();
});
UI.mainWindow.messageForm.textElement.addEventListener('keydown', (event) => {
    if (event.code === "Enter") {
        if (!event.shiftKey) {
            const submitEvent = new Event('submit');
            UI.mainWindow.messageForm.mainElement.dispatchEvent(submitEvent);
            event.preventDefault();
        }
    }
});

export {CreateMessageElement, UI};