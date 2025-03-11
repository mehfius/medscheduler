const sendResponse = (res, status, code, message, data = null) => {
    const response = { code, message };
    if (data) response.data = data;
    return res.status(status).json(response);
};

module.exports = { sendResponse }; 