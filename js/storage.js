const messagesStorage = {
    messageHistoryStack: undefined,
    loadedCount: 0,

    saveMessages(messages) {
        const messagesStack = messages.reverse();
        this.messageHistoryStack = messagesStack;
    },

    loadMessages(loadingCount = undefined) {
        const messages = this.messageHistoryStack;
        if (!loadingCount) return messages;

        let lastLoadingMessageIndex = this.loadedCount + loadingCount;
        if (lastLoadingMessageIndex > messages.length) lastLoadingMessageIndex = messages.length;

        const loadingMessages = [];
        for (let i = this.loadedCount; i < lastLoadingMessageIndex; i++) {
            loadingMessages.push(messages[i]);
        }

        this.loadedCount += loadingCount;
        return loadingMessages;
    }
}

export {messagesStorage};