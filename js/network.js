import {getCookie} from "./cookieManager.js";

const TOKEN = 'token';
const hostName = 'https://chat1-341409.oa.r.appspot.com/';
const webSocketUrl = 'ws://chat1-341409.oa.r.appspot.com/websockets?';

let socket;

async function sendServerRequest(requestPath, {method, body}, {onSuccess, onError}) {
    const url = hostName + requestPath;

    if (!onError) onError = alert;

    const fetchOptions = {
        method: method,
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        },
    }

    if (method !== 'POST') {
        const token = getCookie(TOKEN);
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body !== undefined) {
        fetchOptions.body = body;
    }


    try {
        const response = await fetch(url, fetchOptions);
        if (onSuccess !== undefined) await onSuccess(response);
        return response;
    } catch (error) {
        onError(error);
    }
}

async function sendTokenRequest(emailName, callbackOptions) {
    const pathRequest = `api/user`;
    const emailJSON = JSON.stringify({email: emailName});

    await sendServerRequest(pathRequest, {method: 'POST', body: emailJSON}, callbackOptions);
}

async function tokenGetRequest(callbackOptions) {
    const pathRequest = 'api/user/me';

    await sendServerRequest(pathRequest, {method: 'GET'}, callbackOptions);
}

async function changeNameRequest(newName, callbackOptions) {
    const pathRequest = `api/user`;
    const nameJSON = JSON.stringify({name: newName});


    await sendServerRequest(pathRequest, {method: 'PATCH', body: nameJSON}, callbackOptions);
}

async function messageHistoryRequest(callbackOptions) {
    const requestPath = 'api/messages/';

    await sendServerRequest(requestPath, {method: 'GET'}, callbackOptions);
}

function getWebSocket() {
    if (socket === undefined) {
        const token = getCookie(TOKEN);
        const fullUrl = webSocketUrl + token;

        socket = new WebSocket(fullUrl);
    }

    return socket;
}

function socketSendMessage(text) {
    const socket = getWebSocket();
    const textJSON = JSON.stringify({text});

    socket.send(textJSON);
}

function socketOnMessageHandler(handler) {
    const socket = getWebSocket();

    socket.onmessage = function (event) {
        const dataJSON = JSON.parse(event.data);
        handler(dataJSON);
    }
}

export {
    sendServerRequest,
    sendTokenRequest,
    tokenGetRequest,
    changeNameRequest,
    messageHistoryRequest,
    getWebSocket,
    socketSendMessage,
    socketOnMessageHandler
};