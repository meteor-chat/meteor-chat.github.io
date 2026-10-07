export const state = {
    messages: [],
    editIndex: null,
    isLoading: false,
    isStreamingChunk: false,
    currentView: "landing",
    templates: {},
    abortController: null,
    config: {
        max_message: 4000
    },
    jadwalData: null,
    usageLog: []
};