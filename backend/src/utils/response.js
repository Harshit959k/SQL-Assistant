export const respond = (res, data, code, error, success = true, status = 200) => {
    const responseObj = { success };

    if(data)
        responseObj.data = data;

    if(code) {
        responseObj.code = code;
        responseObj.error = error;
    }

    res.status(status).json(responseObj);
}
