
const initialState = {
    socket : null,
    peerConnection : null,
};


const rootReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'data':
            return { ...state, socket: action.data };
        case 'connection':
            return { ...state, peerConnection: action.peerConnection };
        default:
            return state;
    }
};

export default rootReducer;