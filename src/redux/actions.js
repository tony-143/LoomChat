export const data = (data) => {
    return {
        type: 'data',
        data: data,
    };
};

export const peerConnection = (data) => {
    return {
        type: 'peerConnection',
        peerConnection: data
    };
};
