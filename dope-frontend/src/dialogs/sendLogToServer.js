import axios from 'axios';

export async function sendLogToServer(level, message) {
    try {
        const response = await axios.post(process.env.REACT_APP_DIGITAL_OCEAN_URL+'log', { level, message }, { responseType: 'json' });

        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(response.data.message);
    } catch (error) {
        console.error("Failed to send log to server: ", error);
    }
}
