export const api = "http://127.0.0.1:8000/loom"

export const authApi = async (query, method, data) => {
    try {
        const response = await fetch(`${api}/${query}/`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const Error = await response.json();
            console.error("error Details", Error)
            return await Error
        }

        const result = await response.json();
        return result;
    } catch (e) {
        console.error('An error occurred:', e);
        throw e;
    }
};

export const RefreshTokenObtain = async (query, method, data = null) => {
    try {
        const response = await fetch(`${api}/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'refresh': localStorage.getItem('refresh') })
        })
        if (response.status == 401 && response.statusText == 'Unauthorized') {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            alert('please login');
        }
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('refresh', result.refresh);
            localStorage.setItem('access', result.access);
            // console.log(result);
            return fetchApi(query, method, data)
        }
        console.log(await response.json())
    }
    catch (e) {
        console.log('erorr ---> ', e)
    }
}

export const fetchApi = async function (query, method, data = null) {
    try {
        // console.log(localStorage.getItem('access'))
        const pulse = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + localStorage.getItem('access')
            },
        }
        if (data) pulse['body'] = JSON.stringify(data)
        if (localStorage.getItem('access')) pulse.headers['Authorization'] = 'Bearer ' +localStorage.getItem('access')

        const response = await fetch(`${api}/${query}/`, pulse)

        if (response.status == 401 && response.statusText == 'Unauthorized') {
            RefreshTokenObtain(query, method, data);
        }
        else {
            if (!response.ok) {
                const result = await response.json();
                console.error('Error: ' + JSON.stringify(result))
                return await {'error': result}
            }
            const result = await response.json();
            return await result
        }
    }
    catch (e) {
        console.error('An error occurred:', e);
    }
}