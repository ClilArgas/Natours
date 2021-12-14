import axios from 'axios';
import { showAlert } from './alerts';
//type is either data/password
export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${
        type === 'data' ? 'updateMe' : 'updatePassword'
      }`,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type === 'data' ? 'Data' : 'Password'} Updated`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
