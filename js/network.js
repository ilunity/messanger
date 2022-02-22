import {getCookie} from "./cookieManager.js";

const hostName = 'https://chat1-341409.oa.r.appspot.com/';


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
        const token = getCookie('token');
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body !== undefined) {
        fetchOptions.body = body;
    }


    try {
        const response = await fetch(url, fetchOptions);
        if (onSuccess !== undefined) onSuccess(response);
        return response;
    } catch (error) {
        onError(error);
    }
}

async function SendTokenRequest(emailName, callbackOptions) {
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

export {sendServerRequest, SendTokenRequest, tokenGetRequest, changeNameRequest, messageHistoryRequest};